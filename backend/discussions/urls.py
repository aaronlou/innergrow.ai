from django.urls import path
from . import views

urlpatterns = [
    # Discussion Room endpoints (accessed via exams)
    # These will be included in exams/urls.py
    
    # Direct discussion room endpoints
    path('<int:room_id>/posts/', views.PostListCreateView.as_view(), name='room-posts'),
    
    # Post endpoints
    path('posts/<int:pk>/', views.PostDetailView.as_view(), name='post-detail'),
    path('posts/<int:post_id>/vote/', views.vote_post, name='post-vote'),
    path('posts/<int:post_id>/comments/', views.CommentListCreateView.as_view(), name='post-comments'),
    
    # Comment endpoints
    path('comments/<int:comment_id>/vote/', views.vote_comment, name='comment-vote'),
]
