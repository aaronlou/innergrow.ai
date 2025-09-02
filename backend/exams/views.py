from django.shortcuts import render


from rest_framework import generics, permissions
from .models import Exam
from .serializers import ExamSerializer

class ExamCreateAPIView(generics.CreateAPIView):
	queryset = Exam.objects.all()
	serializer_class = ExamSerializer
	permission_classes = [permissions.AllowAny]
