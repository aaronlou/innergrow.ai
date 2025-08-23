'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ApiResponse } from '@/types';
import { useLocalStorage } from '@/hooks';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<ApiResponse<User>>;
  register: (name: string, email: string, password: string) => Promise<ApiResponse<User>>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<ApiResponse<User>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

// 模拟API调用（实际项目中应该调用真实的API）
const mockAuth = {
  async login(email: string, password: string): Promise<ApiResponse<User>> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 简单验证
    if (email === 'demo@innergrow.ai' && password === 'password') {
      const user: User = {
        id: '1',
        name: '演示用户',
        email: email,
        avatar: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return { success: true, data: user };
    }
    
    return { success: false, error: '邮箱或密码错误' };
  },
  
  async register(name: string, email: string, password: string): Promise<ApiResponse<User>> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 简单验证
    if (name.length < 2) {
      return { success: false, error: '姓名至少需要2个字符' };
    }
    
    if (!email.includes('@')) {
      return { success: false, error: '请输入有效的邮箱地址' };
    }
    
    if (password.length < 6) {
      return { success: false, error: '密码至少需要6位字符' };
    }
    
    const user: User = {
      id: Date.now().toString(),
      name,
      email,
      avatar: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return { success: true, data: user };
  },
  
  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟更新用户信息
    return { 
      success: true, 
      data: { 
        id: '1',
        name: updates.name || '演示用户',
        email: updates.email || 'demo@innergrow.ai',
        avatar: updates.avatar || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    };
  }
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useLocalStorage<User | null>('auth_user', null);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = !!user;

  const login = async (email: string, password: string): Promise<ApiResponse<User>> => {
    setIsLoading(true);
    try {
      const result = await mockAuth.login(email, password);
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
      const result = await mockAuth.register(name, email, password);
      if (result.success && result.data) {
        setUser(result.data);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    // 可以在这里添加其他清理逻辑，如清除其他本地存储数据
  };

  const updateProfile = async (updates: Partial<User>): Promise<ApiResponse<User>> => {
    if (!user) {
      return { success: false, error: '用户未登录' };
    }
    
    setIsLoading(true);
    try {
      const result = await mockAuth.updateProfile(updates);
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