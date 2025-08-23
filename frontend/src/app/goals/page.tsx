'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Progress, Modal, ModalHeader, ModalContent, ModalFooter } from '@/components/ui';
import { Button, Input } from '@/components/ui';
import { DashboardLayout, ProtectedRoute } from '@/components/layout';
import { useState } from 'react';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  targetDate?: string;
  createdAt: string;
}

export default function GoalsPage() {
  const [goals] = useState<Goal[]>([
    {
      id: '1',
      title: '每日阅读30分钟',
      description: '通过每天阅读来扩展知识面和提升思维能力',
      category: '学习',
      status: 'active',
      progress: 75,
      targetDate: '2024-12-31',
      createdAt: '2024-01-01'
    },
    {
      id: '2', 
      title: '坚持健身锻炼',
      description: '每周至少进行3次有氧运动，每次30分钟以上',
      category: '健康',
      status: 'active', 
      progress: 60,
      targetDate: '2024-12-31',
      createdAt: '2024-01-15'
    },
    {
      id: '3',
      title: '学习新的编程技能',
      description: '掌握 React 和 TypeScript 的高级用法',
      category: '职业',
      status: 'completed',
      progress: 100,
      targetDate: '2024-01-15',
      createdAt: '2023-12-01'
    }
  ]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('全部');

  const categories = ['全部', '健康', '学习', '职业', '人际关系', '财务'];
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'success';
      case 'completed': return 'info'; 
      case 'paused': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'active': return '进行中';
      case 'completed': return '已完成';
      case 'paused': return '暂停';
      default: return status;
    }
  };

  const filteredGoals = activeFilter === '全部' 
    ? goals 
    : goals.filter(goal => goal.category === activeFilter);

  const stats = {
    total: goals.length,
    active: goals.filter(g => g.status === 'active').length,
    completed: goals.filter(g => g.status === 'completed').length,
    paused: goals.filter(g => g.status === 'paused').length
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          {/* 头部 */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold mb-2">目标管理</h1>
              <p className="text-muted-foreground">
                设定、追踪和实现您的个人成长目标
              </p>
            </div>
            <Button onClick={() => setShowAddModal(true)}>
              + 添加新目标
            </Button>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-lg">🎯</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">总目标</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-lg">✅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">进行中</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-lg">🏆</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">已完成</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <span className="text-lg">⏸️</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">暂停</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.paused}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 筛选器 */}
          <div className="flex gap-2 mb-6">
            {categories.map((category) => (
              <Button 
                key={category}
                variant={activeFilter === category ? "default" : "outline"} 
                size="sm"
                onClick={() => setActiveFilter(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* 目标列表 */}
          <div className="space-y-4">
            {filteredGoals.map((goal) => (
              <Card key={goal.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {goal.title}
                        <Badge variant={getStatusColor(goal.status) as 'success' | 'info' | 'warning' | 'default'} size="sm">
                          {getStatusText(goal.status)}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {goal.description}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">进度</div>
                      <div className="text-2xl font-bold text-brand-primary">{goal.progress}%</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={goal.progress} className="h-2" />
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        {goal.targetDate ? `目标日期: ${goal.targetDate}` : '无截止日期'}
                      </span>
                      <span className="text-muted-foreground">类别: {goal.category}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">查看详情</Button>
                      <Button variant="outline" size="sm">编辑</Button>
                      {goal.status === 'active' && (
                        <Button variant="ghost" size="sm">标记完成</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 添加目标模态框 */}
          <Modal open={showAddModal} onClose={() => setShowAddModal(false)}>
            <ModalHeader 
              title="添加新目标" 
              description="设定一个新的个人成长目标" 
              onClose={() => setShowAddModal(false)}
            />
            <ModalContent>
              <div className="space-y-4">
                <Input label="目标标题" placeholder="请输入目标标题" />
                <Input label="目标描述" type="textarea" placeholder="详细描述您的目标" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">类别</label>
                    <select className="w-full mt-1 p-2 border border-input rounded-md">
                      <option>健康</option>
                      <option>学习</option>
                      <option>职业</option>
                      <option>人际关系</option>
                      <option>财务</option>
                    </select>
                  </div>
                  <Input label="目标日期" type="date" />
                </div>
              </div>
            </ModalContent>
            <ModalFooter>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                取消
              </Button>
              <Button onClick={() => setShowAddModal(false)}>
                创建目标
              </Button>
            </ModalFooter>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}