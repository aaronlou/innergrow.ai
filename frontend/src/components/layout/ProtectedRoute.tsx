'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useI18n } from '@/contexts';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  redirectTo = '/auth/login'
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    // Only redirect when not loading and not authenticated
    if (!isLoading && !isAuthenticated) {
      console.log('User not authenticated, redirecting to login page');
      // Use replace instead of push to avoid history stack buildup
      // Use setTimeout to ensure redirect happens in next event loop
      setTimeout(() => {
        router.replace(redirectTo);
      }, 0);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  // If not authenticated, immediately show redirecting state while executing redirect
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">{t('auth.redirectingToLogin')}</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">{t('auth.verifying')}</p>
        </div>
      </div>
    );
  }

  // 未认证用户不渲染内容（这个检查现在在上面处理了）
  if (!isAuthenticated) {
    return null;
  }

  // 已认证用户显示内容
  return <>{children}</>;
}