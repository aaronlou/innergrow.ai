# pyright: reportMissingImports=false
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from .models import Exam
from accounts.models import User

class ExamParticipantSerializer(serializers.ModelSerializer):
	"""Serializer for exam participants"""
	id = serializers.IntegerField(read_only=True)
	username = serializers.CharField(read_only=True)
	
	class Meta:
		model = User
		fields = ['id', 'username']

class ExamSerializer(serializers.ModelSerializer):
	# 临时简化序列化器进行调试
	exam_time = serializers.DateField(format='%Y-%m-%d')
	created_at = serializers.DateTimeField(read_only=True)
	updated_at = serializers.DateTimeField(read_only=True)
	
	class Meta:
		model = Exam
		fields = ['id', 'title', 'description', 'category', 'exam_time', 'material', 
				 'created_at', 'updated_at']
		read_only_fields = ['created_at', 'updated_at']