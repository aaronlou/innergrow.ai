from django.contrib import admin
from .models import DiscussionRoom, Post, Comment, PostVote, CommentVote, PostAttachment


@admin.register(DiscussionRoom)
class DiscussionRoomAdmin(admin.ModelAdmin):
    list_display = ['title', 'exam', 'members_count', 'posts_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['title', 'exam__title']
    readonly_fields = ['created_at', 'updated_at', 'posts_count', 'members_count']
    filter_horizontal = ['members']


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'room', 'post_type', 'is_pinned', 'upvotes', 'downvotes', 'created_at']
    list_filter = ['post_type', 'is_pinned', 'created_at']
    search_fields = ['title', 'content', 'author__username']
    readonly_fields = ['created_at', 'updated_at', 'upvotes', 'downvotes', 'comments_count']


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['author', 'post', 'parent', 'upvotes', 'downvotes', 'is_deleted', 'created_at']
    list_filter = ['is_deleted', 'created_at']
    search_fields = ['content', 'author__username', 'post__title']
    readonly_fields = ['created_at', 'updated_at', 'upvotes', 'downvotes']


@admin.register(PostVote)
class PostVoteAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'vote_type', 'created_at']
    list_filter = ['vote_type', 'created_at']
    search_fields = ['user__username', 'post__title']


@admin.register(CommentVote)
class CommentVoteAdmin(admin.ModelAdmin):
    list_display = ['user', 'comment', 'vote_type', 'created_at']
    list_filter = ['vote_type', 'created_at']
    search_fields = ['user__username']


@admin.register(PostAttachment)
class PostAttachmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'post', 'type', 'size', 'created_at']
    list_filter = ['type', 'created_at']
    search_fields = ['name', 'post__title']
