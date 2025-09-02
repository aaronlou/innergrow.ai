'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ApiResponse } from '@/types';
import { useLocalStorage } from '@/hooks';

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

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:8000'; // Default Django development server
    }
    // Add your production API URL here
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  }
  // Server-side (fallback)
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

// API service for authentication
const authService = {
  async login(email: string, password: string): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store token in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', data.data.token);
        }
        return { success: true, data: data.data.user };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message || 'Network error, please try again later' };
      }
      return { success: false, error: 'Network error, please try again later' };
    }
  },

  async register(name: string, email: string, password: string): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        await fetch(`${API_BASE_URL}/api/auth/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
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
      
      const response = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
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
      
      // Send the ID token to your backend
      const response = await fetch(`${API_BASE_URL}/api/auth/google-login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_token: idToken }),
      });

      const data = await response.json();

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

  const isAuthenticated = !!user;

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

  const login = async (email: string, password: string): Promise<ApiResponse<User>> => {
    setIsLoading(true);
    try {
      const result = await authService.login(email, password);
      if (result.success && result.data) {
        setUser(result.data);
      }
      return result;
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

      return new Promise<ApiResponse<User>>((resolve) => {
        // @ts-expect-error: google is loaded externally
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
          callback: async (response: { credential?: string }) => {
            if (response.credential) {
              try {
                const result = await authService.googleLogin({
                  getAuthResponse: () => ({ id_token: response.credential })
                } as GoogleUser);
                
                if (result.success && result.data) {
                  setUser(result.data);
                }
                resolve(result);
              } catch (error: unknown) {
                if (error instanceof Error) {
                  resolve({ success: false, error: error.message || 'Google Sign-In failed' });
                } else {
                  resolve({ success: false, error: 'Google Sign-In failed' });
                }
              } finally {
                setIsLoading(false);
              }
            } else {
              setIsLoading(false);
              resolve({ success: false, error: 'No credentials received from Google' });
            }
          },
          cancel_on_tap_outside: true
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
    }
  };

  const logout = () => {
    // API logout
    authService.logout();
    
    setUser(null);
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