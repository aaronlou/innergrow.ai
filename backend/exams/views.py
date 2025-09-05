from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Exam
from .serializers import ExamSerializer

# Import the new AI service for exams (when implemented)
try:
    from ai_services.exam_suggestions import ExamSuggestionService
    AI_SERVICE_AVAILABLE = True
except ImportError:
    AI_SERVICE_AVAILABLE = False

class ExamListCreateView(generics.ListCreateAPIView):
    """考试列表和创建视图"""
    
    permission_classes = [IsAuthenticated]
    serializer_class = ExamSerializer
    
    def get_queryset(self):
        """获取当前用户的考试"""
        return Exam.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """创建考试时关联当前用户"""
        serializer.save(user=self.request.user)

class ExamDetailView(generics.RetrieveUpdateDestroyAPIView):
    """考试详情视图"""
    
    permission_classes = [IsAuthenticated]
    serializer_class = ExamSerializer
    
    def get_queryset(self):
        """获取当前用户的考试"""
        return Exam.objects.filter(user=self.request.user)

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
            'error': 'AI service not available',
            'message': 'AI服务不可用'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    exam = get_object_or_404(Exam, id=exam_id, user=request.user)
    
    try:
        # Initialize the AI service
        ai_service = ExamSuggestionService()
        
        # Generate study plan using OpenAI's ChatGPT
        study_plan_data = ai_service.generate_study_plan(exam, language, model)
        
        # For now, just return the study plan data
        # In a full implementation, you would save this to a model
        return Response({
            'success': True,
            'data': study_plan_data,
            'message': 'Study plan generated successfully' if language != 'zh' else '学习计划已生成'
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'message': 'Failed to generate study plan' if language != 'zh' else '生成学习计划失败'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)