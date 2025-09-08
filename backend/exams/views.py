# pyright: reportMissingImports=false
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import models
from django.utils.translation import gettext_lazy as _
from .models import Exam
from .serializers import ExamSerializer

# Note: Discussion room views are imported dynamically to avoid circular imports

# AI services are no longer used for study plans

class ExamListCreateView(generics.ListCreateAPIView):
    """Exam list and create view"""
    
    permission_classes = [IsAuthenticated]
    serializer_class = ExamSerializer
    
    def get_queryset(self):
        """Get all exams (visible to all users)"""
        return Exam.objects.all()  # type: ignore
    
    def perform_create(self, serializer):
        """Create exam and associate with current user"""
        serializer.save(user=self.request.user)

class ExamDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Exam detail view"""
    
    permission_classes = [IsAuthenticated]
    serializer_class = ExamSerializer
    
    def get_queryset(self):
        """Get all exams (all users can view details)"""
        return Exam.objects.all()  # type: ignore
    
    def update(self, request, *args, **kwargs):
        """Only creator and participants can update exam"""
        exam = self.get_object()
        user = request.user
        
        # Check permissions: only creator and participants can update
        if user != exam.user and not exam.is_participant(user):
            return Response({
                'success': False,
                'error': _('You do not have permission to update this exam'),
                'message': _('Only the creator and participants can update this exam')
            }, status=status.HTTP_403_FORBIDDEN)
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Only creator can delete exam"""
        exam = self.get_object()
        user = request.user
        
        # Check permissions: only creator can delete
        if user != exam.user:
            return Response({
                'success': False,
                'error': _('You do not have permission to delete this exam'),
                'message': _('Only the creator can delete this exam')
            }, status=status.HTTP_403_FORBIDDEN)
        
        return super().destroy(request, *args, **kwargs)




# Discussion room views (to avoid circular imports)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_discussion_room(request, exam_id):
    """Get exam discussion room"""
    from discussions.models import DiscussionRoom
    from discussions.serializers import DiscussionRoomSerializer
    
    exam = get_object_or_404(Exam, id=exam_id)
    
    # Get or create discussion room
    room, created = exam.get_or_create_discussion_room()
    
    serializer = DiscussionRoomSerializer(room, context={'request': request})
    return Response({
        'success': True,
        'data': serializer.data,
        'message': _('Successfully retrieved discussion room')
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_discussion_room(request, exam_id):
    """Join discussion room"""
    from discussions.models import DiscussionRoom
    from discussions.serializers import DiscussionRoomSerializer
    
    exam = get_object_or_404(Exam, id=exam_id)
    
    # Get or create discussion room
    room, created = exam.get_or_create_discussion_room()
    
    # Check if already a member
    if room.is_member(request.user):
        serializer = DiscussionRoomSerializer(room, context={'request': request})
        return Response({
            'success': True,
            'data': serializer.data,
            'message': _('You are already a member of this discussion room')
        })
    
    # Join discussion room
    room.add_member(request.user)
    
    serializer = DiscussionRoomSerializer(room, context={'request': request})
    return Response({
        'success': True,
        'data': serializer.data,
        'message': _('Successfully joined discussion room')
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_discussion_room(request, exam_id):
    """Leave discussion room"""
    from discussions.models import DiscussionRoom
    
    exam = get_object_or_404(Exam, id=exam_id)
    
    room = exam.discussion_room
    if not room:
        return Response({
            'success': False,
            'error': _('Discussion room does not exist')
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check if is member
    if not room.is_member(request.user):
        return Response({
            'success': False,
            'error': _('You are not a member of this discussion room')
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Leave discussion room
    room.remove_member(request.user)
    
    return Response({
        'success': True,
        'data': None,
        'message': _('Successfully left discussion room')
    })