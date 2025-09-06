// CSRF token handling utilities for Django backend

import { getApiBaseUrl } from './utils';

const API_BASE_URL = getApiBaseUrl();

/**
 * Get CSRF token from cookie
 */
export function getCSRFTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const name = 'csrftoken';
  let cookieValue: string | null = null;
  
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  
  return cookieValue;
}

/**
 * Fetch CSRF token from Django backend
 */
export async function fetchCSRFToken(): Promise<string | null> {
  try {
    console.log('Fetching CSRF token from:', `${API_BASE_URL}/api/csrf/`);
    
    // Try to get CSRF token from a dedicated endpoint first
    const response = await fetch(`${API_BASE_URL}/api/csrf/`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.csrfToken) {
        console.log('Got CSRF token from API endpoint');
        return data.csrfToken;
      }
    }
  } catch (error) {
    console.warn('Failed to get CSRF token from API endpoint:', error);
  }

  try {
    // Fallback: make a request to root to set CSRF cookie
    console.log('Trying to get CSRF cookie from root endpoint');
    await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      credentials: 'include',
    });

    // Check if cookie was set
    const tokenFromCookie = getCSRFTokenFromCookie();
    if (tokenFromCookie) {
      console.log('Got CSRF token from cookie after root request');
      return tokenFromCookie;
    }
  } catch (error) {
    console.warn('Failed to get CSRF token from root endpoint:', error);
  }

  return null;
}

/**
 * Ensure we have a CSRF token, fetching it if necessary
 */
export async function ensureCSRFToken(): Promise<string | null> {
  // First try to get from existing cookie
  let token = getCSRFTokenFromCookie();
  
  if (token) {
    console.log('Using existing CSRF token from cookie');
    return token;
  }

  // If no token, try to fetch it
  console.log('No CSRF token found, fetching new one');
  token = await fetchCSRFToken();
  
  if (!token) {
    console.error('Failed to obtain CSRF token');
  }
  
  return token;
}

/**
 * Create headers with CSRF token for Django requests
 */
export async function createCSRFHeaders(additionalHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // This helps with Django CSRF
    ...additionalHeaders,
  };

  const csrfToken = await ensureCSRFToken();
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
    console.log('Added CSRF token to headers');
  } else {
    console.warn('No CSRF token available for request');
  }

  return headers;
}
