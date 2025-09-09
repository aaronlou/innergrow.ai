from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.ExamListCreateView.as_view(), name='exam-list-create'),
    path('<int:pk>/', views.ExamDetailView.as_view(), name='exam-detail'),
    
    # Material upload endpoints
    path('<int:exam_id>/upload-material/', views.upload_exam_material, name='upload-exam-material'),
    path('<int:exam_id>/delete-material/', views.delete_exam_material, name='delete-exam-material'),
    path('<int:exam_id>/material-info/', views.get_exam_material_info, name='get-exam-material-info'),
    path('<int:exam_id>/download-url/', views.generate_material_download_url, name='generate-material-download-url'),
    
    # User materials management
    path('my-materials/', views.list_user_materials, name='list-user-materials'),
    
    # Discussion room endpoints
    path('<int:exam_id>/discussion-room/', views.get_discussion_room, name='get-discussion-room'),
    path('<int:exam_id>/discussion-room/join/', views.join_discussion_room, name='join-discussion-room'),
    path('<int:exam_id>/discussion-room/leave/', views.leave_discussion_room, name='leave-discussion-room'),
]