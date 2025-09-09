import { ApiResponse, DiscussionRoom, Post, Comment, CreatePostData, CreateCommentData, PostType } from '@/types';
import { apiRequest } from '@/lib/api/client';

export const discussionsService = {
    // Discussion Room Management
    async getRoom(examId: string): Promise<ApiResponse<DiscussionRoom>> {
        const res = await apiRequest<unknown>(`/api/exams/${examId}/discussion-room/`, { method: 'GET' });
        if (res.success) {
            return { success: true, data: this._normalizeRoom(res.data) };
        }
        return res as ApiResponse<DiscussionRoom>;
    },

    async joinRoom(examId: string): Promise<ApiResponse<DiscussionRoom>> {
        const res = await apiRequest<unknown>(`/api/exams/${examId}/discussion-room/join/`, { method: 'POST' });
        if (res.success) {
            return { success: true, data: this._normalizeRoom(res.data) };
        }
        return res as ApiResponse<DiscussionRoom>;
    },

    async leaveRoom(examId: string): Promise<ApiResponse<null>> {
        const res = await apiRequest<null>(`/api/exams/${examId}/discussion-room/leave/`, { method: 'POST' });
        return res;
    },

    // Posts Management
    async getPosts(roomId: string, params?: {
        sort?: 'hot' | 'new' | 'top';
        post_type?: PostType;
        page?: number;
    }): Promise<ApiResponse<Post[]>> {
        const searchParams = new URLSearchParams();
        if (params?.sort) searchParams.set('sort', params.sort);
        if (params?.post_type) searchParams.set('post_type', params.post_type);
        if (params?.page) searchParams.set('page', params.page.toString());

        const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
        const res = await apiRequest<unknown>(`/api/discussion-rooms/${roomId}/posts${qs}`, { method: 'GET' });

        if (res.success) {
            const posts = this._normalizeList<unknown>(res.data).map(item => this._normalizePost(item));
            return { success: true, data: posts };
        }
        return res as ApiResponse<Post[]>;
    },

    async createPost(roomId: string, data: CreatePostData): Promise<ApiResponse<Post>> {
        let body: BodyInit;
        let headers: Record<string, string> | undefined;

        if (data.attachments && data.attachments.length > 0) {
            const form = new FormData();
            form.append('title', data.title);
            form.append('content', data.content);
            form.append('post_type', data.post_type);
            if (data.tags) {
                form.append('tags', JSON.stringify(data.tags));
            }
            data.attachments.forEach((file, index) => {
                form.append(`attachment_${index}`, file);
            });
            body = form;
        } else {
            body = JSON.stringify({
                title: data.title,
                content: data.content,
                post_type: data.post_type,
                tags: data.tags || [],
            });
            headers = { 'Content-Type': 'application/json' };
        }

        const res = await apiRequest<unknown>(`/api/discussion-rooms/${roomId}/posts/`, {
            method: 'POST',
            body,
            headers
        });

        if (res.success) {
            return { success: true, data: this._normalizePost(res.data) };
        }
        return res as ApiResponse<Post>;
    },

    async getPost(postId: string): Promise<ApiResponse<Post>> {
        const res = await apiRequest<unknown>(`/api/posts/${postId}/`, { method: 'GET' });
        if (res.success) {
            return { success: true, data: this._normalizePost(res.data) };
        }
        return res as ApiResponse<Post>;
    },

    async votePost(postId: string, voteType: 'up' | 'down' | 'remove'): Promise<ApiResponse<Post>> {
        const res = await apiRequest<unknown>(`/api/posts/${postId}/vote/`, {
            method: 'POST',
            body: JSON.stringify({ vote_type: voteType }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.success) {
            return { success: true, data: this._normalizePost(res.data) };
        }
        return res as ApiResponse<Post>;
    },

    // Comments Management
    async getComments(postId: string): Promise<ApiResponse<Comment[]>> {
        const res = await apiRequest<unknown>(`/api/posts/${postId}/comments/`, { method: 'GET' });

        if (res.success) {
            const comments = this._normalizeList<unknown>(res.data).map(item => this._normalizeComment(item));
            return { success: true, data: this._buildCommentTree(comments) };
        }
        return res as ApiResponse<Comment[]>;
    },

    async createComment(postId: string, data: CreateCommentData): Promise<ApiResponse<Comment>> {
        const res = await apiRequest<unknown>(`/api/posts/${postId}/comments/`, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.success) {
            return { success: true, data: this._normalizeComment(res.data) };
        }
        return res as ApiResponse<Comment>;
    },

    async voteComment(commentId: string, voteType: 'up' | 'down' | 'remove'): Promise<ApiResponse<Comment>> {
        const res = await apiRequest<unknown>(`/api/comments/${commentId}/vote/`, {
            method: 'POST',
            body: JSON.stringify({ vote_type: voteType }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.success) {
            return { success: true, data: this._normalizeComment(res.data) };
        }
        return res as ApiResponse<Comment>;
    },

    // Utility functions
    _normalizeList<T>(raw: unknown): T[] {
        if (Array.isArray(raw)) return raw as T[];
        if (!raw || typeof raw !== 'object') return [];
        const obj = raw as Record<string, unknown>;
        if ('data' in obj && Array.isArray((obj as { data?: unknown }).data)) return (obj as { data: T[] }).data;
        if ('results' in obj) {
            const resultsVal = (obj as { results?: unknown }).results;
            if (Array.isArray(resultsVal)) return resultsVal as T[];
        }
        return [];
    },

    _normalizeRoom(raw: unknown): DiscussionRoom {
        if (!raw || typeof raw !== 'object') {
            return {
                id: '',
                exam_id: '',
                title: '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                posts_count: 0,
                members_count: 0,
                is_member: false,
            };
        }

        const obj = raw as Record<string, unknown>;
        return {
            id: String(obj.id ?? ''),
            exam_id: String(obj.exam_id ?? ''),
            title: String(obj.title ?? ''),
            description: obj.description ? String(obj.description) : undefined,
            created_at: String(obj.created_at ?? new Date().toISOString()),
            updated_at: String(obj.updated_at ?? new Date().toISOString()),
            posts_count: Number(obj.posts_count ?? 0),
            members_count: Number(obj.members_count ?? 0),
            is_member: Boolean(obj.is_member ?? false),
        };
    },

    _normalizePost(raw: unknown): Post {
        if (!raw || typeof raw !== 'object') {
            return {
                id: '',
                room_id: '',
                author_id: '',
                author_name: '',
                title: '',
                content: '',
                post_type: 'discussion',
                tags: [],
                upvotes: 0,
                downvotes: 0,
                comments_count: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
        }

        const obj = raw as Record<string, unknown>;
        return {
            id: String(obj.id ?? ''),
            room_id: String(obj.room_id ?? ''),
            author_id: String(obj.author_id ?? obj.user_id ?? ''),
            author_name: String(obj.author_name ?? obj.user_name ?? obj.username ?? ''),
            author_avatar: obj.author_avatar ? String(obj.author_avatar) : undefined,
            title: String(obj.title ?? ''),
            content: String(obj.content ?? ''),
            post_type: (obj.post_type as PostType) ?? 'discussion',
            tags: Array.isArray(obj.tags) ? obj.tags.map(tag => String(tag)) : [],
            upvotes: Number(obj.upvotes ?? 0),
            downvotes: Number(obj.downvotes ?? 0),
            user_vote: (obj.user_vote as 'up' | 'down') ?? null,
            comments_count: Number(obj.comments_count ?? 0),
            created_at: String(obj.created_at ?? new Date().toISOString()),
            updated_at: String(obj.updated_at ?? new Date().toISOString()),
            is_pinned: Boolean(obj.is_pinned ?? false),
            attachments: Array.isArray(obj.attachments) ? obj.attachments.map(att => ({
                id: String(att.id ?? ''),
                type: att.type as 'image' | 'file' | 'link',
                url: String(att.url ?? ''),
                name: String(att.name ?? ''),
                size: att.size ? Number(att.size) : undefined,
            })) : undefined,
        };
    },

    _normalizeComment(raw: unknown): Comment {
        if (!raw || typeof raw !== 'object') {
            return {
                id: '',
                post_id: '',
                author_id: '',
                author_name: '',
                content: '',
                upvotes: 0,
                downvotes: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
        }

        const obj = raw as Record<string, unknown>;
        return {
            id: String(obj.id ?? ''),
            post_id: String(obj.post_id ?? ''),
            author_id: String(obj.author_id ?? obj.user_id ?? ''),
            author_name: String(obj.author_name ?? obj.user_name ?? obj.username ?? ''),
            author_avatar: obj.author_avatar ? String(obj.author_avatar) : undefined,
            content: String(obj.content ?? ''),
            upvotes: Number(obj.upvotes ?? 0),
            downvotes: Number(obj.downvotes ?? 0),
            user_vote: (obj.user_vote as 'up' | 'down') ?? null,
            parent_id: obj.parent_id ? String(obj.parent_id) : undefined,
            created_at: String(obj.created_at ?? new Date().toISOString()),
            updated_at: String(obj.updated_at ?? new Date().toISOString()),
            is_deleted: Boolean(obj.is_deleted ?? false),
            replies: [],
        };
    },

    _buildCommentTree(comments: Comment[]): Comment[] {
        const commentMap = new Map<string, Comment>();
        const rootComments: Comment[] = [];

        // First pass: create map and identify root comments
        comments.forEach(comment => {
            commentMap.set(comment.id, { ...comment, replies: [] });
            if (!comment.parent_id) {
                rootComments.push(commentMap.get(comment.id)!);
            }
        });

        // Second pass: build tree structure
        comments.forEach(comment => {
            if (comment.parent_id) {
                const parent = commentMap.get(comment.parent_id);
                const child = commentMap.get(comment.id);
                if (parent && child) {
                    parent.replies!.push(child);
                }
            }
        });

        return rootComments;
    },
};

export default discussionsService;
