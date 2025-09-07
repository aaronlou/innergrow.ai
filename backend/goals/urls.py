from django.urls import path
from . import views

app_name = 'goals'

urlpatterns = [
    # 先放具体路径
    path('public/', views.PublicGoalListView.as_view(), name='public-goal-list'),
    path('categories/', views.goal_categories, name='goal-categories'),
    path('statuses/', views.goal_statuses, name='goal-statuses'),
    path('statistics/', views.goal_statistics, name='goal-statistics'),
    path('categories/create/', views.create_goal_category, name='create-goal-category'),
    path('statuses/create/', views.create_goal_status, name='create-goal-status'),
    
    # 然后放通配符路径
    path('', views.GoalListCreateView.as_view(), name='goal-list-create'),
    path('<str:id>/', views.GoalDetailView.as_view(), name='goal-detail'),
    path('<str:id>/complete/', views.mark_goal_complete, name='goal-complete'),
    path('<str:goal_id>/analyze/', views.analyze_goal_with_ai, name='goal-analyze'),
    
    # 最后放嵌套的通配符路径
    path('public/<str:id>/', views.PublicGoalDetailView.as_view(), name='public-goal-detail'),
    path('<str:goal_id>/suggestions/', views.AISuggestionListView.as_view(), name='suggestion-list'),
    path('<str:goal_id>/suggestions/<str:suggestion_id>/accept/', views.accept_ai_suggestion, name='suggestion-accept'),
]