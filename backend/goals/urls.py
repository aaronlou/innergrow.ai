from django.urls import path
from . import views

app_name = 'goals'

urlpatterns = [
    # 用户自己的目标管理
    path('', views.GoalListCreateView.as_view(), name='goal-list-create'),
    path('<str:id>/', views.GoalDetailView.as_view(), name='goal-detail'),
    
    # 公开目标（所有用户可见）
    path('public/', views.PublicGoalListView.as_view(), name='public-goal-list'),
    path('public/<str:id>/', views.PublicGoalDetailView.as_view(), name='public-goal-detail'),
    
    # 目标分类和状态
    path('categories/', views.goal_categories, name='goal-categories'),
    path('statuses/', views.goal_statuses, name='goal-statuses'),
    path('categories/create/', views.create_goal_category, name='create-goal-category'),
    path('statuses/create/', views.create_goal_status, name='create-goal-status'),
    
    # 目标统计
    path('statistics/', views.goal_statistics, name='goal-statistics'),
    
    # 标记目标为完成
    path('<str:id>/complete/', views.mark_goal_complete, name='goal-complete'),
    
    # AI建议相关
    path('<str:id>/analyze/', views.analyze_goal_with_ai, name='goal-analyze'),
    path('<str:goal_id>/suggestions/', views.AISuggestionListView.as_view(), name='suggestion-list'),
    path('<str:goal_id>/suggestions/<str:suggestion_id>/accept/', views.accept_ai_suggestion, name='suggestion-accept'),
]