import { ApiResponse } from '@/types';
import { apiRequest } from '@/lib/api/client';

// Exams types (frontend consumption)
export interface Exam {
    id: string;
    title: string;
    description?: string;
    category?: string;
    exam_time?: string;
    material?: string;
    created_at?: string;
    updated_at?: string;
}

interface RawExam {
    id?: unknown;
    title?: unknown;
    description?: unknown;
    desc?: unknown;
    category?: unknown;
    category_name?: unknown;
    exam_time?: unknown;
    examDate?: unknown;
    examTime?: unknown;
    material?: unknown;
    created_at?: unknown;
    createdAt?: unknown;
    updated_at?: unknown;
    updatedAt?: unknown;
    user?: unknown;
    user_id?: unknown;
    // 移除废弃的 participants 相关字段
    // participants?: unknown;
    // participants_count?: unknown;
    // is_participant?: unknown;
    
    // 新增讨论室相关字段
    discussion_members_count?: unknown;
    discussion_posts_count?: unknown;
    is_discussion_member?: unknown;
}

interface RawUserLike { id?: unknown; pk?: unknown; name?: unknown; username?: unknown; email?: unknown; }

export const examsService = {
    _normalizeList<T>(raw: unknown): T[] {
        if (Array.isArray(raw)) return raw as T[];
        if (!raw || typeof raw !== 'object') return [];
        const obj = raw as Record<string, unknown>;
        if ('data' in obj && Array.isArray((obj as { data?: unknown }).data)) return (obj as { data: T[] }).data;
        if ('results' in obj) {
            const resultsVal = (obj as { results?: unknown }).results;
            if (Array.isArray(resultsVal)) return resultsVal as T[];
            if (resultsVal && typeof resultsVal === 'object') {
                const nested = resultsVal as { data?: unknown };
                if (nested.data && Array.isArray(nested.data)) return nested.data as T[];
            }
        }
        return [];
    },

    _normalizeExam(raw: unknown): import('@/types').Exam {
        if (!raw || typeof raw !== 'object') return { id: '', title: '' };
        const obj = raw as RawExam;
        const exam: import('@/types').Exam = {
            id: String(obj.id ?? ''),
            title: String(obj.title ?? ''),
            description: (obj.description as string) ?? (obj.desc as string) ?? '',
            category: (obj.category as string) ?? (obj.category_name as string) ?? '',
            exam_time: (obj.exam_time as string) ?? (obj.examDate as string) ?? (obj.examTime as string),
            material: (obj.material as string) ?? undefined,
            created_at: (obj.created_at as string) ?? (obj.createdAt as string),
            updated_at: (obj.updated_at as string) ?? (obj.updatedAt as string),
        };
        if (obj.user && typeof obj.user === 'object') {
            const u = obj.user as RawUserLike;
            exam.user_id = String(u.id ?? u.pk ?? '');
            const nameSource = u.name ?? u.username ?? u.email;
            if (nameSource) exam.user_name = String(nameSource);
        } else if (obj.user_id) {
            exam.user_id = String(obj.user_id);
        }
        
        // 新的讨论室相关字段
        if (obj.discussion_members_count !== undefined) exam.discussion_members_count = Number(obj.discussion_members_count);
        if (obj.discussion_posts_count !== undefined) exam.discussion_posts_count = Number(obj.discussion_posts_count);
        if (obj.is_discussion_member !== undefined) exam.is_discussion_member = Boolean(obj.is_discussion_member);
        
        return exam;
    },

    async list(params: Record<string, string> = {}): Promise<ApiResponse<Exam[]>> {
        const searchParams = new URLSearchParams(params);
        const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
        console.log('[examsService.list] Making API request to:', `/api/exams/${qs}`);
        const res = await apiRequest<unknown>(`/api/exams/${qs}`, { method: 'GET' });
        console.log('[examsService.list] Raw API response:', {
            success: res.success,
            error: res.error,
            dataType: typeof res.data,
            isArray: Array.isArray(res.data),
            rawData: res.data
        });
        if (res.success) {
            const normalizedList = this._normalizeList<unknown>(res.data);
            console.log('[examsService.list] Normalized list:', normalizedList);
            const list = normalizedList.map(item => this._normalizeExam(item));
            console.log('[examsService.list] Final processed list:', list);
            return { success: true, data: list };
        }
        return res as ApiResponse<Exam[]>;
    },

    async create(payload: Partial<import('@/types').Exam> & { file?: File }): Promise<ApiResponse<import('@/types').Exam>> {
        let body: BodyInit;
        let headers: Record<string, string> | undefined;
        if (payload.file) {
            const form = new FormData();
            if (payload.title) form.append('title', payload.title);
            if (payload.description) form.append('description', payload.description);
            if (payload.category) form.append('category', payload.category);
            if (payload.exam_time) form.append('exam_time', payload.exam_time); // already YYYY-MM-DD
            form.append('material', payload.file);
            body = form;
        } else {
            const json: Record<string, unknown> = {};
            ['title', 'description', 'category', 'exam_time'].forEach(k => {
                const v = (payload as Record<string, unknown>)[k];
                if (v !== undefined && v !== null && v !== '') json[k] = v;
            });
            body = JSON.stringify(json);
            headers = { 'Content-Type': 'application/json' };
        }
        const res = await apiRequest<unknown>('/api/exams/', { method: 'POST', body, headers });
        if (res.success) return { success: true, data: this._normalizeExam(res.data) };
        return res as ApiResponse<import('@/types').Exam>;
    },

    async retrieve(id: string): Promise<ApiResponse<Exam>> {
        const res = await apiRequest<unknown>(`/api/exams/${id}/`, { method: 'GET' });
        if (res.success) return { success: true, data: this._normalizeExam(res.data) };
        return res as ApiResponse<Exam>;
    },

    async update(id: string, payload: Partial<import('@/types').Exam> & { file?: File }): Promise<ApiResponse<import('@/types').Exam>> {
        let body: BodyInit;
        let headers: Record<string, string> | undefined;
        if (payload.file) {
            const form = new FormData();
            ['title', 'description', 'category', 'exam_time'].forEach(k => {
                const v = (payload as Record<string, unknown>)[k];
                if (v !== undefined && v !== null && v !== '') form.append(k, String(v));
            });
            form.append('material', payload.file);
            body = form;
        } else {
            const json: Record<string, unknown> = {};
            ['title', 'description', 'category', 'exam_time'].forEach(k => {
                const v = (payload as Record<string, unknown>)[k];
                if (v !== undefined && v !== null && v !== '') json[k] = v;
            });
            body = JSON.stringify(json);
            headers = { 'Content-Type': 'application/json' };
        }
        const res = await apiRequest<unknown>(`/api/exams/${id}/`, { method: 'PUT', body, headers });
        if (res.success) return { success: true, data: this._normalizeExam(res.data) };
        return res as ApiResponse<import('@/types').Exam>;
    },

    async delete(id: string): Promise<ApiResponse<null>> {
        const res = await apiRequest<null>(`/api/exams/${id}/`, { method: 'DELETE' });
        return res as ApiResponse<null>;
    },

    // 移除废弃的 joinExam 和 leaveExam 方法
    // 现在只有讨论室成员关系，通过 discussionsService 处理
};

export default examsService;
