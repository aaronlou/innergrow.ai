import { ApiResponse } from '@/types';
import { getApiBaseUrl, getAuthScheme, getAuthToken } from '@/lib/utils';

// Get API base URL from AuthContext pattern
const API_BASE_URL = getApiBaseUrl();

// Extend RequestInit with optional timeout support
type ApiRequestOptions = RequestInit & { timeoutMs?: number };

// Internal: create an AbortController that respects an optional timeout and an external signal
const createAbortController = (timeoutMs?: number, externalSignal?: AbortSignal) => {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason ?? new Error('Aborted'));
    } else {
      externalSignal.addEventListener('abort', () => {
        controller.abort(externalSignal.reason ?? new Error('Aborted'));
      });
    }
  }

  if (typeof timeoutMs === 'number' && timeoutMs > 0) {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort(new Error('Request timeout'));
    }, timeoutMs);
  }

  const cleanup = () => {
    if (timer) clearTimeout(timer);
  };

  return { signal: controller.signal, cleanup, isTimedOut: () => timedOut };
};

// Helper function for API requests with robust error handling and optional timeout/cancellation
const apiRequest = async (endpoint: string, options: ApiRequestOptions = {}) => {
  const token = getAuthToken();

  // Debug information
  if (typeof window !== 'undefined') {
    console.log('API Request Debug:', {
      endpoint,
      hasToken: !!token,
      tokenLength: token?.length || 0,
      authScheme: getAuthScheme()
    });
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const authHeaders: Record<string, string> = token ? {
    'Authorization': `${getAuthScheme()} ${token}`,
  } : {};

  // Ensure headers are always a plain object
  const mergedHeaders: Record<string, string> = {
    ...defaultHeaders,
    ...authHeaders,
    ...(options.headers && typeof options.headers === 'object' && !Array.isArray(options.headers)
      ? options.headers as Record<string, string>
      : {}),
  };

  const { timeoutMs, signal: externalSignal, ...rest } = options as ApiRequestOptions;
  const { signal, cleanup, isTimedOut } = createAbortController(timeoutMs, externalSignal as AbortSignal | undefined);

  const config: RequestInit = {
    ...rest,
    headers: mergedHeaders,
    signal,
  };

  try {
    // Resolve endpoint against base using URL to avoid duplicate segments
    const url = new URL(endpoint, API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`);
    const response = await fetch(url.toString(), config);

    // Try to parse JSON, but fall back to text on failure
    const tryParseJson = async () => {
      try {
        return await response.json();
      } catch {
        try {
          const text = await response.text();
          return text ? { message: text } : {};
        } catch {
          return {};
        }
      }
    };

    const payload = await tryParseJson();

    if (!response.ok) {
      // Normalize into ApiResponse shape
      const errorMsg =
        (payload && (payload.error || payload.detail || payload.message)) ||
        `${response.status} ${response.statusText}`;
      // On unauthorized, clear token and notify app to redirect/login
      if (response.status === 401 && typeof window !== 'undefined') {
        try {
          localStorage.removeItem('auth_token');
          window.dispatchEvent(new CustomEvent('app:unauthorized'));
        } catch {
          // ignore storage issues
        }
      }
      return { success: false, error: String(errorMsg) } as ApiResponse<unknown>;
    }

    // If backend already returns ApiResponse, pass through; else wrap
    if (payload && typeof payload === 'object' && 'success' in payload) {
      return payload;
    }
    return { success: true, data: payload } as ApiResponse<unknown>;
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === 'AbortError' || err.message.includes('aborted')) {
        return { success: false, error: isTimedOut() ? 'Request timeout' : 'Request aborted' } as ApiResponse<unknown>;
      }
      if (isTimedOut()) {
        return { success: false, error: 'Request timeout' } as ApiResponse<unknown>;
      }
      return { success: false, error: err.message } as ApiResponse<unknown>;
    }
    return { success: false, error: 'Network error' } as ApiResponse<unknown>;
  } finally {
    cleanup();
  }
};

// Goal related types based on Django serializers
export interface GoalCategory {
  id: string;
  name: string;
  name_en: string;
  created_at: string;
}

export interface GoalStatus {
  id: string;
  name: string;
  name_en: string;
  created_at: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  status: GoalStatus;
  visibility: 'public' | 'private';
  progress: number;
  target_date: string;
  created_at: string;
  updated_at: string;
  is_overdue: boolean;
}

export interface AISuggestion {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  accepted: boolean;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoalStatistics {
  total: number;
  new: number;
  active: number;
  completed: number;
  paused: number;
  public: number;
  private: number;
}

// Goals API service
export const goalsService = {
  // Internal normalization helper to flatten paginated/list variants
  _normalizeList<T>(raw: unknown): T[] {
    // Case 1: already an array
    if (Array.isArray(raw)) return raw as T[];
    if (!raw || typeof raw !== 'object') return [];
    const obj = raw as Record<string, unknown>;
    // Case 2: { data: [...] }
    if ('data' in obj) {
      const dataVal = (obj as { data?: unknown }).data;
      if (Array.isArray(dataVal)) return dataVal as T[];
    }
    // Case 3: { results: [...] } or nested container
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
  // Get user's goals
  async getGoals(params: Record<string, string> = {}): Promise<ApiResponse<Goal[]>> {
    const searchParams = new URLSearchParams(params);
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';

    try {
      const data = await apiRequest(`/api/goals/${queryString}`, {
        method: 'GET',
      });

      console.log('DEBUG: Raw API response in getGoals:', data);

      // Handle paginated response - extract results array
      // 数据结构: { success: true, data: { count, next, previous, results: { data: Array, success: true } } }
      if (data.success && data.data && typeof data.data === 'object') {
        const paginatedContainer = data.data as Record<string, unknown>;

        // 检查是否有分页结构 (count, next, previous, results)
        if ('results' in paginatedContainer && paginatedContainer.results) {
          const results = paginatedContainer.results;
          console.log('DEBUG: Found paginated structure with results:', results);

          // 检查 results.data 是否存在且为数组
          if (results && typeof results === 'object' && 'data' in results && Array.isArray(results.data)) {
            console.log('DEBUG: Extracting goals array from results.data:', results.data);
            return { success: true, data: results.data };
          }

          // 如果 results 直接是数组（备用处理）
          if (Array.isArray(results)) {
            console.log('DEBUG: Results is direct array:', results);
            return { success: true, data: results };
          }
        }

        // 如果直接是数组（非分页情况）
        if (Array.isArray(paginatedContainer)) {
          console.log('DEBUG: Direct array response:', paginatedContainer);
          return { success: true, data: paginatedContainer };
        }

        console.log('DEBUG: Unexpected paginated structure, falling back to empty array');
        return { success: true, data: [] };
      }

      // Handle direct array response
      if (data.success && Array.isArray(data.data)) {
        console.log('DEBUG: Detected direct array response:', data.data);
        return data;
      }

      // Handle any other case
      console.log('DEBUG: Unexpected response format:', data);
      return data;
    } catch (error: unknown) {
      console.error('DEBUG: Error in getGoals:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Failed to fetch goals' };
    }
  },

  // Create a new goal
  async createGoal(goalData: Partial<Goal>): Promise<ApiResponse<Goal>> {
    try {
      const data = await apiRequest('/api/goals/', {
        method: 'POST',
        body: JSON.stringify(goalData),
      });
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Failed to create goal' };
    }
  },

  // Get a specific goal
  async getGoal(id: string): Promise<ApiResponse<Goal>> {
    try {
      const data = await apiRequest(`/api/goals/${id}/`, {
        method: 'GET',
      });
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Failed to fetch goal' };
    }
  },

  // Update a goal
  async updateGoal(id: string, goalData: Partial<Goal>): Promise<ApiResponse<Goal>> {
    try {
      const data = await apiRequest(`/api/goals/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(goalData),
      });
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Failed to update goal' };
    }
  },

  // Delete a goal
  async deleteGoal(id: string): Promise<ApiResponse<null>> {
    try {
      const data = await apiRequest(`/api/goals/${id}/`, {
        method: 'DELETE',
      });
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Failed to delete goal' };
    }
  },

  // Get public goals
  async getPublicGoals(): Promise<ApiResponse<Goal[]>> {
    try {
      const data = await apiRequest('/api/goals/public/', {
        method: 'GET',
      });
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Failed to fetch public goals' };
    }
  },

  // Get a single public goal (not currently used, added for parity with backend)
  async getPublicGoal(id: string): Promise<ApiResponse<Goal>> {
    try {
      const data = await apiRequest(`/api/goals/public/${id}/`, {
        method: 'GET',
      });
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Failed to fetch public goal' };
    }
  },

  // Get goal statistics
  async getStatistics(): Promise<ApiResponse<GoalStatistics>> {
    try {
      const data = await apiRequest('/api/goals/statistics/', {
        method: 'GET',
      });
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Failed to fetch statistics' };
    }
  },

  // Get goal categories
  async getCategories(): Promise<ApiResponse<GoalCategory[]>> {
    try {
      const data = await apiRequest('/api/goals/categories/', {
        method: 'GET',
      });
      // Handle empty response as success with empty array
      if (data.success && !data.data) {
        return { success: true, data: [] };
      }
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Failed to fetch categories' };
    }
  },

  // Get goal statuses
  async getStatuses(): Promise<ApiResponse<GoalStatus[]>> {
    try {
      const data = await apiRequest('/api/goals/statuses/', {
        method: 'GET',
      });
      // Handle empty response as success with empty array
      if (data.success && !data.data) {
        return { success: true, data: [] };
      }
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Failed to fetch statuses' };
    }
  },

  // Create goal category
  async createCategory(categoryData: Partial<GoalCategory>): Promise<ApiResponse<GoalCategory>> {
    try {
      const data = await apiRequest('/api/goals/categories/create/', {
        method: 'POST',
        body: JSON.stringify(categoryData),
      });
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Failed to create category' };
    }
  },

  // Create goal status
  async createStatus(statusData: Partial<GoalStatus>): Promise<ApiResponse<GoalStatus>> {
    try {
      const data = await apiRequest('/api/goals/statuses/create/', {
        method: 'POST',
        body: JSON.stringify(statusData),
      });
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Failed to create status' };
    }
  },

  // Analyze goal with AI (pass language/model to align with backend)
  async analyzeGoal(
    goalId: string,
    opts?: { language?: string; model?: string; timeoutMs?: number }
  ): Promise<ApiResponse<AISuggestion[]>> {
    try {
      const getCurrentLanguage = (): string => {
        if (typeof window !== 'undefined') {
          return localStorage.getItem('language') || 'en';
        }
        return 'en';
      };

      const body = {
        language: opts?.language ?? getCurrentLanguage(),
        ...(opts?.model ? { model: opts.model } : {}),
      };

      const data = await apiRequest(`/api/goals/${goalId}/analyze/`, {
        method: 'POST',
        body: JSON.stringify(body),
        timeoutMs: opts?.timeoutMs,
      });
      if (data.success) {
        console.log('DEBUG: analyzeGoal response data:', data.data);
        return { success: true, data: goalsService._normalizeList<AISuggestion>(data.data) };
      }
      return data as ApiResponse<AISuggestion[]>;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Failed to analyze goal' };
    }
  },

  // Get AI suggestions for a goal
  async getSuggestions(goalId: string): Promise<ApiResponse<AISuggestion[]>> {
    try {
      // First attempt with GET
      let data = await apiRequest(`/api/goals/${goalId}/suggestions/`, { method: 'GET' });

      // If method not allowed (backend expects POST), retry with POST
      if (!data.success && typeof data.error === 'string' && /method/i.test(data.error) && /not allowed|不被允许/.test(data.error)) {
        console.warn('GET /suggestions/ not allowed, retrying with POST');
        data = await apiRequest(`/api/goals/${goalId}/suggestions/`, { method: 'POST', body: JSON.stringify({}) });
      }

      if (data.success) {
        return { success: true, data: goalsService._normalizeList<AISuggestion>(data.data) };
      }
      return data as ApiResponse<AISuggestion[]>;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Failed to fetch suggestions' };
    }
  },

  // Accept AI suggestion
  async acceptSuggestion(goalId: string, suggestionId: string, accepted: boolean): Promise<ApiResponse<AISuggestion>> {
    try {
      const data = await apiRequest(`/api/goals/${goalId}/suggestions/${suggestionId}/accept/`, {
        method: 'POST',
        body: JSON.stringify({ accepted }),
      });
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Failed to accept suggestion' };
    }
  },

  // Mark goal as complete
  async markComplete(goalId: string): Promise<ApiResponse<Goal>> {
    try {
      const data = await apiRequest(`/api/goals/${goalId}/complete/`, {
        method: 'POST',
      });
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Failed to mark goal as complete' };
    }
  },
};