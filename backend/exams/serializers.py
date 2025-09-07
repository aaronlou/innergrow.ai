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
	participants = ExamParticipantSerializer(many=True, read_only=True)
	is_creator = serializers.SerializerMethodField()
	is_participant = serializers.SerializerMethodField()
	exam_time = serializers.DateField()  # 明确指定为DateField
	
	class Meta:
		model = Exam
		fields = ['id', 'title', 'description', 'category', 'exam_time', 'material', 
				 'created_at', 'updated_at', 'participants', 'is_creator', 'is_participant']
		read_only_fields = ['user', 'created_at', 'updated_at', 'participants']
	
	def get_is_creator(self, obj):
		"""Check if the current user is the creator of the exam"""
		request = self.context.get('request')
		if request and hasattr(request, 'user'):
			return obj.user == request.user
		return False
	
	def get_is_participant(self, obj):
		"""Check if the current user is a participant of the exam"""
		request = self.context.get('request')
		if request and hasattr(request, 'user'):
			return obj.is_participant(request.user) or obj.user == request.user
		return False