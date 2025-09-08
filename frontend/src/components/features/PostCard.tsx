import React, { useState } from 'react';
import { Card, CardContent, CardHeader, Button } from '@/components/ui';
import { useI18n } from '@/contexts';
import { Post, Comment } from '@/types';
import { discussionsService } from '@/lib/api/discussions';

interface PostCardProps {
  post: Post;
  onVote?: (postId: string, voteType: 'up' | 'down' | 'remove') => void;
  onCommentAdded?: () => void;
  showComments?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onVote, 
  onCommentAdded,
  showComments = false 
}) => {
  const { t, formatDate } = useI18n();
  const [comments, setComments] = useState<Comment[]>([]);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const handleVote = async (voteType: 'up' | 'down') => {
    const currentVote = post.user_vote;
    const newVoteType = currentVote === voteType ? 'remove' : voteType;
    
    if (onVote) {
      onVote(post.id, newVoteType);
    } else {
      try {
        await discussionsService.votePost(post.id, newVoteType);
        // Optimistically update UI if needed
      } catch (error) {
        console.error('Failed to vote:', error);
      }
    }
  };

  const loadComments = async () => {
    if (comments.length > 0) return;
    
    setLoadingComments(true);
    try {
      const res = await discussionsService.getComments(post.id);
      if (res.success && res.data) {
        setComments(res.data);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentContent.trim()) return;
    
    setSubmittingComment(true);
    try {
      const res = await discussionsService.createComment(post.id, {
        content: commentContent.trim()
      });
      
      if (res.success && res.data) {
        setComments(prev => [...prev, res.data!]);
        setCommentContent('');
        setShowCommentForm(false);
        if (onCommentAdded) onCommentAdded();
      }
    } catch (error) {
      console.error('Failed to create comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const getPostTypeColor = (type: string) => {
    const colors = {
      question: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      resource: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      experience: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      note: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      discussion: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
    return colors[type as keyof typeof colors] || colors.discussion;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPostTypeColor(post.post_type)}`}>
                {t(`discussions.postType${post.post_type.charAt(0).toUpperCase() + post.post_type.slice(1)}`)}
              </span>
              {post.is_pinned && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  📌 {t('discussions.pinned')}
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold mb-1">{post.title}</h3>
            <div className="text-sm text-muted-foreground mb-2">
              {t('discussions.by')} {post.author_name} • {formatDate(new Date(post.created_at), { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none mb-4">
          <p className="whitespace-pre-wrap">{post.content}</p>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {post.tags.map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {post.attachments && post.attachments.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium mb-2">{t('discussions.attachments')}:</div>
            <div className="space-y-1">
              {post.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  <span>📎</span>
                  <span>{attachment.name}</span>
                  {attachment.size && (
                    <span className="text-muted-foreground">
                      ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 pt-2 border-t border-border">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={post.user_vote === 'up' ? 'default' : 'outline'}
              onClick={() => handleVote('up')}
              className="h-8 px-2"
            >
              👍 {post.upvotes}
            </Button>
            <Button
              size="sm"
              variant={post.user_vote === 'down' ? 'default' : 'outline'}
              onClick={() => handleVote('down')}
              className="h-8 px-2"
            >
              👎 {post.downvotes}
            </Button>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (showComments) {
                loadComments();
              }
              setShowCommentForm(!showCommentForm);
            }}
            className="h-8"
          >
            💬 {post.comments_count} {t('discussions.replies')}
          </Button>
        </div>

        {showCommentForm && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder={t('discussions.writeComment')}
              className="w-full p-2 text-sm border border-border rounded resize-none bg-background"
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowCommentForm(false);
                  setCommentContent('');
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!commentContent.trim() || submittingComment}
              >
                {submittingComment ? t('common.loading') : t('discussions.reply')}
              </Button>
            </div>
          </div>
        )}

        {showComments && comments.length > 0 && (
          <div className="mt-4 space-y-3">
            {loadingComments ? (
              <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
            ) : (
              comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface CommentItemProps {
  comment: Comment;
  level?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, level = 0 }) => {
  const { t, formatDate } = useI18n();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const handleVote = async (voteType: 'up' | 'down') => {
    const currentVote = comment.user_vote;
    const newVoteType = currentVote === voteType ? 'remove' : voteType;
    
    try {
      await discussionsService.voteComment(comment.id, newVoteType);
      // Optimistically update UI if needed
    } catch (error) {
      console.error('Failed to vote on comment:', error);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;
    
    setSubmittingReply(true);
    try {
      const res = await discussionsService.createComment(comment.post_id, {
        content: replyContent.trim(),
        parent_id: comment.id
      });
      
      if (res.success) {
        setReplyContent('');
        setShowReplyForm(false);
        // Should trigger a refresh of the comment tree
      }
    } catch (error) {
      console.error('Failed to create reply:', error);
    } finally {
      setSubmittingReply(false);
    }
  };

  if (comment.is_deleted) {
    return (
      <div className={`pl-${Math.min(level * 4, 16)} text-sm text-muted-foreground italic`}>
        [Comment deleted]
      </div>
    );
  }

  return (
    <div className={`${level > 0 ? `ml-${Math.min(level * 4, 16)}` : ''} border-l-2 border-muted pl-3`}>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="text-sm text-muted-foreground mb-1">
            {comment.author_name} • {formatDate(new Date(comment.created_at), { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
          <div className="text-sm mb-2 whitespace-pre-wrap">{comment.content}</div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleVote('up')}
              className="h-6 px-1 text-xs"
            >
              👍 {comment.upvotes}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleVote('down')}
              className="h-6 px-1 text-xs"
            >
              👎 {comment.downvotes}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="h-6 px-1 text-xs"
            >
              {t('discussions.reply')}
            </Button>
          </div>

          {showReplyForm && (
            <div className="mt-2 p-2 bg-muted rounded">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={t('discussions.writeReply')}
                className="w-full p-2 text-sm border border-border rounded resize-none bg-background"
                rows={2}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent('');
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim() || submittingReply}
                >
                  {submittingReply ? t('common.loading') : t('discussions.reply')}
                </Button>
              </div>
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-2">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} level={level + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
