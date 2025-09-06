# pyright: reportMissingImports=false
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Count
from .models import Goal, AISuggestion, GoalCategory, GoalStatus
from django.db import models


# Import the new AI service
try:
    from ai_services.goal_suggestions import GoalSuggestionService
    AI_SERVICE_AVAILABLE = True
except ImportError:
    AI_SERVICE_AVAILABLE = False

from .serializers import (
    GoalSerializer, 
    GoalCreateSerializer, 
    GoalUpdateSerializer,
    PublicGoalSerializer,
    AISuggestionSerializer,
    AISuggestionCreateSerializer,
    AISuggestionAcceptSerializer,
    GoalCategorySerializer,
    GoalStatusSerializer
)


class GoalListCreateView(generics.ListCreateAPIView):
    """目标列表和创建视图"""
    
    permission_classes = [IsAuthenticated]
    serializer_class = GoalSerializer
    
    def get_queryset(self):
        """获取当前用户的目标"""
        queryset = Goal.objects.filter(user=self.request.user).select_related('category', 'status')
        
        # 支持按状态过滤
        status_id = self.request.query_params.get('status_id', None)
        if status_id:
            queryset = queryset.filter(status_id=status_id)
            
        # 支持按分类过滤
        category_id = self.request.query_params.get('category_id', None)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
            
        # 支持按可见性过滤
        visibility = self.request.query_params.get('visibility', None)
        if visibility:
            queryset = queryset.filter(visibility=visibility)
            
        return queryset
    
    def get_serializer_class(self):
        """根据请求方法使用不同的序列化器"""
        if self.request.method == 'POST':
            return GoalCreateSerializer
        return GoalSerializer
    
    def list(self, request, *args, **kwargs):
        """获取目标列表并返回标准响应格式"""
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response({
                'success': True,
                'data': serializer.data
            })
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    def create(self, request, *args, **kwargs):
        """创建目标并返回标准响应格式"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        
        # Use the standard GoalSerializer for the response to ensure consistent structure
        response_serializer = GoalSerializer(serializer.instance)
        return Response({
            'success': True,
            'data': response_serializer.data
        }, status=status.HTTP_201_CREATED, headers=headers)


class GoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    """目标详情视图"""
    
    permission_classes = [IsAuthenticated]
    serializer_class = GoalSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        """获取当前用户的目标"""
        return Goal.objects.filter(user=self.request.user).select_related('category', 'status')
    
    def get_serializer_class(self):
        """根据请求方法使用不同的序列化器"""
        if self.request.method in ['PUT', 'PATCH']:
            return GoalUpdateSerializer
        return GoalSerializer
    
    def retrieve(self, request, *args, **kwargs):
        """获取目标详情并返回标准响应格式"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    def update(self, request, *args, **kwargs):
        """更新目标并返回标准序列化数据"""
        # First, perform the update using the update serializer
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Then, return the response using the standard serializer
        # This ensures the response structure is consistent
        response_serializer = GoalSerializer(instance)
        return Response({
            'success': True,
            'data': response_serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        """删除目标并返回标准响应格式"""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': '目标已删除'
        }, status=status.HTTP_204_NO_CONTENT)


class PublicGoalListView(generics.ListAPIView):
    """公开目标列表视图（所有用户可见）"""
    
    permission_classes = [AllowAny]
    serializer_class = PublicGoalSerializer
    
    def get_queryset(self):
        """获取所有公开的目标"""
        return Goal.objects.filter(visibility='public').select_related('category', 'status', 'user')


class PublicGoalDetailView(generics.RetrieveAPIView):
    """公开目标详情视图（所有用户可见）"""
    
    permission_classes = [AllowAny]
    serializer_class = PublicGoalSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        """获取所有公开的目标"""
        return Goal.objects.filter(visibility='public').select_related('category', 'status', 'user')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def goal_statistics(request):
    """获取目标统计信息"""
    user_goals = Goal.objects.filter(user=request.user)
    
    stats = {
        'total': user_goals.count(),
        'active': user_goals.filter(status__name_en='active').count(),
        'completed': user_goals.filter(status__name_en='completed').count(),
        'paused': user_goals.filter(status__name_en='paused').count(),
        'public': user_goals.filter(visibility='public').count(),
        'private': user_goals.filter(visibility='private').count(),
    }
    
    return Response({
        'success': True,
        'data': stats
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def goal_categories(request):
    """获取所有目标分类"""
    categories = GoalCategory.objects.all()
    serializer = GoalCategorySerializer(categories, many=True)
    
    return Response({
        'success': True,
        'data': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def goal_statuses(request):
    """获取所有目标状态"""
    statuses = GoalStatus.objects.all()  # type: models.QuerySet[GoalStatus]
    serializer = GoalStatusSerializer(statuses, many=True)
    
    return Response({
        'success': True,
        'data': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_goal_category(request):
    """创建新的目标分类"""
    serializer = GoalCategorySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '分类创建成功'
        }, status=status.HTTP_201_CREATED)
    else:
        return Response({
            'success': False,
            'error': '数据验证失败',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_goal_status(request):
    """创建新的目标状态"""
    serializer = GoalStatusSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '状态创建成功'
        }, status=status.HTTP_201_CREATED)
    else:
        return Response({
            'success': False,
            'error': '数据验证失败',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_goal_with_ai(request, goal_id):
    """为特定目标生成AI建议"""
    goal = get_object_or_404(Goal, id=goal_id, user=request.user)
    
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
    
    try:
        # Initialize the AI service
        ai_service = GoalSuggestionService()
        
        # Generate AI suggestions using OpenAI's ChatGPT
        suggestions_data = ai_service.generate_suggestions(goal, language, model)
        
        # Delete existing AI suggestions (if any)
        AISuggestion.objects.filter(goal=goal).delete()
        
        # Create new AI suggestions
        suggestions = []
        for suggestion_data in suggestions_data:
            suggestion_data['goal'] = goal
            suggestion = AISuggestion.objects.create(**suggestion_data)
            suggestions.append(suggestion)
        
        serializer = AISuggestionSerializer(suggestions, many=True)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'AI suggestions generated successfully' if language != 'zh' else 'AI建议已生成'
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'message': 'Failed to generate AI suggestions' if language != 'zh' else '生成AI建议失败'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AISuggestionListView(generics.ListAPIView):
    """获取特定目标的AI建议列表"""
    
    permission_classes = [IsAuthenticated]
    serializer_class = AISuggestionSerializer
    
    def get_queryset(self):
        """获取特定目标的AI建议"""
        goal_id = self.kwargs['goal_id']
        goal = get_object_or_404(Goal, id=goal_id, user=self.request.user)
        return AISuggestion.objects.filter(goal=goal)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_ai_suggestion(request, goal_id, suggestion_id):
    """接受AI建议"""
    goal = get_object_or_404(Goal, id=goal_id, user=request.user)
    suggestion = get_object_or_404(AISuggestion, id=suggestion_id, goal=goal)
    
    serializer = AISuggestionAcceptSerializer(data=request.data)
    if serializer.is_valid():
        accepted = serializer.validated_data['accepted']
        suggestion.accepted = accepted
        suggestion.save()
        
        return Response({
            'success': True,
            'data': AISuggestionSerializer(suggestion).data,
            'message': '建议状态已更新'
        })
    else:
        return Response({
            'success': False,
            'error': '数据验证失败',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_goal_complete(request, goal_id):
    """标记目标为完成"""
    goal = get_object_or_404(Goal, id=goal_id, user=request.user)
    
    # 获取或创建完成状态
    completed_status, _ = GoalStatus.objects.get_or_create(
        name='已完成',
        name_en='completed',
        defaults={'name': '已完成', 'name_en': 'completed'}
    )
    
    goal.status = completed_status
    goal.progress = 100
    goal.save()
    
    serializer = GoalSerializer(goal)
    
    return Response({
        'success': True,
        'data': serializer.data,
        'message': '目标已标记为完成'
    })