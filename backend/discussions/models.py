from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class DiscussionRoom(models.Model):
    """Discussion room model"""
    exam = models.OneToOneField('exams.Exam', on_delete=models.CASCADE, related_name='discussion_room')
    title = models.CharField(max_length=200, verbose_name=_('Room Title'))
    description = models.TextField(blank=True, verbose_name=_('Room Description'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        related_name='joined_discussion_rooms', 
        blank=True, 
        verbose_name=_('Members')
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('Discussion Room')
        verbose_name_plural = _('Discussion Rooms')

    def __str__(self):
        return f"{self.title} - {self.exam.title}"

    @property
    def posts_count(self):
        """Get posts count"""
        return self.posts.count()

    @property
    def members_count(self):
        """Get members count"""
        return self.members.count()

    def is_member(self, user):
        """Check if user is a member"""
        return self.members.filter(id=user.id).exists()

    def add_member(self, user):
        """Add member"""
        self.members.add(user)

    def remove_member(self, user):
        """Remove member"""
        self.members.remove(user)


class Post(models.Model):
    """Post model"""
    POST_TYPES = [
        ('discussion', _('Discussion')),
        ('question', _('Question')),
        ('resource', _('Resource')),
        ('experience', _('Experience')),
        ('note', _('Note')),
    ]

    room = models.ForeignKey(DiscussionRoom, on_delete=models.CASCADE, related_name='posts')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    title = models.CharField(max_length=200, verbose_name=_('Post Title'))
    content = models.TextField(verbose_name=_('Post Content'))
    post_type = models.CharField(max_length=20, choices=POST_TYPES, default='discussion')
    tags = models.JSONField(default=list, blank=True)
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_pinned', '-created_at']
        verbose_name = _('Post')
        verbose_name_plural = _('Posts')

    def __str__(self):
        return self.title

    @property
    def upvotes(self):
        """Get upvotes count"""
        return self.votes.filter(vote_type='up').count()

    @property
    def downvotes(self):
        """Get downvotes count"""
        return self.votes.filter(vote_type='down').count()

    @property
    def comments_count(self):
        """Get comments count"""
        return self.comments.count()

    def get_user_vote(self, user):
        """Get user vote"""
        if not user.is_authenticated:
            return None
        vote = self.votes.filter(user=user).first()
        return vote.vote_type if vote else None


class Comment(models.Model):
    """Comment model"""
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField(verbose_name=_('Comment Content'))
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = _('Comment')
        verbose_name_plural = _('Comments')

    def __str__(self):
        return f"Comment by {self.author.username} on {self.post.title}"

    @property
    def upvotes(self):
        """Get upvotes count"""
        return self.votes.filter(vote_type='up').count()

    @property
    def downvotes(self):
        """Get downvotes count"""
        return self.votes.filter(vote_type='down').count()

    def get_user_vote(self, user):
        """Get user vote"""
        if not user.is_authenticated:
            return None
        vote = self.votes.filter(user=user).first()
        return vote.vote_type if vote else None


class PostVote(models.Model):
    """Post vote model"""
    VOTE_TYPES = [
        ('up', _('Upvote')),
        ('down', _('Downvote')),
    ]

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='post_votes')
    vote_type = models.CharField(max_length=10, choices=VOTE_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('post', 'user')
        verbose_name = _('Post Vote')
        verbose_name_plural = _('Post Votes')


class CommentVote(models.Model):
    """Comment vote model"""
    VOTE_TYPES = [
        ('up', _('Upvote')),
        ('down', _('Downvote')),
    ]

    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comment_votes')
    vote_type = models.CharField(max_length=10, choices=VOTE_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('comment', 'user')
        verbose_name = _('Comment Vote')
        verbose_name_plural = _('Comment Votes')


class PostAttachment(models.Model):
    """Post attachment model"""
    ATTACHMENT_TYPES = [
        ('image', _('Image')),
        ('file', _('File')),
        ('link', _('Link')),
    ]

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='attachments')
    type = models.CharField(max_length=10, choices=ATTACHMENT_TYPES)
    name = models.CharField(max_length=200)
    url = models.URLField()
    size = models.IntegerField(null=True, blank=True)  # 文件大小（字节）
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Post Attachment')
        verbose_name_plural = _('Post Attachments')

    def __str__(self):
        return f"{self.name} ({self.type})"
