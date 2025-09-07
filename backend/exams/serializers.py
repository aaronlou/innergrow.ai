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
	creator = ExamParticipantSerializer(source='user', read_only=True)
	is_creator = serializers.SerializerMethodField()
	is_participant = serializers.SerializerMethodField()
	can_edit = serializers.SerializerMethodField()
	can_delete = serializers.SerializerMethodField()
	exam_time = serializers.DateField(format='%Y-%m-%d')  # 明确指定格式
	created_at = serializers.DateTimeField(read_only=True)
	updated_at = serializers.DateTimeField(read_only=True)
	
	class Meta:
		model = Exam
		fields = ['id', 'title', 'description', 'category', 'exam_time', 'material', 
				 'created_at', 'updated_at', 'creator', 'participants', 'is_creator', 
				 'is_participant', 'can_edit', 'can_delete']
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
	
	def get_can_edit(self, obj):
		"""Check if the current user can edit this exam"""
		request = self.context.get('request')
		if request and hasattr(request, 'user'):
			user = request.user
			return user == obj.user or obj.is_participant(user)
		return False
	
	def get_can_delete(self, obj):
		"""Check if the current user can delete this exam"""
		request = self.context.get('request')
		if request and hasattr(request, 'user'):
			return obj.user == request.user
		return False