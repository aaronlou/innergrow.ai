# pyright: reportMissingImports=false
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from .models import Exam
from .serializers import ExamSerializer
from .storage_utils import gcs_manager

# Note: Discussion room views are imported dynamically to avoid circular imports

# AI services are no longer used for study plans

class ExamListCreateView(generics.ListCreateAPIView):
    """Exam list and create view"""
    
    permission_classes = [IsAuthenticated]
    serializer_class = ExamSerializer
    parser_classes = [MultiPartParser, FormParser]  # Support file uploads
    
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
    parser_classes = [MultiPartParser, FormParser]  # Support file uploads
    
    def get_queryset(self):
        """Get all exams (all users can view details)"""
        return Exam.objects.all()  # type: ignore
    
    def update(self, request, *args, **kwargs):
        """Only creator can update exam"""
        exam = self.get_object()
        user = request.user
        
        # Check permissions: only creator can update
        if user != exam.user:
            return Response({
                'success': False,
                'error': _('You do not have permission to update this exam'),
                'message': _('Only the creator can update this exam')
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_exam_material(request, exam_id):
    """Upload material file for an exam"""
    
    try:
        exam = get_object_or_404(Exam, id=exam_id)
        
        # Check permissions: only creator can upload materials
        if request.user != exam.user:
            return Response({
                'success': False,
                'error': _('You do not have permission to upload materials for this exam'),
                'message': _('Only the exam creator can upload materials')
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if file is provided
        if 'file' not in request.FILES:
            return Response({
                'success': False,
                'error': _('No file provided'),
                'message': _('Please select a file to upload')
            }, status=status.HTTP_400_BAD_REQUEST)
        
        uploaded_file = request.FILES['file']
        
        # Validate file
        try:
            from .validators import validate_exam_material
            validate_exam_material(uploaded_file)
        except ValidationError as e:
            return Response({
                'success': False,
                'error': str(e),
                'message': _('File validation failed')
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Save file to exam
        exam.material = uploaded_file
        exam.save()
        
        # Return updated exam data
        serializer = ExamSerializer(exam, context={'request': request})
        return Response({
            'success': True,
            'data': serializer.data,
            'message': _('Material uploaded successfully')
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'message': _('Failed to upload material')
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_exam_material(request, exam_id):
    """Delete material file for an exam"""
    
    try:
        exam = get_object_or_404(Exam, id=exam_id)
        
        # Check permissions: only creator can delete materials
        if request.user != exam.user:
            return Response({
                'success': False,
                'error': _('You do not have permission to delete materials for this exam'),
                'message': _('Only the exam creator can delete materials')
            }, status=status.HTTP_403_FORBIDDEN)
        
        if exam.material:
            # Delete the file from storage
            exam.material.delete(save=False)
            exam.material = None
            exam.save()
            
            return Response({
                'success': True,
                'message': _('Material deleted successfully')
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'error': _('No material to delete'),
                'message': _('This exam has no material file')
            }, status=status.HTTP_404_NOT_FOUND)
            
    except Exception as e:
        return Response({
                'success': False,
                'error': str(e),
                'message': _('Failed to delete material')
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_exam_material_info(request, exam_id):
    """Get detailed information about exam material file"""
    
    try:
        exam = get_object_or_404(Exam, id=exam_id)
        
        if not exam.material:
            return Response({
                'success': False,
                'error': _('No material file found'),
                'message': _('This exam has no material file')
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get file info from storage
        file_info = {
            'name': exam.material.name,
            'url': exam.material.url,
            'size': None,
            'content_type': None,
            'uploaded_at': exam.updated_at.isoformat() if exam.updated_at else None
        }
        
        # If using GCS, get additional metadata
        if hasattr(exam.material, 'name') and gcs_manager.client:
            # Extract blob name from file path
            blob_name = exam.material.name
            blob_info = gcs_manager.get_blob_info(blob_name)
            if blob_info:
                file_info.update({
                    'size': blob_info.get('size'),
                    'content_type': blob_info.get('content_type'),
                    'created': blob_info.get('created').isoformat() if blob_info.get('created') else None,
                    'updated': blob_info.get('updated').isoformat() if blob_info.get('updated') else None
                })
        
        return Response({
            'success': True,
            'data': {
                'exam_id': exam.id,
                'exam_title': exam.title,
                'material': file_info
            },
            'message': _('Material info retrieved successfully')
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'message': _('Failed to retrieve material info')
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_material_download_url(request, exam_id):
    """Generate a temporary download URL for exam material (for private files)"""
    
    try:
        exam = get_object_or_404(Exam, id=exam_id)
        
        if not exam.material:
            return Response({
                'success': False,
                'error': _('No material file found'),
                'message': _('This exam has no material file')
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check permissions: exam creator or discussion room members can download
        if request.user != exam.user and not exam.is_discussion_member(request.user):
            return Response({
                'success': False,
                'error': _('You do not have permission to download this material'),
                'message': _('Only exam creator and discussion room members can download materials')
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get expiration time from request (default 1 hour)
        expiration_minutes = request.data.get('expiration_minutes', 60)
        if expiration_minutes > 1440:  # Max 24 hours
            expiration_minutes = 1440
        
        # Generate signed URL if using GCS
        download_url = exam.material.url  # Default public URL
        
        if gcs_manager.client and hasattr(exam.material, 'name'):
            blob_name = exam.material.name
            signed_url = gcs_manager.generate_signed_url(blob_name, expiration_minutes)
            if signed_url:
                download_url = signed_url
        
        return Response({
            'success': True,
            'data': {
                'download_url': download_url,
                'expires_in_minutes': expiration_minutes,
                'file_name': exam.material.name.split('/')[-1] if exam.material.name else 'material'
            },
            'message': _('Download URL generated successfully')
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'message': _('Failed to generate download URL')
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_user_materials(request):
    """List all materials uploaded by the current user"""
    
    try:
        user_exams = Exam.objects.filter(user=request.user, material__isnull=False)
        
        materials = []
        for exam in user_exams:
            material_info = {
                'exam_id': exam.id,
                'exam_title': exam.title,
                'material_name': exam.material.name.split('/')[-1] if exam.material.name else 'Unknown',
                'material_url': exam.material.url,
                'uploaded_at': exam.updated_at.isoformat() if exam.updated_at else None
            }
            
            # Get file size if available
            if gcs_manager.client and hasattr(exam.material, 'name'):
                blob_info = gcs_manager.get_blob_info(exam.material.name)
                if blob_info:
                    material_info['size'] = blob_info.get('size')
                    material_info['content_type'] = blob_info.get('content_type')
            
            materials.append(material_info)
        
        return Response({
            'success': True,
            'data': {
                'materials': materials,
                'total_count': len(materials)
            },
            'message': _('User materials retrieved successfully')
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'message': _('Failed to retrieve user materials')
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




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