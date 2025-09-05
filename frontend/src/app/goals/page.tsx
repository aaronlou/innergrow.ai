'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Progress, Modal, ModalHeader, ModalContent, ModalFooter } from '@/components/ui';
import { Button, Input } from '@/components/ui';
import { DashboardLayout, ProtectedRoute } from '@/components/layout';
import { useI18n } from '@/contexts';
import { useState, useEffect } from 'react';
import { goalsService, Goal, AISuggestion, GoalCategory, GoalStatus, GoalStatistics } from '@/lib/api/goals';
import { useAuth } from '@/contexts';

// Update the Goal interface to match the API response
interface LocalGoal extends Goal {
  // Add any local properties that don't come from the API
}

export default function GoalsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [goals, setGoals] = useState<LocalGoal[]>([]);
  const [categories, setCategories] = useState<GoalCategory[]>([]);
  const [statuses, setStatuses] = useState<GoalStatus[]>([]);
  const [statistics, setStatistics] = useState<GoalStatistics>({
    total: 0,
    active: 0,
    completed: 0,
    paused: 0,
    public: 0,
    private: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  // 表单状态
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    category_id: '',
    status_id: '',
    visibility: 'private' as 'public' | 'private',
    target_date: ''
  });

  // AI建议状态
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, AISuggestion[]>>({});
  const [showSuggestions, setShowSuggestions] = useState<Record<string, boolean>>({});

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load goals
      const goalsResponse = await goalsService.getGoals();
      if (goalsResponse.success && goalsResponse.data) {
        setGoals(goalsResponse.data as LocalGoal[]);
      } else {
        setError(goalsResponse.error || 'Failed to load goals');
      }
      
      // Load categories
      const categoriesResponse = await goalsService.getCategories();
      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data);
        // Set default category if none selected
        if (!formState.category_id && categoriesResponse.data.length > 0) {
          setFormState(prev => ({
            ...prev,
            category_id: categoriesResponse.data[0].id
          }));
        }
      }
      
      // Load statuses
      const statusesResponse = await goalsService.getStatuses();
      if (statusesResponse.success && statusesResponse.data) {
        setStatuses(statusesResponse.data);
        // Set default status if none selected
        if (!formState.status_id && statusesResponse.data.length > 0) {
          setFormState(prev => ({
            ...prev,
            status_id: statusesResponse.data[0].id
          }));
        }
      }
      
      // Load statistics
      const statsResponse = await goalsService.getStatistics();
      if (statsResponse.success && statsResponse.data) {
        setStatistics(statsResponse.data);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statusName: string) => {
    switch(statusName) {
      case 'active': 
      case '进行中':
        return 'success';
      case 'completed': 
      case '已完成':
        return 'info'; 
      case 'paused': 
      case '暂停':
        return 'warning';
      default: 
        return 'default';
    }
  };

  const getStatusText = (status: GoalStatus) => {
    // Use the translated name based on current language
    const currentLanguage = typeof window !== 'undefined' ? 
      localStorage.getItem('language') || 'zh' : 'zh';
    
    return currentLanguage === 'en' ? status.name_en : status.name;
  };

  const getCategoryText = (category: GoalCategory) => {
    // Use the translated name based on current language
    const currentLanguage = typeof window !== 'undefined' ? 
      localStorage.getItem('language') || 'zh' : 'zh';
    
    return currentLanguage === 'en' ? category.name_en : category.name;
  };

  const handleFormChange = (field: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateGoal = async () => {
    try {
      const goalData = {
        title: formState.title,
        description: formState.description,
        category_id: formState.category_id,
        status_id: formState.status_id,
        visibility: formState.visibility,
        target_date: formState.target_date
      };
      
      const response = await goalsService.createGoal(goalData);
      
      if (response.success && response.data) {
        // Add the new goal to the list
        setGoals(prev => [...prev, response.data as LocalGoal]);
        
        // Reset form
        setFormState({
          title: '',
          description: '',
          category_id: categories.length > 0 ? categories[0].id : '',
          status_id: statuses.length > 0 ? statuses[0].id : '',
          visibility: 'private',
          target_date: ''
        });
        
        // Close modal
        setShowAddModal(false);
        
        // Reload statistics
        const statsResponse = await goalsService.getStatistics();
        if (statsResponse.success && statsResponse.data) {
          setStatistics(statsResponse.data);
        }
      } else {
        setError(response.error || 'Failed to create goal');
      }
    } catch (err) {
      setError('Failed to create goal');
      console.error('Error creating goal:', err);
    }
  };

  const handleAnalyzeGoal = async (goalId: string) => {
    try {
      // First try to get existing suggestions
      const suggestionsResponse = await goalsService.getSuggestions(goalId);
      
      if (suggestionsResponse.success && suggestionsResponse.data) {
        // Use existing suggestions
        setAiSuggestions(prev => ({
          ...prev,
          [goalId]: suggestionsResponse.data || []
        }));
      } else {
        // Generate new suggestions
        const analyzeResponse = await goalsService.analyzeGoal(goalId);
        
        if (analyzeResponse.success && analyzeResponse.data) {
          setAiSuggestions(prev => ({
            ...prev,
            [goalId]: analyzeResponse.data || []
          }));
        } else {
          setError(analyzeResponse.error || 'Failed to analyze goal');
          return;
        }
      }
      
      // Show suggestions
      setShowSuggestions(prev => ({
        ...prev,
        [goalId]: true
      }));
    } catch (err) {
      setError('Failed to analyze goal');
      console.error('Error analyzing goal:', err);
    }
  };

  const handleAcceptSuggestion = async (goalId: string, suggestionId: string) => {
    try {
      const response = await goalsService.acceptSuggestion(goalId, suggestionId, true);
      
      if (response.success && response.data) {
        // Update local state to mark suggestion as accepted
        setAiSuggestions(prev => ({
          ...prev,
          [goalId]: prev[goalId].map(suggestion => 
            suggestion.id === suggestionId 
              ? { ...suggestion, accepted: true } 
              : suggestion
          )
        }));
      } else {
        setError(response.error || 'Failed to accept suggestion');
      }
    } catch (err) {
      setError('Failed to accept suggestion');
      console.error('Error accepting suggestion:', err);
    }
  };

  const handleMarkComplete = async (goalId: string) => {
    try {
      const response = await goalsService.markComplete(goalId);
      
      if (response.success && response.data) {
        // Update the goal in the list
        setGoals(prev => 
          prev.map(goal => 
            goal.id === goalId ? response.data as LocalGoal : goal
          )
        );
        
        // Reload statistics
        const statsResponse = await goalsService.getStatistics();
        if (statsResponse.success && statsResponse.data) {
          setStatistics(statsResponse.data);
        }
      } else {
        setError(response.error || 'Failed to mark goal as complete');
      }
    } catch (err) {
      setError('Failed to mark goal as complete');
      console.error('Error marking goal as complete:', err);
    }
  };

  const filteredGoals = activeFilter === 'all'
    ? goals 
    : goals.filter(goal => {
        if (activeFilter === 'active') {
          const currentLanguage = typeof window !== 'undefined' ? 
            localStorage.getItem('language') || 'zh' : 'zh';
          const statusName = currentLanguage === 'en' ? goal.status.name_en : goal.status.name;
          return statusName === 'active' || statusName === '进行中';
        }
        if (activeFilter === 'completed') {
          const currentLanguage = typeof window !== 'undefined' ? 
            localStorage.getItem('language') || 'zh' : 'zh';
          const statusName = currentLanguage === 'en' ? goal.status.name_en : goal.status.name;
          return statusName === 'completed' || statusName === '已完成';
        }
        if (activeFilter === 'paused') {
          const currentLanguage = typeof window !== 'undefined' ? 
            localStorage.getItem('language') || 'zh' : 'zh';
          const statusName = currentLanguage === 'en' ? goal.status.name_en : goal.status.name;
          return statusName === 'paused' || statusName === '暂停';
        }
        return true;
      });

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6">
            <div className="flex justify-center items-center h-64">
              <p>{t('common.loading')}</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
              <Button 
                onClick={loadData} 
                className="mt-2"
              >
                {t('common.retry')}
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

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
                    <p className="text-2xl font-bold">{statistics.total}</p>
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
                    <p className="text-2xl font-bold text-green-600">{statistics.active}</p>
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
                    <p className="text-2xl font-bold text-blue-600">{statistics.completed}</p>
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
                    <p className="text-2xl font-bold text-orange-600">{statistics.paused}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <div className="flex gap-2 mb-6">
            <Button 
              variant={activeFilter === 'all' ? "primary" : "outline"} 
              size="sm"
              onClick={() => setActiveFilter('all')}
            >
              {t('goals.filter.all')}
            </Button>
            <Button 
              variant={activeFilter === 'active' ? "primary" : "outline"} 
              size="sm"
              onClick={() => setActiveFilter('active')}
            >
              {t('goals.status.active')}
            </Button>
            <Button 
              variant={activeFilter === 'completed' ? "primary" : "outline"} 
              size="sm"
              onClick={() => setActiveFilter('completed')}
            >
              {t('goals.status.completed')}
            </Button>
            <Button 
              variant={activeFilter === 'paused' ? "primary" : "outline"} 
              size="sm"
              onClick={() => setActiveFilter('paused')}
            >
              {t('goals.status.paused')}
            </Button>
          </div>

          {/* Goals list */}
          <div className="space-y-4">
            {filteredGoals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('goals.empty')}</p>
                <p className="text-muted-foreground mt-2">{t('goals.emptyDescription')}</p>
                <Button 
                  className="mt-4" 
                  onClick={() => setShowAddModal(true)}
                >
                  {t('goals.addNew')}
                </Button>
              </div>
            ) : (
              filteredGoals.map((goal) => (
                <div key={goal.id}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {goal.title}
                            <Badge variant={getStatusColor(getStatusText(goal.status)) as 'success' | 'info' | 'warning' | 'default'} size="sm">
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
                            {goal.target_date ? `${t('goals.targetDate')}: ${goal.target_date}` : t('goals.noTargetDate')}
                          </span>
                          <span className="text-muted-foreground">{t('goals.category')}: {getCategoryText(goal.category)}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">{t('goals.viewDetails')}</Button>
                          <Button variant="outline" size="sm">{t('goals.edit')}</Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleAnalyzeGoal(goal.id)}
                          >
                            {t('goals.analyzeWithAI')}
                          </Button>
                          {getStatusText(goal.status) !== 'completed' && getStatusText(goal.status) !== '已完成' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleMarkComplete(goal.id)}
                            >
                              {t('goals.markComplete')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* AI Suggestions */}
                  {showSuggestions[goal.id] && aiSuggestions[goal.id] && (
                    <Card className="mt-2 border-l-4 border-l-blue-500">
                      <CardHeader>
                        <CardTitle className="text-lg">{t('goals.aiSuggestions')}</CardTitle>
                        <CardDescription>{t('goals.aiSuggestionsDescription')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {aiSuggestions[goal.id].map((suggestion) => (
                            <div 
                              key={suggestion.id} 
                              className={`flex items-start p-3 rounded-lg ${
                                suggestion.completed 
                                  ? 'bg-green-50 border border-green-200' 
                                  : 'bg-blue-50 border border-blue-200'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={suggestion.accepted}
                                onChange={() => !suggestion.accepted && handleAcceptSuggestion(goal.id, suggestion.id)}
                                className="mt-1 mr-3 h-4 w-4 text-blue-600 rounded"
                                disabled={suggestion.accepted}
                              />
                              <div className="flex-1">
                                <div className="font-medium">{suggestion.title}</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {suggestion.description}
                                </div>
                                <Badge 
                                  variant={suggestion.priority === 'high' ? 'success' : suggestion.priority === 'medium' ? 'warning' : 'default'} 
                                  size="sm" 
                                  className="mt-2"
                                >
                                  {t(`goals.priority.${suggestion.priority}`)}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))
            )}
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
                <Input 
                  label={t('goals.create.goalTitle')} 
                  placeholder={t('goals.create.goalTitlePlaceholder')} 
                  value={formState.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                />
                <Input 
                  label={t('goals.create.goalDescription')} 
                  type="textarea" 
                  placeholder={t('goals.create.goalDescriptionPlaceholder')} 
                  value={formState.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">{t('goals.create.category')}</label>
                    <select 
                      className="w-full mt-1 p-2 border border-input rounded-md"
                      value={formState.category_id}
                      onChange={(e) => handleFormChange('category_id', e.target.value)}
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {getCategoryText(category)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t('goals.create.status')}</label>
                    <select 
                      className="w-full mt-1 p-2 border border-input rounded-md"
                      value={formState.status_id}
                      onChange={(e) => handleFormChange('status_id', e.target.value)}
                    >
                      {statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {getStatusText(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">{t('goals.visibility')}</label>
                    <select 
                      className="w-full mt-1 p-2 border border-input rounded-md"
                      value={formState.visibility}
                      onChange={(e) => handleFormChange('visibility', e.target.value)}
                    >
                      <option value="public">{t('goals.visibility.public')}</option>
                      <option value="private">{t('goals.visibility.private')}</option>
                    </select>
                  </div>
                  <Input 
                    label={t('goals.create.targetDate')} 
                    type="date" 
                    value={formState.target_date}
                    onChange={(e) => handleFormChange('target_date', e.target.value)}
                  />
                </div>
              </div>
            </ModalContent>
            <ModalFooter>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                {t('goals.create.cancel')}
              </Button>
              <Button 
                onClick={handleCreateGoal}
                disabled={!formState.title.trim()}
              >
                {t('goals.create.createGoal')}
              </Button>
            </ModalFooter>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}