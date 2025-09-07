import { ApiResponse } from '@/types';
import { apiRequest } from '@/lib/api/client';

// Exams types (frontend consumption)
export interface Exam {
    id: string;
    title: string;
    description?: string;
    category?: string; // simple string for now
    difficulty?: string;
    duration?: string; // human readable
    study_time?: string; // backend field may be snake_case
    studyTime?: string; // normalized field for UI
    created_at?: string;
    updated_at?: string;
}

export interface StudyPlanSection {
    title: string;
    content: string;
    duration?: string;
}

export interface StudyPlanData {
    exam_id: string;
    language: string;
    model?: string;
    plan: StudyPlanSection[];
    summary?: string;
    total_duration?: string;
}

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

    _normalizeExam(raw: unknown): Exam {
        if (!raw || typeof raw !== 'object') return { id: '', title: '' };
        const obj = raw as Record<string, unknown>;
        return {
            id: String(obj.id ?? ''),
            title: String(obj.title ?? ''),
            description: (obj.description as string) ?? (obj.desc as string) ?? '',
            category: (obj.category as string) ?? (obj.category_name as string) ?? '',
            difficulty: (obj.difficulty as string) ?? (obj.level as string) ?? '',
            duration: (obj.duration as string) ?? '',
            study_time: (obj.study_time as string) ?? (obj.studyTime as string) ?? (obj.study_time_text as string) ?? '',
            studyTime: (obj.studyTime as string) ?? (obj.study_time as string) ?? '',
            created_at: (obj.created_at as string) ?? (obj.createdAt as string),
            updated_at: (obj.updated_at as string) ?? (obj.updatedAt as string),
        };
    },

    async list(params: Record<string, string> = {}): Promise<ApiResponse<Exam[]>> {
        const searchParams = new URLSearchParams(params);
        const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
        const res = await apiRequest<unknown>(`/api/exams/${qs}`, { method: 'GET' });
        if (res.success) {
            const list = this._normalizeList<unknown>(res.data).map(item => this._normalizeExam(item));
            return { success: true, data: list };
        }
        return res as ApiResponse<Exam[]>;
    },

    async create(payload: Partial<Exam>): Promise<ApiResponse<Exam>> {
        const res = await apiRequest<unknown>('/api/exams/', { method: 'POST', body: JSON.stringify(payload) });
        if (res.success) return { success: true, data: this._normalizeExam(res.data) };
        return res as ApiResponse<Exam>;
    },

    async retrieve(id: string): Promise<ApiResponse<Exam>> {
        const res = await apiRequest<unknown>(`/api/exams/${id}/`, { method: 'GET' });
        if (res.success) return { success: true, data: this._normalizeExam(res.data) };
        return res as ApiResponse<Exam>;
    },

    async update(id: string, payload: Partial<Exam>): Promise<ApiResponse<Exam>> {
        const res = await apiRequest<unknown>(`/api/exams/${id}/`, { method: 'PUT', body: JSON.stringify(payload) });
        if (res.success) return { success: true, data: this._normalizeExam(res.data) };
        return res as ApiResponse<Exam>;
    },

    async delete(id: string): Promise<ApiResponse<null>> {
        const res = await apiRequest<null>(`/api/exams/${id}/`, { method: 'DELETE' });
        return res as ApiResponse<null>;
    },

    async generateStudyPlan(examId: string, opts?: { language?: string; model?: string; timeoutMs?: number }): Promise<ApiResponse<StudyPlanData>> {
        const getCurrentLanguage = (): string => {
            if (typeof window !== 'undefined') return localStorage.getItem('language') || 'en';
            return 'en';
        };
        const body = {
            language: opts?.language ?? getCurrentLanguage(),
            ...(opts?.model ? { model: opts.model } : {}),
        };
        const res = await apiRequest<unknown>(`/api/exams/${examId}/study-plan/`, { method: 'POST', body: JSON.stringify(body), timeoutMs: opts?.timeoutMs });
        if (res.success) {
            const raw = (res as ApiResponse<unknown>).data;
            if (raw && typeof raw === 'object') {
                const obj = raw as Record<string, unknown>;
                const arr = Array.isArray(obj.plan) ? obj.plan : [];
                const planSections = arr.filter(section => section && typeof section === 'object').map(section => {
                    const s = section as Record<string, unknown>;
                    return {
                        title: String(s.title ?? ''),
                        content: String(s.content ?? ''),
                        duration: s.duration ? String(s.duration) : undefined,
                    };
                });
                const planData: StudyPlanData = {
                    exam_id: String(obj.exam_id ?? examId),
                    language: String(obj.language ?? body.language),
                    model: obj.model ? String(obj.model) : undefined,
                    plan: planSections,
                    summary: obj.summary ? String(obj.summary) : (obj.overview ? String(obj.overview) : undefined),
                    total_duration: obj.total_duration ? String(obj.total_duration) : (obj.totalDuration ? String(obj.totalDuration) : undefined),
                };
                return { success: true, data: planData };
            }
            return { success: true, data: { exam_id: examId, language: body.language, plan: [] } };
        }
        return res as ApiResponse<StudyPlanData>;
    },
};

export default examsService;
