
from rest_framework import serializers
from .models import Exam

class ExamSerializer(serializers.ModelSerializer):
	class Meta:
		model = Exam
		fields = ['id', 'title', 'summary', 'exam_time', 'material', 'created_at', 'updated_at']
