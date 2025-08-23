import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui';

export const metadata: Metadata = {
  title: '仪表板',
  description: '查看您的成长进度和目标达成情况',
};

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">欢迎回来！</h1>
        <p className="text-muted-foreground">
          继续您的成长之旅，查看最新的进展和建议
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* 目标概览 */}
        <Card>
          <CardHeader>
            <CardTitle>活跃目标</CardTitle>
            <CardDescription>当前正在进行的目标</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-brand-primary mb-2">3</div>
            <p className="text-sm text-muted-foreground">
              平均完成度: 67%
            </p>
          </CardContent>
        </Card>

        {/* 本周进展 */}
        <Card>
          <CardHeader>
            <CardTitle>本周进展</CardTitle>
            <CardDescription>这周的成长活动</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-brand-secondary mb-2">12</div>
            <p className="text-sm text-muted-foreground">
              完成的任务数量
            </p>
          </CardContent>
        </Card>

        {/* AI 对话 */}
        <Card>
          <CardHeader>
            <CardTitle>AI 助手</CardTitle>
            <CardDescription>获得个性化建议</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              与 AI 助手聊天，获得个性化的成长建议和支持
            </p>
            <Button size="sm" className="w-full">
              开始对话
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 最近目标 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>最近的目标</CardTitle>
            <CardDescription>查看和管理您的成长目标</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">每日阅读30分钟</h3>
                  <p className="text-sm text-muted-foreground">学习成长类别</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-brand-primary">75%</div>
                  <div className="text-xs text-muted-foreground">进度</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">坚持运动</h3>
                  <p className="text-sm text-muted-foreground">健康类别</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-brand-primary">60%</div>
                  <div className="text-xs text-muted-foreground">进度</div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Button variant="outline" className="w-full">
                查看所有目标
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 成长见解 */}
        <Card>
          <CardHeader>
            <CardTitle>成长见解</CardTitle>
            <CardDescription>基于您的数据的个性化建议</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-accent rounded-lg">
                <h4 className="font-medium mb-2">💡 今日建议</h4>
                <p className="text-sm text-muted-foreground">
                  您在学习方面表现出色！建议今天尝试一个新的学习主题来拓展知识面。
                </p>
              </div>
              
              <div className="p-4 bg-accent rounded-lg">
                <h4 className="font-medium mb-2">📈 趋势分析</h4>
                <p className="text-sm text-muted-foreground">
                  您的目标完成率在过去一周提升了15%，保持这个节奏！
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}