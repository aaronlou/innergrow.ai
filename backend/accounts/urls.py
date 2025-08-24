from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    # 认证相关
    path('auth/register/', views.register_view, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/check-email/', views.check_email_view, name='check_email'),
    
    # 用户信息
    path('profile/', views.user_profile_view, name='user_profile'),
    path('profile/update/', views.update_profile_view, name='update_profile'),
    
    # 用户偏好
    path('preferences/', views.UserPreferencesView.as_view(), name='user_preferences'),
]