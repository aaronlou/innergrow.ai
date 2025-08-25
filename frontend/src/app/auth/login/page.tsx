'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Toast } from '@/components/ui';
import { Button, Input } from '@/components/ui';
import { useAuth, useI18n } from '@/contexts';
import { useForm } from '@/hooks';
import { useState, useEffect } from 'react';

// export const metadata: Metadata = {
//   title: '登录',
//   description: '登录您的 InnerGrow.ai 账户',
// };

interface LoginFormData extends Record<string, string> {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });

  const { fields, setValue, handleSubmit, isSubmitting } = useForm<LoginFormData>({
    initialValues: {
      email: '',
      password: '',
    },
    validationRules: {
      email: {
        required: true,
        email: true,
      },
      password: {
        required: true,
        minLength: 6,
      },
    },
    onSubmit: async (values) => {
      const result = await login(values.email, values.password);
      
      if (result.success) {
        setToast({
          show: true,
          type: 'success',
          message: t('auth.loginSuccess'),
        });
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        setToast({
          show: true,
          type: 'error',
          message: result.error || t('auth.loginError'),
        });
      }
    },
  });

  // 如果已经登录，重定向到仪表板
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-primary mb-2">InnerGrow.ai</h1>
          <p className="text-muted-foreground">{t('home.hero.subtitle')}</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('auth.welcomeBack')}</CardTitle>
            <CardDescription>
              {t('auth.loginSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t('auth.email')}
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                value={fields.email.value}
                error={fields.email.touched ? fields.email.error : ''}
                onChange={(e) => setValue('email', e.target.value)}
                required
              />
              <Input
                label={t('auth.password')}
                type="password"
                placeholder={t('auth.loginPasswordPlaceholder')}
                value={fields.password.value}
                error={fields.password.touched ? fields.password.error : ''}
                onChange={(e) => setValue('password', e.target.value)}
                required
              />
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span>{t('auth.rememberMe')}</span>
                </label>
                <a href="#" className="text-brand-primary hover:underline">
                  {t('auth.forgotPassword')}
                </a>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                loading={isSubmitting}
              >
                {isSubmitting ? t('auth.loggingIn') : t('common.login')}
              </Button>
            </form>
            
            <div className="text-center mt-4">
              <span className="text-sm text-muted-foreground">
                {t('auth.noAccount')}{' '}
                <Link href="/auth/register" className="text-brand-primary hover:underline">
                  {t('auth.registerNow')}
                </Link>
              </span>
            </div>
            
            {/* 演示提示 */}
            <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>{t('auth.demoAccount')}:</strong><br />
                {t('auth.email')}: demo@innergrow.ai<br />
                {t('auth.password')}: password
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Toast 通知 */}
      {toast.show && (
        <Toast
          type={toast.type}
          title={toast.type === 'success' ? t('common.success') : t('common.error')}
          description={toast.message}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
}