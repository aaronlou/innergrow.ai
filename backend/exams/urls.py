from django.urls import path
from . import views

urlpatterns = [
    path('', views.ExamListCreateView.as_view(), name='exam-list-create'),
    path('<int:pk>/', views.ExamDetailView.as_view(), name='exam-detail'),
    path('<int:exam_id>/study-plan/', views.generate_study_plan, name='generate-study-plan'),
]