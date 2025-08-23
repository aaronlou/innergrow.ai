'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Toast } from '@/components/ui';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/contexts';
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
          message: '登录成功！正在跳转...',
        });
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        setToast({
          show: true,
          type: 'error',
          message: result.error || '登录失败，请重试',
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
          <p className="text-muted-foreground">AI 驱动的个人成长助手</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>欢迎回来</CardTitle>
            <CardDescription>
              登录您的账户以继续您的成长之旅
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="邮箱地址"
                type="email"
                placeholder="请输入您的邮箱"
                value={fields.email.value}
                error={fields.email.touched ? fields.email.error : ''}
                onChange={(e) => setValue('email', e.target.value)}
                required
              />
              <Input
                label="密码"
                type="password"
                placeholder="请输入密码"
                value={fields.password.value}
                error={fields.password.touched ? fields.password.error : ''}
                onChange={(e) => setValue('password', e.target.value)}
                required
              />
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span>记住我</span>
                </label>
                <a href="#" className="text-brand-primary hover:underline">
                  忘记密码？
                </a>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                loading={isSubmitting}
              >
                {isSubmitting ? '登录中...' : '登录'}
              </Button>
            </form>
            
            <div className="text-center mt-4">
              <span className="text-sm text-muted-foreground">
                还没有账户？{' '}
                <Link href="/auth/register" className="text-brand-primary hover:underline">
                  立即注册
                </Link>
              </span>
            </div>
            
            {/* 演示提示 */}
            <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>演示账户：</strong><br />
                邮箱: demo@innergrow.ai<br />
                密码: password
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Toast 通知 */}
      {toast.show && (
        <Toast
          type={toast.type}
          title={toast.type === 'success' ? '成功' : '错误'}
          description={toast.message}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
}