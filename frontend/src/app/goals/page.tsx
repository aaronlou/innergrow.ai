import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui';

export const metadata: Metadata = {
  title: '目标管理',
  description: '管理和追踪您的个人成长目标',
};

export default function GoalsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">目标管理</h1>
          <p className="text-muted-foreground">
            设定、追踪和实现您的个人成长目标
          </p>
        </div>
        <Button>
          + 添加新目标
        </Button>
      </div>

      {/* 目标统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-brand-primary/10 rounded-lg">
                <div className="w-4 h-4 bg-brand-primary rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">总目标</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">进行中</p>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">已完成</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">暂停</p>
                <p className="text-2xl font-bold">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 目标筛选 */}
      <div className="flex gap-2 mb-6">
        <Button variant="outline" size="sm">全部</Button>
        <Button variant="outline" size="sm">健康</Button>
        <Button variant="outline" size="sm">学习</Button>
        <Button variant="outline" size="sm">职业</Button>
        <Button variant="outline" size="sm">人际关系</Button>
        <Button variant="outline" size="sm">财务</Button>
      </div>

      {/* 目标列表 */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  每日阅读30分钟
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    进行中
                  </span>
                </CardTitle>
                <CardDescription>
                  通过每天阅读来扩展知识面和提升思维能力
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">进度</div>
                <div className="text-2xl font-bold text-brand-primary">75%</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-brand-primary h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">目标日期: 2024-12-31</span>
                <span className="text-muted-foreground">类别: 学习</span>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">查看详情</Button>
                <Button variant="outline" size="sm">编辑</Button>
                <Button variant="ghost" size="sm">标记完成</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  坚持健身锻炼
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    进行中
                  </span>
                </CardTitle>
                <CardDescription>
                  每周至少进行3次有氧运动，每次30分钟以上
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">进度</div>
                <div className="text-2xl font-bold text-brand-primary">60%</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-brand-primary h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">目标日期: 2024-12-31</span>
                <span className="text-muted-foreground">类别: 健康</span>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">查看详情</Button>
                <Button variant="outline" size="sm">编辑</Button>
                <Button variant="ghost" size="sm">标记完成</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  学习新的编程技能
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    已完成
                  </span>
                </CardTitle>
                <CardDescription>
                  掌握 React 和 TypeScript 的高级用法
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">进度</div>
                <div className="text-2xl font-bold text-green-600">100%</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full w-full"></div>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">完成日期: 2024-01-15</span>
                <span className="text-muted-foreground">类别: 职业</span>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">查看详情</Button>
                <Button variant="outline" size="sm">复制目标</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}