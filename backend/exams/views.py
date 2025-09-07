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

# Import the new AI service for exams (when implemented)
try:
    from ai_services.exam_suggestions import ExamSuggestionService
    AI_SERVICE_AVAILABLE = True
except ImportError:
    ExamSuggestionService = None
    AI_SERVICE_AVAILABLE = False

class ExamListCreateView(generics.ListCreateAPIView):
    """考试列表和创建视图"""
    
    permission_classes = [IsAuthenticated]
    serializer_class = ExamSerializer
    
    def get_queryset(self):
        """获取所有考试（所有用户都可以看到）"""
        return Exam.objects.all()  # type: ignore
    
    def perform_create(self, serializer):
        """创建考试时关联当前用户"""
        serializer.save(user=self.request.user)

class ExamDetailView(generics.RetrieveUpdateDestroyAPIView):
    """考试详情视图"""
    
    permission_classes = [IsAuthenticated]
    serializer_class = ExamSerializer
    
    def get_queryset(self):
        """获取所有考试（所有用户都可以查看详情）"""
        return Exam.objects.all()  # type: ignore
    
    def update(self, request, *args, **kwargs):
        """只允许创建者和参与者更新考试"""
        exam = self.get_object()
        user = request.user
        
        # 检查权限：只有创建者和参与者可以更新
        if user != exam.user and not exam.is_participant(user):
            return Response({
                'success': False,
                'error': _('You do not have permission to update this exam'),
                'message': _('Only the creator and participants can update this exam')
            }, status=status.HTTP_403_FORBIDDEN)
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """只允许创建者删除考试"""
        exam = self.get_object()
        user = request.user
        
        # 检查权限：只有创建者可以删除
        if user != exam.user:
            return Response({
                'success': False,
                'error': _('You do not have permission to delete this exam'),
                'message': _('Only the creator can delete this exam')
            }, status=status.HTTP_403_FORBIDDEN)
        
        return super().destroy(request, *args, **kwargs)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_exam(request, exam_id):
    """加入考试学习小组"""
    exam = get_object_or_404(Exam, id=exam_id)
    
    # Check if user is already a participant or the creator
    if request.user == exam.user:
        return Response({
            'success': False,
            'error': _('You are the creator of this exam'),
            'message': _('You are the creator of this exam')
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if exam.is_participant(request.user):
        return Response({
            'success': False,
            'error': _('You have already joined this exam group'),
            'message': _('You have already joined this exam group')
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Add user as participant
    exam.add_participant(request.user)
    
    serializer = ExamSerializer(exam, context={'request': request})
    return Response({
        'success': True,
        'data': serializer.data,
        'message': _('Successfully joined the exam study group')
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_exam(request, exam_id):
    """退出考试学习小组"""
    exam = get_object_or_404(Exam, id=exam_id)
    
    # Check if user is the creator (creator cannot leave)
    if request.user == exam.user:
        return Response({
            'success': False,
            'error': _('Exam creator cannot leave the group'),
            'message': _('Exam creator cannot leave the group')
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if user is a participant
    if not exam.is_participant(request.user):
        return Response({
            'success': False,
            'error': _('You are not a participant of this exam group'),
            'message': _('You are not a participant of this exam group')
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Remove user from participants
    exam.remove_participant(request.user)
    
    serializer = ExamSerializer(exam, context={'request': request})
    return Response({
        'success': True,
        'data': serializer.data,
        'message': _('Successfully left the exam study group')
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_study_plan(request, exam_id):
    """为特定考试生成学习计划"""
    
    # Get language preference from request (default to Chinese for backward compatibility)
    language = request.data.get('language', 'zh')
    
    # Get model preference from request (default to None to use the AI client's default)
    model = request.data.get('model', None)
    
    # Check if AI service is available
    if not AI_SERVICE_AVAILABLE:
        return Response({
            'success': False,
            'error': _('AI service not available'),
            'message': _('AI service not available')
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    exam = get_object_or_404(Exam, id=exam_id)
    
    # Check if user has access to this exam
    if request.user != exam.user and not exam.is_participant(request.user):
        return Response({
            'success': False,
            'error': _('You do not have access to this exam'),
            'message': _('You do not have access to this exam')
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Initialize the AI service
        if ExamSuggestionService is not None:
            ai_service = ExamSuggestionService()
        else:
            raise Exception(_("AI service not properly initialized"))
        
        # Generate study plan using OpenAI's ChatGPT
        study_plan_data = ai_service.generate_study_plan(exam, language, model)
        
        # For now, just return the study plan data
        # In a full implementation, you would save this to a model
        return Response({
            'success': True,
            'data': study_plan_data,
            'message': _('Study plan generated successfully') if language != 'zh' else _('学习计划已生成')
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'message': _('Failed to generate study plan') if language != 'zh' else _('生成学习计划失败')
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)