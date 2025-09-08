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
export type Language = 'en' | 'zh';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: Language;
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

// 国际化相关类型
export interface I18nConfig {
  language: Language;
  messages: Record<string, string>;
}

export interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string;
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
  onClick?: () => void;
}

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'default';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'date';

// 二手书交易相关类型
export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publishYear?: number;
  category: BookCategory;
  condition: BookCondition;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  status: BookStatus;
  createdAt: Date;
  updatedAt: Date;
  location?: string;
  tags?: string[];
}

export type BookCategory = 
  | 'literature'
  | 'science'
  | 'technology'
  | 'history'
  | 'philosophy'
  | 'art'
  | 'education'
  | 'children'
  | 'other';

export type BookCondition = 
  | 'new'
  | 'like-new'
  | 'good'
  | 'fair'
  | 'poor';

export type BookStatus = 
  | 'available'
  | 'sold'
  | 'reserved'
  | 'removed';

export interface BookOrder {
  id: string;
  bookId: string;
  book: Book;
  buyerId: string;
  buyerName: string;
  buyerContact: string;
  sellerId: string;
  amount: number;
  status: OrderStatus;
  message?: string;
  shippingAddress?: ShippingAddress;
  paymentMethod?: PaymentMethod;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'paid'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export interface ShippingAddress {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  address: string;
  zipCode?: string;
}

export type PaymentMethod = 
  | 'wechat'
  | 'alipay'
  | 'cash'
  | 'bank-transfer';

export interface BookSearchFilter {
  keyword?: string;
  category?: BookCategory;
  condition?: BookCondition;
  priceRange?: [number, number];
  location?: string;
  sortBy?: 'newest' | 'price-low' | 'price-high' | 'condition';
}

// 考试和讨论室相关类型
export interface Exam {
  id: string;
  title: string;
  description?: string;
  category?: string;
  exam_time?: string; // date-only string YYYY-MM-DD
  material?: string; // file URL
  created_at?: string;
  updated_at?: string;
  user_id?: string; // creator user id (optional depending on backend serializer)
  user_name?: string; // creator name if provided
  participants?: string[]; // participant user ids/names (depending on backend shape)
  participants_count?: number; // count shortcut if backend returns it
  is_participant?: boolean; // convenience flag from backend (if provided)
  discussion_room?: DiscussionRoom; // associated discussion room
}

// 讨论室系统 - 替代 StudyPlan
export interface DiscussionRoom {
  id: string;
  exam_id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  posts_count: number;
  members_count: number;
  is_member: boolean;
}

export interface Post {
  id: string;
  room_id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  title: string;
  content: string;
  post_type: PostType;
  tags: string[];
  upvotes: number;
  downvotes: number;
  user_vote?: 'up' | 'down' | null;
  comments_count: number;
  created_at: string;
  updated_at: string;
  is_pinned?: boolean;
  attachments?: PostAttachment[];
}

export type PostType = 'question' | 'resource' | 'experience' | 'note' | 'discussion';

export interface PostAttachment {
  id: string;
  type: 'image' | 'file' | 'link';
  url: string;
  name: string;
  size?: number;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  upvotes: number;
  downvotes: number;
  user_vote?: 'up' | 'down' | null;
  parent_id?: string; // for nested comments
  replies?: Comment[];
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
}

export interface CreatePostData {
  title: string;
  content: string;
  post_type: PostType;
  tags?: string[];
  attachments?: File[];
}

export interface CreateCommentData {
  content: string;
  parent_id?: string;
}