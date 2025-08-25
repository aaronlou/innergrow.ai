'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Progress, Modal, ModalHeader, ModalContent, ModalFooter } from '@/components/ui';
import { Button, Input } from '@/components/ui';
import { DashboardLayout, ProtectedRoute } from '@/components/layout';
import { useI18n } from '@/contexts';
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
  const { t } = useI18n();
  const [goals] = useState<Goal[]>([
    {
      id: '1',
      title: '每日阅读30分钟',
      description: '通过每天阅读来扩展知识面和提升思维能力',
      category: 'goals.filter.learning',
      status: 'active',
      progress: 75,
      targetDate: '2024-12-31',
      createdAt: '2024-01-01'
    },
    {
      id: '2', 
      title: '坚持健身锻炼',
      description: '每周至少进行3次有氧运动，每次30分钟以上',
      category: 'goals.filter.health',
      status: 'active', 
      progress: 60,
      targetDate: '2024-12-31',
      createdAt: '2024-01-15'
    },
    {
      id: '3',
      title: '学习新的编程技能',
      description: '掌握 React 和 TypeScript 的高级用法',
      category: 'goals.filter.career',
      status: 'completed',
      progress: 100,
      targetDate: '2024-01-15',
      createdAt: '2023-12-01'
    }
  ]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>(t('goals.filter.all'));

  const categories = [
    t('goals.filter.all'),
    t('goals.filter.health'),
    t('goals.filter.learning'),
    t('goals.filter.career'),
    t('goals.filter.relationships'),
    t('goals.filter.finance')
  ];
  
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
      case 'active': return t('goals.status.active');
      case 'completed': return t('goals.status.completed');
      case 'paused': return t('goals.status.paused');
      default: return status;
    }
  };

  const filteredGoals = activeFilter === t('goals.filter.all')
    ? goals 
    : goals.filter(goal => t(goal.category) === activeFilter);

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
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold mb-2">{t('goals.title')}</h1>
              <p className="text-muted-foreground">
                {t('goals.subtitle')}
              </p>
            </div>
            <Button onClick={() => setShowAddModal(true)}>
              + {t('goals.addNew')}
            </Button>
          </div>

          {/* Statistics cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-lg">🎯</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">{t('goals.total')}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">{t('goals.active')}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">{t('goals.completed')}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">{t('goals.paused')}</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.paused}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <div className="flex gap-2 mb-6">
            {categories.map((category) => (
              <Button 
                key={category}
                variant={activeFilter === category ? "primary" : "outline"} 
                size="sm"
                onClick={() => setActiveFilter(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Goals list */}
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
                      <div className="text-sm text-muted-foreground">{t('goals.progress')}</div>
                      <div className="text-2xl font-bold text-brand-primary">{goal.progress}%</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={goal.progress} className="h-2" />
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        {goal.targetDate ? `${t('goals.targetDate')}: ${goal.targetDate}` : t('goals.noTargetDate')}
                      </span>
                      <span className="text-muted-foreground">{t('goals.category')}: {t(goal.category)}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">{t('goals.viewDetails')}</Button>
                      <Button variant="outline" size="sm">{t('goals.edit')}</Button>
                      {goal.status === 'active' && (
                        <Button variant="ghost" size="sm">{t('goals.markComplete')}</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add goal modal */}
          <Modal open={showAddModal} onClose={() => setShowAddModal(false)}>
            <ModalHeader 
              title={t('goals.create.title')} 
              description={t('goals.create.subtitle')} 
              onClose={() => setShowAddModal(false)}
            />
            <ModalContent>
              <div className="space-y-4">
                <Input label={t('goals.create.goalTitle')} placeholder={t('goals.create.goalTitlePlaceholder')} />
                <Input label={t('goals.create.goalDescription')} type="textarea" placeholder={t('goals.create.goalDescriptionPlaceholder')} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">{t('goals.create.category')}</label>
                    <select className="w-full mt-1 p-2 border border-input rounded-md">
                      <option>{t('goals.filter.health')}</option>
                      <option>{t('goals.filter.learning')}</option>
                      <option>{t('goals.filter.career')}</option>
                      <option>{t('goals.filter.relationships')}</option>
                      <option>{t('goals.filter.finance')}</option>
                    </select>
                  </div>
                  <Input label={t('goals.create.targetDate')} type="date" />
                </div>
              </div>
            </ModalContent>
            <ModalFooter>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                {t('goals.create.cancel')}
              </Button>
              <Button onClick={() => setShowAddModal(false)}>
                {t('goals.create.createGoal')}
              </Button>
            </ModalFooter>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}