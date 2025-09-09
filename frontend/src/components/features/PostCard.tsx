import React, { useState } from 'react';
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
  const { t } = useI18n();
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
        content: commentContent.trim(),
      });
      
      if (res.success && res.data) {
        setComments(prev => [...prev, res.data!]);
        setCommentContent('');
        setShowCommentForm(false);
        if (onCommentAdded) {
          onCommentAdded();
        }
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
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

  const getPostTypeLabel = (type: string) => {
    return t(`discussions.postType${type.charAt(0).toUpperCase() + type.slice(1)}`) || type;
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  };

  const netVotes = (post.upvotes || 0) - (post.downvotes || 0);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      <div className="flex">
        {/* Left sidebar - Voting */}
        <div className="flex flex-col items-center py-2 px-2 bg-gray-50 dark:bg-gray-900 rounded-l-lg">
          <button
            onClick={() => handleVote('up')}
            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
              post.user_vote === 'up' 
                ? 'text-orange-500' 
                : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 3l6 7H4l6-7z"/>
            </svg>
          </button>
          
          <div className={`text-xs font-bold my-1 ${
            netVotes > 0 
              ? 'text-orange-500' 
              : netVotes < 0 
                ? 'text-blue-500' 
                : 'text-gray-500'
          }`}>
            {netVotes > 0 ? '+' : ''}{netVotes}
          </div>
          
          <button
            onClick={() => handleVote('down')}
            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
              post.user_vote === 'down' 
                ? 'text-blue-500' 
                : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 17l-6-7h12l-6 7z"/>
            </svg>
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 p-3">
          {/* Post header */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-[10px]">
                {post.author_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-300">u/{post.author_name}</span>
            </div>
            <span>•</span>
            <span>{getTimeAgo(new Date(post.created_at))}</span>
            {post.is_pinned && (
              <>
                <span>•</span>
                <span className="text-green-600 dark:text-green-400 font-medium">📌 Pinned</span>
              </>
            )}
          </div>

          {/* Post type badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPostTypeColor(post.post_type)}`}>
              {getPostTypeLabel(post.post_type)}
            </span>
          </div>

          {/* Post title */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 leading-tight hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
            {post.title}
          </h3>

          {/* Post content preview */}
          <div className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            <p className="line-clamp-3">{post.content}</p>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {post.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Attachments */}
          {post.attachments && post.attachments.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Attachments:</div>
              <div className="space-y-1">
                {post.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    <span>📎</span>
                    <span>{attachment.name}</span>
                    {attachment.size && (
                      <span className="text-gray-500">
                        ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Bottom actions bar */}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <button
              onClick={() => {
                if (showComments) {
                  loadComments();
                }
                setShowCommentForm(!showCommentForm);
              }}
              className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              <span>{post.comments_count} {t('discussions.comments') || 'Comments'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments section */}
      {showCommentForm && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3">
          <textarea
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder={t('discussions.writeComment') || 'Write a comment...'}
            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            rows={3}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setShowCommentForm(false)}
              className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              {t('common.cancel') || 'Cancel'}
            </button>
            <button
              onClick={handleSubmitComment}
              disabled={!commentContent.trim() || submittingComment}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingComment ? (t('common.submitting') || 'Submitting...') : (t('discussions.comment') || 'Comment')}
            </button>
          </div>
        </div>
      )}

      {/* Comments list */}
      {showComments && comments.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {loadingComments ? (
            <div className="p-4 text-center text-sm text-gray-500">
              {t('common.loading') || 'Loading...'}
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

interface CommentItemProps {
  comment: Comment;
  level?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, level = 0 }) => {
  const { t } = useI18n();
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
        parent_id: comment.id,
      });
      
      if (res.success && res.data) {
        setReplyContent('');
        setShowReplyForm(false);
        // Refresh comments or update parent
      }
    } catch (error) {
      console.error('Failed to submit reply:', error);
    } finally {
      setSubmittingReply(false);
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  };

  if (comment.is_deleted) {
    return (
      <div className="p-3 text-sm text-gray-500 italic">
        [Comment deleted]
      </div>
    );
  }

  const netVotes = (comment.upvotes || 0) - (comment.downvotes || 0);

  return (
    <div className={`border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${level > 0 ? 'ml-6' : ''}`}>
      <div className="p-3">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
          <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-[8px]">
            {comment.author_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <span className="font-medium text-gray-700 dark:text-gray-300">u/{comment.author_name}</span>
          <span>•</span>
          <span>{getTimeAgo(new Date(comment.created_at))}</span>
        </div>

        <div className="text-sm text-gray-900 dark:text-gray-100 mb-2">
          {comment.content}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleVote('up')}
              className={`p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
                comment.user_vote === 'up' ? 'text-orange-500' : 'hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 3l6 7H4l6-7z"/>
              </svg>
            </button>
            <span className={`font-medium ${netVotes > 0 ? 'text-orange-500' : netVotes < 0 ? 'text-blue-500' : ''}`}>
              {netVotes}
            </span>
            <button
              onClick={() => handleVote('down')}
              className={`p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
                comment.user_vote === 'down' ? 'text-blue-500' : 'hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 17l-6-7h12l-6 7z"/>
              </svg>
            </button>
          </div>

          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="hover:text-gray-700 dark:hover:text-gray-300"
          >
            {t('discussions.reply') || 'Reply'}
          </button>
        </div>

        {showReplyForm && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={t('discussions.writeReply') || 'Write a reply...'}
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded resize-none bg-white dark:bg-gray-800"
              rows={2}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setShowReplyForm(false)}
                className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleSubmitReply}
                disabled={!replyContent.trim() || submittingReply}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {submittingReply ? (t('common.submitting') || 'Submitting...') : (t('discussions.reply') || 'Reply')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
