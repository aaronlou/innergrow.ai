# pyright: reportMissingImports=false
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from .models import Exam
from accounts.models import User

class ExamSerializer(serializers.ModelSerializer):
	exam_time = serializers.DateField(format='%Y-%m-%d')
	created_at = serializers.DateTimeField(read_only=True)
	updated_at = serializers.DateTimeField(read_only=True)
	user_id = serializers.CharField(source='user.id', read_only=True)
	user_name = serializers.CharField(source='user.username', read_only=True)
	
	# Discussion room related fields
	has_discussion_room = serializers.ReadOnlyField()
	discussion_members_count = serializers.ReadOnlyField()
	discussion_posts_count = serializers.ReadOnlyField()
	is_discussion_member = serializers.SerializerMethodField()
	
	class Meta:
		model = Exam
		fields = [
			'id', 'title', 'description', 'category', 'exam_time', 'material', 
			'created_at', 'updated_at', 'user_id', 'user_name', 
			'has_discussion_room', 'discussion_members_count', 
			'discussion_posts_count', 'is_discussion_member'
		]
		read_only_fields = ['created_at', 'updated_at']


	def get_is_discussion_member(self, obj):
		"""Check if current user is a discussion room member"""
		request = self.context.get('request')
		if request and request.user.is_authenticated:
			return obj.is_discussion_member(request.user)
		return False