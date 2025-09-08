from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils.translation import gettext_lazy as _
from exams.models import Exam
from .models import DiscussionRoom, Post, Comment, PostVote, CommentVote
from .serializers import (
    DiscussionRoomSerializer, PostSerializer, CommentSerializer,
    CreatePostSerializer, CreateCommentSerializer
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_discussion_room(request, exam_id):
    """Get exam discussion room"""
    exam = get_object_or_404(Exam, id=exam_id)
    
    # Get or create discussion room
    room, created = DiscussionRoom.objects.get_or_create(
        exam=exam,
        defaults={
            'title': f"{exam.title} - Discussion Room",
            'description': f"Discussion room for {exam.title} exam"
        }
    )
    
    serializer = DiscussionRoomSerializer(room, context={'request': request})
    return Response({
        'success': True,
        'data': serializer.data,
        'message': _('Successfully retrieved discussion room')
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_discussion_room(request, exam_id):
    """Join discussion room"""
    exam = get_object_or_404(Exam, id=exam_id)
    
    # Get or create discussion room
    room, created = DiscussionRoom.objects.get_or_create(
        exam=exam,
        defaults={
            'title': f"{exam.title} - Discussion Room",
            'description': f"Discussion room for {exam.title} exam"
        }
    )
    
    # Check if already a member
    if room.is_member(request.user):
        serializer = DiscussionRoomSerializer(room, context={'request': request})
        return Response({
            'success': True,
            'data': serializer.data,
            'message': _('You are already a member of this discussion room')
        })
    
    # Join discussion room
    room.add_member(request.user)
    
    serializer = DiscussionRoomSerializer(room, context={'request': request})
    return Response({
        'success': True,
        'data': serializer.data,
        'message': _('Successfully joined discussion room')
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_discussion_room(request, exam_id):
    """Leave discussion room"""
    exam = get_object_or_404(Exam, id=exam_id)
    
    try:
        room = DiscussionRoom.objects.get(exam=exam)
    except DiscussionRoom.DoesNotExist:
        return Response({
            'success': False,
            'error': _('Discussion room does not exist')
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check if is member
    if not room.is_member(request.user):
        return Response({
            'success': False,
            'error': _('You are not a member of this discussion room')
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Leave discussion room
    room.remove_member(request.user)
    
    return Response({
        'success': True,
        'data': None,
        'message': _('Successfully left discussion room')
    })


class PostListCreateView(generics.ListCreateAPIView):
    """Post list and create view"""
    permission_classes = [IsAuthenticated]
    serializer_class = PostSerializer
    
    def get_queryset(self):
        room_id = self.kwargs.get('room_id')
        room = get_object_or_404(DiscussionRoom, id=room_id)
        
        queryset = room.posts.all()
        
        # Filter post type
        post_type = self.request.query_params.get('post_type')
        if post_type:
            queryset = queryset.filter(post_type=post_type)
        
        # Sort
        sort_by = self.request.query_params.get('sort', 'hot')
        if sort_by == 'new':
            queryset = queryset.order_by('-created_at')
        elif sort_by == 'top':
            # Sort by upvotes count (need calculation)
            queryset = queryset.extra(
                select={'vote_score': 'SELECT COUNT(*) FROM discussions_postvote WHERE post_id = discussions_post.id AND vote_type = "up"'}
            ).order_by('-vote_score', '-created_at')
        else:  # hot
            # Hot algorithm: combine time and upvotes
            queryset = queryset.extra(
                select={'hot_score': 'SELECT (COUNT(CASE WHEN vote_type = "up" THEN 1 END) - COUNT(CASE WHEN vote_type = "down" THEN 1 END)) * LOG(EXTRACT(EPOCH FROM NOW() - created_at) / 3600 + 1) FROM discussions_postvote WHERE post_id = discussions_post.id'}
            ).order_by('-hot_score', '-created_at')
        
        return queryset
    
    def perform_create(self, serializer):
        room_id = self.kwargs.get('room_id')
        room = get_object_or_404(DiscussionRoom, id=room_id)
        
        # Check if user is a member of the discussion room
        if not room.is_member(self.request.user):
            from rest_framework import serializers
            raise serializers.ValidationError(_('You need to join the discussion room first to post'))
        
        serializer.save(room=room, author=self.request.user)


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Post detail view"""
    permission_classes = [IsAuthenticated]
    serializer_class = PostSerializer
    queryset = Post.objects.all()
    
    def update(self, request, *args, **kwargs):
        post = self.get_object()
        if request.user != post.author:
            return Response({
                'success': False,
                'error': _('You can only edit your own posts')
            }, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        post = self.get_object()
        if request.user != post.author:
            return Response({
                'success': False,
                'error': _('You can only delete your own posts')
            }, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vote_post(request, post_id):
    """Vote for post"""
    post = get_object_or_404(Post, id=post_id)
    vote_type = request.data.get('vote_type')
    
    if vote_type not in ['up', 'down', 'remove']:
        return Response({
            'success': False,
            'error': _('Invalid vote type')
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get existing vote
    existing_vote = PostVote.objects.filter(post=post, user=request.user).first()
    
    if vote_type == 'remove':
        if existing_vote:
            existing_vote.delete()
    else:
        if existing_vote:
            existing_vote.vote_type = vote_type
            existing_vote.save()
        else:
            PostVote.objects.create(post=post, user=request.user, vote_type=vote_type)
    
    # Return updated post data
    serializer = PostSerializer(post, context={'request': request})
    return Response({
        'success': True,
        'data': serializer.data,
        'message': _('Vote successful')
    })


class CommentListCreateView(generics.ListCreateAPIView):
    """Comment list and create view"""
    permission_classes = [IsAuthenticated]
    serializer_class = CommentSerializer
    
    def get_queryset(self):
        post_id = self.kwargs.get('post_id')
        post = get_object_or_404(Post, id=post_id)
        return post.comments.filter(is_deleted=False)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateCommentSerializer
        return CommentSerializer
    
    def perform_create(self, serializer):
        post_id = self.kwargs.get('post_id')
        post = get_object_or_404(Post, id=post_id)
        
        # Check if user is a member of the discussion room
        if not post.room.is_member(self.request.user):
            from rest_framework import serializers
            raise serializers.ValidationError(_('You need to join the discussion room first to comment'))
        
        serializer.save(post=post, author=self.request.user)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vote_comment(request, comment_id):
    """Vote for comment"""
    comment = get_object_or_404(Comment, id=comment_id)
    vote_type = request.data.get('vote_type')
    
    if vote_type not in ['up', 'down', 'remove']:
        return Response({
            'success': False,
            'error': _('Invalid vote type')
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get existing vote
    existing_vote = CommentVote.objects.filter(comment=comment, user=request.user).first()
    
    if vote_type == 'remove':
        if existing_vote:
            existing_vote.delete()
    else:
        if existing_vote:
            existing_vote.vote_type = vote_type
            existing_vote.save()
        else:
            CommentVote.objects.create(comment=comment, user=request.user, vote_type=vote_type)
    
    # Return updated comment data
    serializer = CommentSerializer(comment, context={'request': request})
    return Response({
        'success': True,
        'data': serializer.data,
        'message': _('Vote successful')
    })