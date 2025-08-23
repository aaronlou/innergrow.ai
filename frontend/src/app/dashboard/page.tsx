'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Progress } from '@/components/ui';
import { Button } from '@/components/ui';
import { DashboardLayout, ProtectedRoute } from '@/components/layout';
import { useAuth } from '@/contexts';
import Link from 'next/link';

// export const metadata: Metadata = {
//   title: '仪表板',
//   description: '查看您的成长进度和目标达成情况',
// };

export default function DashboardPage() {
  const { user } = useAuth();
  
  // 模拟数据
  const mockStats = {
    activeGoals: 3,
    completionRate: 67,
    weeklyTasks: 12,
    streakDays: 7,
  };

  const mockGoals = [
    {
      id: '1',
      title: '每日阅读30分钟',
      category: '学习成长',
      progress: 75,
      color: 'from-blue-500 to-purple-600',
    },
    {
      id: '2', 
      title: '坚持运动',
      category: '健康',
      progress: 60,
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: '3',
      title: '学习新技能',
      category: '职业发展',
      progress: 45,
      color: 'from-orange-500 to-red-600',
    },
  ];

  const mockInsights = [
    {
      type: 'success',
      icon: '💪',
      title: '好消息！',
      message: '您已经连续7天完成日常任务，保持这个节奏！',
    },
    {
      type: 'info',
      icon: '💡',
      title: 'AI 建议',
      message: '基于您的学习进度，建议今天尝试一个新的学习领域。',
    },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          {/* 欢迎信息 */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">
              你好，{user?.name}! 😊
            </h1>
            <p className="text-muted-foreground">
              今天是您成长之旅的第 {mockStats.streakDays} 天，继续保持动力！
            </p>
          </div>

          {/* 数据概览 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-l-brand-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">活跃目标</p>
                    <p className="text-2xl font-bold text-brand-primary">{mockStats.activeGoals}</p>
                  </div>
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-xl">🎯</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">完成率</p>
                    <p className="text-2xl font-bold text-green-600">{mockStats.completionRate}%</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">✅</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">本周任务</p>
                    <p className="text-2xl font-bold text-blue-600">{mockStats.weeklyTasks}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">📋</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">连续天数</p>
                    <p className="text-2xl font-bold text-orange-600">{mockStats.streakDays}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">🔥</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 最近目标 */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>最近的目标</CardTitle>
                    <Link href="/goals">
                      <Button variant="outline" size="sm">
                        查看全部
                      </Button>
                    </Link>
                  </div>
                  <CardDescription>查看和管理您的成长目标</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockGoals.map((goal) => (
                      <div key={goal.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-medium">{goal.title}</h3>
                            <p className="text-sm text-muted-foreground">{goal.category}</p>
                          </div>
                          <Badge variant="secondary" size="sm">
                            {goal.progress}%
                          </Badge>
                        </div>
                        <Progress 
                          value={goal.progress}
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 成长见解和快捷操作 */}
            <div className="space-y-6">
              {/* 成长见解 */}
              <Card>
                <CardHeader>
                  <CardTitle>成长见解</CardTitle>
                  <CardDescription>基于您数据的个性化建议</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockInsights.map((insight, index) => (
                      <div key={index} className="p-3 bg-accent/50 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <span className="text-lg">{insight.icon}</span>
                          <div>
                            <h4 className="font-medium text-sm">{insight.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {insight.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 快捷操作 */}
              <Card>
                <CardHeader>
                  <CardTitle>快捷操作</CardTitle>
                  <CardDescription>常用功能快速访问</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Link href="/chat">
                      <Button variant="outline" className="w-full justify-start">
                        <span className="mr-2">🤖</span>
                        与 AI 助手对话
                      </Button>
                    </Link>
                    <Link href="/goals">
                      <Button variant="outline" className="w-full justify-start">
                        <span className="mr-2">➕</span>
                        添加新目标
                      </Button>
                    </Link>
                    <Link href="/reports">
                      <Button variant="outline" className="w-full justify-start">
                        <span className="mr-2">📈</span>
                        查看成长报告
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}