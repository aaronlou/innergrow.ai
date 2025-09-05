import { ApiResponse } from '@/types';
import { getApiBaseUrl } from '@/lib/utils';

// Get API base URL from AuthContext pattern
const API_BASE_URL = getApiBaseUrl();

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Helper function for API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  const authHeaders = token ? {
    'Authorization': `Token ${token}`,
  } : {};
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...authHeaders,
      ...options.headers,
    },
  };
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  return response.json();
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
  active: number;
  completed: number;
  paused: number;
  public: number;
  private: number;
}

// Goals API service
export const goalsService = {
  // Get user's goals
  async getGoals(params: Record<string, string> = {}): Promise<ApiResponse<Goal[]>> {
    const searchParams = new URLSearchParams(params);
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    
    try {
      const data = await apiRequest(`/api/goals/${queryString}`, {
        method: 'GET',
      });
      return data;
    } catch (error: unknown) {
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

  // Analyze goal with AI
  async analyzeGoal(goalId: string): Promise<ApiResponse<AISuggestion[]>> {
    try {
      const data = await apiRequest(`/api/goals/${goalId}/analyze/`, {
        method: 'POST',
      });
      return data;
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
      const data = await apiRequest(`/api/goals/${goalId}/suggestions/`, {
        method: 'GET',
      });
      return data;
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