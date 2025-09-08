from django.urls import path
from . import views

urlpatterns = [
    # Feature management
    path('features/', views.WaitlistFeatureListView.as_view(), name='waitlist-features'),
    
    # User waitlist management
    path('my-waitlists/', views.UserWaitlistView.as_view(), name='user-waitlists'),
    path('join/<str:feature_name>/', views.join_waitlist, name='join-waitlist'),
    path('leave/<str:feature_name>/', views.leave_waitlist, name='leave-waitlist'),
    path('status/<str:feature_name>/', views.waitlist_status, name='waitlist-status'),
]
