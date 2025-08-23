import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Button, Input } from '@/components/ui';

export const metadata: Metadata = {
  title: '注册',
  description: '创建您的 InnerGrow.ai 账户',
};

export default function RegisterPage() {
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
          <CardContent className="space-y-4">
            <Input
              label="姓名"
              type="text"
              placeholder="请输入您的姓名"
              required
            />
            <Input
              label="邮箱地址"
              type="email"
              placeholder="请输入您的邮箱"
              required
            />
            <Input
              label="密码"
              type="password"
              placeholder="至少8位字符"
              required
            />
            <Input
              label="确认密码"
              type="password"
              placeholder="再次输入密码"
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
            <Button className="w-full" size="lg">
              创建账户
            </Button>
            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                已有账户？{' '}
                <a href="/auth/login" className="text-brand-primary hover:underline">
                  立即登录
                </a>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}