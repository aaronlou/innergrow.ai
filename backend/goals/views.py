from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Count
from .models import Goal, AISuggestion, GoalCategory, GoalStatus
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
    statuses = GoalStatus.objects.all()
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
    
    # 这里应该调用实际的AI服务来生成建议
    # 目前我们创建一些模拟的建议
    
    # 删除现有的AI建议（如果有的话）
    AISuggestion.objects.filter(goal=goal).delete()
    
    # 创建模拟的AI建议
    suggestions_data = [
        {
            'goal': goal,
            'title': '制定详细计划',
            'description': '将目标分解为每周具体任务',
            'priority': 'high'
        },
        {
            'goal': goal,
            'title': '设置里程碑',
            'description': '为长期目标设置阶段性检查点',
            'priority': 'medium'
        },
        {
            'goal': goal,
            'title': '寻找学习资源',
            'description': '查找相关书籍、课程或导师',
            'priority': 'low'
        }
    ]
    
    # 批量创建建议
    suggestions = []
    for suggestion_data in suggestions_data:
        suggestion = AISuggestion.objects.create(**suggestion_data)
        suggestions.append(suggestion)
    
    serializer = AISuggestionSerializer(suggestions, many=True)
    
    return Response({
        'success': True,
        'data': serializer.data,
        'message': 'AI建议已生成'
    })


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