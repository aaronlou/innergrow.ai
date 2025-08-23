'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Toast } from '@/components/ui';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/contexts';
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
            return '两次密码输入不一致';
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
          message: '注册成功！欢迎加入 InnerGrow.ai！',
        });
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        setToast({
          show: true,
          type: 'error',
          message: result.error || '注册失败，请重试',
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
            <CardTitle>创建账户</CardTitle>
            <CardDescription>
              开始您的个人成长之旅
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="姓名"
                type="text"
                placeholder="请输入您的姓名"
                value={fields.name.value}
                error={fields.name.touched ? fields.name.error : ''}
                onChange={(e) => setValue('name', e.target.value)}
                required
              />
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
                placeholder="至少6位字符"
                value={fields.password.value}
                error={fields.password.touched ? fields.password.error : ''}
                onChange={(e) => setValue('password', e.target.value)}
                required
              />
              <Input
                label="确认密码"
                type="password"
                placeholder="再次输入密码"
                value={fields.confirmPassword.value}
                error={fields.confirmPassword.touched ? fields.confirmPassword.error : ''}
                onChange={(e) => setValue('confirmPassword', e.target.value)}
                required
              />
              <div className="flex items-start space-x-2 text-sm">
                <input type="checkbox" className="rounded mt-1" required />
                <span className="text-muted-foreground">
                  我同意{' '}
                  <a href="#" className="text-brand-primary hover:underline">
                    服务条款
                  </a>{' '}
                  和{' '}
                  <a href="#" className="text-brand-primary hover:underline">
                    隐私政策
                  </a>
                </span>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                loading={isSubmitting}
              >
                {isSubmitting ? '注册中...' : '创建账户'}
              </Button>
            </form>
            
            <div className="text-center mt-4">
              <span className="text-sm text-muted-foreground">
                已有账户？{' '}
                <Link href="/auth/login" className="text-brand-primary hover:underline">
                  立即登录
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
          title={toast.type === 'success' ? '成功' : '错误'}
          description={toast.message}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
}