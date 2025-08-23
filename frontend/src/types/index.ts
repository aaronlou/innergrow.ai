// 用户相关类型
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  bio?: string;
  goals: Goal[];
  preferences: UserPreferences;
}

// 个人成长相关类型
export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  status: GoalStatus;
  targetDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  progress: number; // 0-100
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
  dueDate?: Date;
}

export type GoalCategory = 
  | 'health'
  | 'career'
  | 'relationship'
  | 'learning'
  | 'finance'
  | 'creativity'
  | 'personal';

export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';

// AI对话相关类型
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'goal_suggestion' | 'reflection';
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// 用户偏好设置
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'zh' | 'en';
  notifications: {
    email: boolean;
    push: boolean;
    goalReminders: boolean;
  };
  privacy: {
    showProfile: boolean;
    shareProgress: boolean;
  };
}

// API响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 通用UI组件类型
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'date';