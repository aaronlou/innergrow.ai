from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _
from .models import WaitlistFeature, WaitlistEntry
from .serializers import (
    WaitlistFeatureSerializer, 
    WaitlistEntrySerializer,
    JoinWaitlistSerializer
)


class WaitlistFeatureListView(generics.ListAPIView):
    """List all available waitlist features"""
    
    permission_classes = [IsAuthenticated]
    serializer_class = WaitlistFeatureSerializer
    
    def get_queryset(self):
        """Get all active features"""
        return WaitlistFeature.objects.filter(is_active=True)


class UserWaitlistView(generics.ListAPIView):
    """List current user's waitlist entries"""
    
    permission_classes = [IsAuthenticated]
    serializer_class = WaitlistEntrySerializer
    
    def get_queryset(self):
        """Get current user's active waitlist entries"""
        return WaitlistEntry.objects.filter(
            user=self.request.user,
            is_active=True
        ).select_related('feature')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_waitlist(request, feature_name):
    """Join a feature waitlist - simplified version"""
    
    try:
        # Get or create the feature
        feature, created = WaitlistFeature.objects.get_or_create(
            name=feature_name,
            defaults={
                'display_name': feature_name.replace('_', ' ').title(),
                'is_active': True
            }
        )
        
        # Create or update waitlist entry
        entry, entry_created = WaitlistEntry.objects.get_or_create(
            user=request.user,
            feature=feature,
            defaults={'is_active': True}
        )
        
        if not entry_created and not entry.is_active:
            # Reactivate if previously left
            entry.is_active = True
            entry.save()
        
        return Response({
            'success': True,
            'data': {
                'feature': feature_name,
                'joined': True,
                'total_count': feature.waitlist_count
            },
            'message': _('Successfully joined the waitlist')
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'message': _('Failed to join waitlist')
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_waitlist(request, feature_name):
    """Leave a feature waitlist"""
    
    try:
        feature = get_object_or_404(WaitlistFeature, name=feature_name, is_active=True)
        
        entry = get_object_or_404(
            WaitlistEntry,
            user=request.user,
            feature=feature,
            is_active=True
        )
        
        # Deactivate instead of delete to keep history
        entry.is_active = False
        entry.save()
        
        return Response({
            'success': True,
            'message': _('Successfully left the waitlist')
        }, status=status.HTTP_200_OK)
        
    except WaitlistEntry.DoesNotExist:
        return Response({
            'success': False,
            'error': _('You are not in this waitlist'),
            'message': _('You are not in this waitlist')
        }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'message': _('Failed to leave waitlist')
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def waitlist_status(request, feature_name):
    """Get user's status for a specific feature waitlist"""
    
    try:
        feature = get_object_or_404(WaitlistFeature, name=feature_name, is_active=True)
        
        try:
            entry = WaitlistEntry.objects.get(
                user=request.user,
                feature=feature,
                is_active=True
            )
            
            entry_serializer = WaitlistEntrySerializer(entry)
            return Response({
                'success': True,
                'data': {
                    'is_joined': True,
                    'entry': entry_serializer.data,
                    'position': None,  # Could implement position calculation
                    'total_count': feature.waitlist_count
                },
                'message': _('User is in waitlist')
            })
            
        except WaitlistEntry.DoesNotExist:
            return Response({
                'success': True,
                'data': {
                    'is_joined': False,
                    'entry': None,
                    'position': None,
                    'total_count': feature.waitlist_count
                },
                'message': _('User is not in waitlist')
            })
            
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'message': _('Failed to get waitlist status')
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
