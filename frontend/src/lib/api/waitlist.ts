import { ApiResponse } from '@/types';
import { apiRequest } from '@/lib/api/client';

export interface WaitlistFeature {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_active: boolean;
  waitlist_count: number;
  is_user_joined: boolean;
  created_at: string;
  updated_at: string;
}

export interface WaitlistEntry {
  id: string;
  user_id: string;
  user_name: string;
  feature_name: string;
  feature_display_name: string;
  is_active: boolean;
  priority: number;
  notes?: string;
  joined_at: string;
  updated_at: string;
}

export interface WaitlistStatus {
  is_joined: boolean;
  entry: WaitlistEntry | null;
  position: number | null;
  total_count: number;
}

export interface PaginatedWaitlistResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: WaitlistEntry[];
}

export const waitlistService = {
  /**
   * Get all available waitlist features
   */
  async getFeatures(): Promise<ApiResponse<WaitlistFeature[]>> {
    return apiRequest<WaitlistFeature[]>('/api/waitlist/features/');
  },

  /**
   * Get current user's waitlist entries
   */
  async getMyWaitlists(): Promise<ApiResponse<PaginatedWaitlistResponse>> {
    return apiRequest<PaginatedWaitlistResponse>('/api/waitlist/my-waitlists/');
  },

  /**
   * Join a feature waitlist
   */
  async joinWaitlist(featureName: string, notes?: string): Promise<ApiResponse<{
    feature: string;
    joined: boolean;
    total_count: number;
  }>> {
    return apiRequest<{
      feature: string;
      joined: boolean;
      total_count: number;
    }>(`/api/waitlist/join/${featureName}/`, {
      method: 'POST',
      body: JSON.stringify({
        notes: notes || ''
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  /**
   * Leave a feature waitlist
   */
  async leaveWaitlist(featureName: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/api/waitlist/leave/${featureName}/`, {
      method: 'POST',
    });
  },

  /**
   * Get user's status for a specific feature waitlist
   */
  async getWaitlistStatus(featureName: string): Promise<ApiResponse<WaitlistStatus>> {
    return apiRequest<WaitlistStatus>(`/api/waitlist/status/${featureName}/`);
  },
};

export default waitlistService;
