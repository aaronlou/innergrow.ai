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
  const { login, isAuthenticated, googleLogin } = useAuth();
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
      console.log('Form submission:', {
        email: values.email,
        hasPassword: !!values.password,
        passwordLength: values.password?.length,
        formValues: { ...values, password: '[REDACTED]' }
      });

      const result = await login(values.email, values.password);

      console.log('Login form result:', {
        success: result.success,
        error: result.error,
        hasData: !!result.data
      });

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

  // Google Sign-In handler
  const handleGoogleLogin = async () => {
    console.log('Google login button clicked');
    console.log('Environment check:', {
      hasGoogleClientId: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'not set'
    });
    
    const result = await googleLogin();
    
    console.log('Google login result:', result);

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
  };

  // 如果已经登录，重定向到仪表板
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Container for Google Sign-In prompt */}
      <div id="google-signin-prompt"></div>
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

            {/* Google Sign-In Button */}
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">
                    {t('auth.orContinueWith')}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleGoogleLogin}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  {t('auth.googleLogin')}
                </Button>
              </div>
            </div>

            <div className="text-center mt-6">
              <span className="text-sm text-muted-foreground">
                {t('auth.noAccount')}{' '}
                <Link href="/auth/register" className="text-brand-primary hover:underline">
                  {t('auth.registerNow')}
                </Link>
              </span>
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