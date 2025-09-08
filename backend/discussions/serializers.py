from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import DiscussionRoom, Post, Comment, PostVote, CommentVote, PostAttachment

User = get_user_model()


class PostAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostAttachment
        fields = ['id', 'type', 'name', 'url', 'size']


class DiscussionRoomSerializer(serializers.ModelSerializer):
    exam_id = serializers.CharField(source='exam.id', read_only=True)
    posts_count = serializers.ReadOnlyField()
    members_count = serializers.ReadOnlyField()
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = DiscussionRoom
        fields = [
            'id', 'exam_id', 'title', 'description', 
            'created_at', 'updated_at', 'posts_count', 
            'members_count', 'is_member'
        ]
        read_only_fields = ['exam_id', 'created_at', 'updated_at']

    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.is_member(request.user)
        return False


class PostSerializer(serializers.ModelSerializer):
    room_id = serializers.CharField(source='room.id', read_only=True)
    author_id = serializers.CharField(source='author.id', read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)
    author_avatar = serializers.CharField(source='author.avatar', read_only=True)
    upvotes = serializers.ReadOnlyField()
    downvotes = serializers.ReadOnlyField()
    comments_count = serializers.ReadOnlyField()
    user_vote = serializers.SerializerMethodField()
    attachments = PostAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = [
            'id', 'room_id', 'author_id', 'author_name', 'author_avatar',
            'title', 'content', 'post_type', 'tags', 'upvotes', 'downvotes',
            'user_vote', 'comments_count', 'created_at', 'updated_at',
            'is_pinned', 'attachments'
        ]
        read_only_fields = ['room_id', 'created_at', 'updated_at', 'is_pinned']

    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_user_vote(request.user)
        return None


class CommentSerializer(serializers.ModelSerializer):
    post_id = serializers.CharField(source='post.id', read_only=True)
    author_id = serializers.CharField(source='author.id', read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)
    author_avatar = serializers.CharField(source='author.avatar', read_only=True)
    parent_id = serializers.CharField(source='parent.id', read_only=True)
    upvotes = serializers.ReadOnlyField()
    downvotes = serializers.ReadOnlyField()
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'post_id', 'author_id', 'author_name', 'author_avatar',
            'content', 'parent_id', 'upvotes', 'downvotes', 'user_vote',
            'created_at', 'updated_at', 'is_deleted'
        ]
        read_only_fields = ['post_id', 'created_at', 'updated_at']

    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_user_vote(request.user)
        return None


class CreatePostSerializer(serializers.ModelSerializer):
    attachments = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        allow_empty=True
    )

    class Meta:
        model = Post
        fields = ['title', 'content', 'post_type', 'tags', 'attachments']

    def create(self, validated_data):
        attachments_data = validated_data.pop('attachments', [])
        post = Post.objects.create(**validated_data)
        
        # 处理附件
        for i, attachment_file in enumerate(attachments_data):
            # 这里可以实现文件上传逻辑，比如上传到云存储
            # 暂时简化处理
            PostAttachment.objects.create(
                post=post,
                type='file',
                name=attachment_file.name,
                url=f'/media/attachments/{attachment_file.name}',  # 简化处理
                size=attachment_file.size
            )
        
        return post


class CreateCommentSerializer(serializers.ModelSerializer):
    parent_id = serializers.CharField(required=False, allow_null=True)

    class Meta:
        model = Comment
        fields = ['content', 'parent_id']

    def validate_parent_id(self, value):
        if value:
            try:
                parent = Comment.objects.get(id=value)
                return parent
            except Comment.DoesNotExist:
                raise serializers.ValidationError(_('Parent comment does not exist'))
        return None

    def create(self, validated_data):
        parent = validated_data.pop('parent_id', None)
        comment = Comment.objects.create(parent=parent, **validated_data)
        return comment
