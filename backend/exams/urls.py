from django.urls import path
from .views import ExamCreateAPIView

urlpatterns = [
    path('create/', ExamCreateAPIView.as_view(), name='exam-create'),
]
