'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Toast } from '@/components/ui';
import { Button, Input } from '@/components/ui';
import { useAuth, useI18n } from '@/contexts';
import { useForm } from '@/hooks';
import { useState, useEffect } from 'react';

// export const metadata: Metadata = {
//   title: '注册',
//   description: '创建您的 InnerGrow.ai 账户',
// };

interface RegisterFormData extends Record<string, string> {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });

  const { fields, setValue, handleSubmit, isSubmitting } = useForm<RegisterFormData>({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationRules: {
      name: {
        required: true,
        minLength: 2,
        maxLength: 50,
      },
      email: {
        required: true,
        email: true,
      },
      password: {
        required: true,
        minLength: 6,
      },
      confirmPassword: {
        required: true,
        custom: (value) => {
          if (value !== fields.password.value) {
            return t('auth.passwordMismatch');
          }
          return null;
        },
      },
    },
    onSubmit: async (values) => {
      const result = await register(values.name, values.email, values.password);
      
      if (result.success) {
        setToast({
          show: true,
          type: 'success',
          message: t('auth.registerSuccess'),
        });
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        setToast({
          show: true,
          type: 'error',
          message: result.error || t('auth.registerError'),
        });
      }
    },
  });

  // Redirect to dashboard if already authenticated
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
            <CardTitle>{t('auth.register.title')}</CardTitle>
            <CardDescription>
              {t('auth.register.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t('auth.name')}
                type="text"
                placeholder={t('auth.namePlaceholder')}
                value={fields.name.value}
                error={fields.name.touched ? fields.name.error : ''}
                onChange={(e) => setValue('name', e.target.value)}
                required
              />
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
                placeholder={t('auth.passwordPlaceholder')}
                value={fields.password.value}
                error={fields.password.touched ? fields.password.error : ''}
                onChange={(e) => setValue('password', e.target.value)}
                required
              />
              <Input
                label={t('auth.confirmPassword')}
                type="password"
                placeholder={t('auth.confirmPasswordPlaceholder')}
                value={fields.confirmPassword.value}
                error={fields.confirmPassword.touched ? fields.confirmPassword.error : ''}
                onChange={(e) => setValue('confirmPassword', e.target.value)}
                required
              />
              <div className="flex items-start space-x-2 text-sm">
                <input type="checkbox" className="rounded mt-1" required />
                <span className="text-muted-foreground">
                  {t('auth.agreeToTerms')}{' '}
                  <a href="#" className="text-brand-primary hover:underline">
                    {t('auth.termsOfService')}
                  </a>{' '}
                  {t('common.and')}{' '}
                  <a href="#" className="text-brand-primary hover:underline">
                    {t('auth.privacyPolicy')}
                  </a>
                </span>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                loading={isSubmitting}
              >
                {isSubmitting ? t('auth.registering') : t('auth.createAccount')}
              </Button>
            </form>
            
            <div className="text-center mt-4">
              <span className="text-sm text-muted-foreground">
                {t('auth.hasAccount')}{' '}
                <Link href="/auth/login" className="text-brand-primary hover:underline">
                  {t('auth.loginNow')}
                </Link>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Toast notification */}
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