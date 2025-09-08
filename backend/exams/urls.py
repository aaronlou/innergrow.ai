from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.ExamListCreateView.as_view(), name='exam-list-create'),
    path('<int:pk>/', views.ExamDetailView.as_view(), name='exam-detail'),
    
    # Discussion room endpoints
    path('<int:exam_id>/discussion-room/', views.get_discussion_room, name='get-discussion-room'),
    path('<int:exam_id>/discussion-room/join/', views.join_discussion_room, name='join-discussion-room'),
    path('<int:exam_id>/discussion-room/leave/', views.leave_discussion_room, name='leave-discussion-room'),
]