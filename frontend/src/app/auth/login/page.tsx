import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Button, Input } from '@/components/ui';

export const metadata: Metadata = {
  title: '登录',
  description: '登录您的 InnerGrow.ai 账户',
};

export default function LoginPage() {
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
          <CardContent className="space-y-4">
            <Input
              label="邮箱地址"
              type="email"
              placeholder="请输入您的邮箱"
              required
            />
            <Input
              label="密码"
              type="password"
              placeholder="请输入密码"
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
            <Button className="w-full" size="lg">
              登录
            </Button>
            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                还没有账户？{' '}
                <a href="/auth/register" className="text-brand-primary hover:underline">
                  立即注册
                </a>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}