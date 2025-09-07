from rest_framework import serializers
from .models import Exam

class ExamSerializer(serializers.ModelSerializer):
	class Meta:
		model = Exam
		fields = ['id', 'title', 'description', 'category', 'exam_time', 'material', 'created_at', 'updated_at']
		read_only_fields = ['user', 'created_at', 'updated_at']