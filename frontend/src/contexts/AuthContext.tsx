'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ApiResponse } from '@/types';
import { useLocalStorage } from '@/hooks';
import { getApiBaseUrl, getAuthScheme, getAuthToken } from '@/lib/utils';

// Define Google User type
interface GoogleUser {
  getBasicProfile: () => {
    getId: () => string;
    getName: () => string;
    getEmail: () => string;
    getImageUrl: () => string;
  };
  getAuthResponse: () => {
    id_token: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<ApiResponse<User>>;
  register: (name: string, email: string, password: string) => Promise<ApiResponse<User>>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<ApiResponse<User>>;
  googleLogin: () => Promise<ApiResponse<User>>;  // This matches the actual implementation
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

// Use shared helper to determine API base URL
const API_BASE_URL = getApiBaseUrl();

// API service for authentication
const authService = {
  async login(email: string, password: string): Promise<ApiResponse<User>> {
    try {
      console.log('Login attempt:', {
        email: email,
        apiUrl: `${API_BASE_URL}/api/accounts/auth/login/`,
        apiBaseUrl: API_BASE_URL,
        hasPassword: !!password,
        passwordLength: password?.length
      });

      // Helper function to get CSRF token from cookies
      const getCSRFTokenFromCookie = (): string | null => {
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
      };

      // Try to get CSRF token from cookie first, or make a request to get it
      let csrfToken = getCSRFTokenFromCookie();
      
      if (!csrfToken) {
        try {
          // Make a request to Django to get CSRF cookie set
          const csrfResponse = await fetch(`${API_BASE_URL}/`, {
            method: 'GET',
            credentials: 'include',
          });
          // After this request, the CSRF cookie should be set
          csrfToken = getCSRFTokenFromCookie();
          console.log('CSRF token from cookie after GET request:', csrfToken ? 'YES' : 'NO');
        } catch (csrfError) {
          console.warn('Could not get CSRF token:', csrfError);
        }
      } else {
        console.log('CSRF token from existing cookie:', 'YES');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', // This helps bypass CSRF for Django
      };

      // Add CSRF token if we have one
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }

      const response = await fetch(`${API_BASE_URL}/api/accounts/auth/login/`, {
        method: 'POST',
        headers,
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      console.log('Login response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url,
        ok: response.ok
      });

      // Check if response is not ok (404, 403, 500, etc.)
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Login failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        
        // Provide specific error messages for common issues
        if (response.status === 403) {
          let errorMessage = 'Login forbidden. Please check your credentials or backend CORS settings.';
          
          // Check if it's a CSRF error
          if (errorText.includes('CSRF') || errorText.includes('csrf')) {
            errorMessage = 'CSRF error. The backend requires CSRF token protection. This is a backend configuration issue - please contact the administrator.';
          }
          
          return { success: false, error: errorMessage };
        }
        if (response.status === 404) {
          return { success: false, error: 'Login endpoint not found. Please check backend configuration.' };
        }
        if (response.status === 401) {
          return { success: false, error: 'Invalid email or password. Please check your credentials.' };
        }
        if (response.status === 500) {
          return { success: false, error: 'Server error during login. Please try again later.' };
        }
        
        return { success: false, error: `Login failed: ${response.status} ${response.statusText}` };
      }

      const data = await response.json();
      
      console.log('Login data:', {
        success: data.success,
        hasUser: !!data.data?.user,
        hasToken: !!data.data?.token,
        tokenLength: data.data?.token?.length,
        userEmail: data.data?.user?.email,
        error: data.error
      });

      if (data.success) {
        // Store token in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', data.data.token);
          console.log('Token stored in localStorage:', `${data.data.token.substring(0, 10)}...`);
        }
        return { success: true, data: data.data.user };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error: unknown) {
      console.error('Login network error:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message || 'Network error, please try again later' };
      }
      return { success: false, error: 'Network error, please try again later' };
    }
  },

  async register(name: string, email: string, password: string): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest', // This helps bypass CSRF for Django
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store token in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', data.data.token);
        }
        return { success: true, data: data.data.user };
      } else {
        return { success: false, error: data.error || 'Registration failed', message: data.details };
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message || 'Network error, please try again later' };
      }
      return { success: false, error: 'Network error, please try again later' };
    }
  },

  async logout(): Promise<ApiResponse<null>> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      if (token) {
    await fetch(`${API_BASE_URL}/api/accounts/auth/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
      'Authorization': `${getAuthScheme()} ${token}`,
          },
        });
        
        // Remove token from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
      }
      
      return { success: true };
    } catch (error: unknown) {
      // Even if logout fails, we should clear the token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      if (error instanceof Error) {
        return { success: false, error: error.message || 'Logout failed' };
      }
      return { success: false, error: 'Logout failed' };
    }
  },

  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      if (!token) {
        return { success: false, error: 'User not logged in' };
      }
      
    const response = await fetch(`${API_BASE_URL}/api/accounts/profile/update/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
      'Authorization': `${getAuthScheme()} ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error || 'Update failed', message: data.details };
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message || 'Network error, please try again later' };
      }
      return { success: false, error: 'Network error, please try again later' };
    }
  },

  // Google Login Implementation
  async googleLogin(googleUser: GoogleUser): Promise<ApiResponse<User>> {
    try {
      // Extract the ID token from the Google user
      const authResponse = googleUser.getAuthResponse();
      const idToken = authResponse.id_token;
      
      console.log('Google login attempt:', {
        apiUrl: `${API_BASE_URL}/api/accounts/auth/google-login/`,
        apiBaseUrl: API_BASE_URL,
        currentOrigin: window.location.origin,
        hasIdToken: !!idToken,
        idTokenLength: idToken?.length
      });
      
      // Send the ID token to your backend
      const response = await fetch(`${API_BASE_URL}/api/accounts/auth/google-login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Remove Origin header as it might cause CORS issues
        },
        mode: 'cors', // Explicitly set CORS mode
        credentials: 'same-origin', // Change to same-origin for better compatibility
        body: JSON.stringify({ id_token: idToken }),
      });

      console.log('Google login response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url
      });

      // Check if response is not ok (404, 403, 500, etc.)
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google login failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        
        // Provide specific error messages for common issues
        if (response.status === 403) {
          return { success: false, error: 'Google login not allowed. Please check backend CORS settings.' };
        }
        if (response.status === 404) {
          return { success: false, error: 'Google login endpoint not found. Please check backend configuration.' };
        }
        if (response.status === 500) {
          return { success: false, error: 'Server error during Google login. Please try again later.' };
        }
        
        return { success: false, error: `Google login failed: ${response.status} ${response.statusText}` };
      }

      const data = await response.json();
      
      console.log('Google login data:', data);

      if (data.success) {
        // Store token in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', data.data.token);
        }
        return { success: true, data: data.data.user };
      } else {
        return { success: false, error: data.error || 'Google login failed' };
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message || 'Network error, please try again later' };
      }
      return { success: false, error: 'Network error, please try again later' };
    }
  }
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useLocalStorage<User | null>('auth_user', null);
  const [isLoading, setIsLoading] = useState(false);
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check authentication status: requires both user and token
  const isAuthenticated = isInitialized && !!user && !!getAuthToken();

  // Initialize authentication state
  useEffect(() => {
    const token = getAuthToken();
    
    // Check state consistency
    if ((token && !user) || (!token && user)) {
      // State inconsistent, clear all authentication info
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    
    // Mark as initialized
    setIsInitialized(true);
  }, [user, setUser]);

  // Initialize Google API
  useEffect(() => {
    if (typeof window !== 'undefined' && !gapiLoaded) {
      const initializeGoogleSignIn = () => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setGapiLoaded(true);
        };
        document.head.appendChild(script);
      };

      initializeGoogleSignIn();
    }
  }, [gapiLoaded]);

  // Reset auth state on global unauthorized
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('app:unauthorized', onUnauthorized as EventListener);
    return () => window.removeEventListener('app:unauthorized', onUnauthorized as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string): Promise<ApiResponse<User>> => {
    setIsLoading(true);
    try {
      console.log('Login function called:', {
        email: email,
        hasPassword: !!password,
        apiBaseUrl: API_BASE_URL,
        timestamp: new Date().toISOString()
      });

      const result = await authService.login(email, password);
      
      console.log('AuthService login result:', {
        success: result.success,
        error: result.error,
        hasData: !!result.data,
        timestamp: new Date().toISOString()
      });

      if (result.success && result.data) {
        setUser(result.data);
        // Debug: Check if token is saved correctly
        const token = localStorage.getItem('auth_token');
        console.log('Login success, token saved:', token ? `${token.substring(0, 10)}...` : 'NO TOKEN');
      }
      return result;
    } catch (error: unknown) {
      console.error('Login function error:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message || 'Login function error' };
      }
      return { success: false, error: 'Login function error' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<ApiResponse<User>> => {
    setIsLoading(true);
    try {
      const result = await authService.register(name, email, password);
      if (result.success && result.data) {
        setUser(result.data);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (): Promise<ApiResponse<User>> => {
    setIsLoading(true);
    try {
      // @ts-expect-error: google is loaded externally
      if (!window.google || !window.google.accounts) {
        return { success: false, error: 'Google Sign-In not initialized' };
      }

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
      if (!clientId) {
        return { success: false, error: 'Missing Google Client ID. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID.' };
      }

      const decodeJwt = (token: string): Record<string, unknown> | null => {
        try {
          const parts = token.split('.');
          if (parts.length !== 3) return null;
          const payload = parts[1]
            .replace(/-/g, '+')
            .replace(/_/g, '/');
          const decoded = JSON.parse(decodeURIComponent(escape(atob(payload))));
          return decoded as Record<string, unknown>;
        } catch {
          return null;
        }
      };

      // Cancel any existing credential requests first
      try {
        // @ts-expect-error: google is loaded externally
        window.google.accounts.id.cancel();
  } catch {
        // Ignore errors from cancellation
      }

      return new Promise<ApiResponse<User>>((resolve) => {
        // @ts-expect-error: google is loaded externally
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential?: string }) => {
            if (response.credential) {
              try {
                // Client-side sanity checks for clearer diagnostics
                const claims = decodeJwt(response.credential);
                const aud = (claims?.aud ?? '') as string;
                const iss = (claims?.iss ?? '') as string;
                if (aud && aud !== clientId) {
                  setIsLoading(false);
                  return resolve({ success: false, error: `Google token audience mismatch. Expected ${clientId}, got ${aud}.` });
                }
                if (iss && iss !== 'accounts.google.com' && iss !== 'https://accounts.google.com') {
                  setIsLoading(false);
                  return resolve({ success: false, error: `Invalid Google issuer: ${iss}` });
                }

                const result = await authService.googleLogin({
                  getAuthResponse: () => ({ id_token: response.credential })
                } as GoogleUser);
                
                if (result.success && result.data) {
                  setUser(result.data);
                }
                resolve(result);
              } catch (error: unknown) {
                setIsLoading(false);
                if (error instanceof Error) {
                  resolve({ success: false, error: error.message || 'Google Sign-In failed' });
                } else {
                  resolve({ success: false, error: 'Google Sign-In failed' });
                }
              }
            } else {
              setIsLoading(false);
              resolve({ success: false, error: 'No credentials received from Google' });
            }
          },
          cancel_on_tap_outside: true,
          prompt_parent_id: 'google-signin-prompt'
        });
        
        // @ts-expect-error: google is loaded externally
        window.google.accounts.id.prompt();
      });
    } catch (error: unknown) {
      setIsLoading(false);
      if (error instanceof Error) {
        return { success: false, error: error.message || 'Google Sign-In failed' };
      }
      return { success: false, error: 'Google Sign-In failed' };
    } finally {
      // Make sure loading state is reset
      setTimeout(() => setIsLoading(false), 0);
    }
  };

  const logout = () => {
    // API logout
    authService.logout();
    
    // Clear all authentication related state
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    // Can add other cleanup logic here, such as clearing other local storage data
  };

  const updateProfile = async (updates: Partial<User>): Promise<ApiResponse<User>> => {
    if (!user) {
      return { success: false, error: 'User not logged in' };
    }
    
    setIsLoading(true);
    try {
      const result = await authService.updateProfile(updates);
      if (result.success && result.data) {
        setUser(result.data);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    googleLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}