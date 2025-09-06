'use client';

// GoalsPage responsibilities:
// - Fetch goals, categories, statuses, and statistics on mount
// - Support creating goals, AI analysis/suggestions, accepting suggestions, marking goals complete
// - Filter list by status and render with i18n text

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Progress, Modal, ModalHeader, ModalContent, ModalFooter } from '@/components/ui';
import { Button, Input } from '@/components/ui';
import { Dropdown, DropdownItem } from '@/components/ui';
import { Toast } from '@/components/ui';
import { DashboardLayout, ProtectedRoute } from '@/components/layout';
import { useI18n, useAuth } from '@/contexts';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { goalsService, Goal, AISuggestion, GoalCategory, GoalStatus, GoalStatistics } from '@/lib/api/goals';

// Update the Goal interface to match the API response
type LocalGoal = Goal; // Alias keeps room for future UI-only additions via intersection

function GoalsPageContent() {
  const { t, language } = useI18n(); // i18n helpers
  const { isAuthenticated } = useAuth(); // Authentication state
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Business data: goals, categories, statuses, statistics
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

  // Generic UI states
  const [loading, setLoading] = useState(true); // initial and refresh loading
  const [error, setError] = useState<string | null>(null); // global error banner
  const [showAddModal, setShowAddModal] = useState(false); // create-goal modal
  const [activeFilter, setActiveFilter] = useState<string>('all'); // list filter
  const [filterCategoryId, setFilterCategoryId] = useState<string>(''); // '' means all
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'public' | 'private'>('all');
  // Reset all filters to defaults
  const clearAllFilters = () => {
    setActiveFilter('all');
    setFilterCategoryId('');
    setFilterVisibility('all');
  };

  // Controlled state for the create-goal form
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    category_id: '',
    status_id: '',
    visibility: 'private' as 'public' | 'private',
    target_date: ''
  });

  // AI suggestions cache: key is goal id, value is its suggestion list
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, AISuggestion[]>>({});
  // Whether the suggestion panel is open for a specific goal
  const [showSuggestions, setShowSuggestions] = useState<Record<string, boolean>>({});
  const [analyzing, setAnalyzing] = useState<Record<string, boolean>>({});
  const [preferredModel, setPreferredModel] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<LocalGoal | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsGoal, setDetailsGoal] = useState<LocalGoal | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category_id: '',
    status_id: '',
    visibility: 'private' as 'public' | 'private',
    target_date: ''
  });

  // Toast state
  const [toast, setToast] = useState<{ visible: boolean; type: 'success' | 'error' | 'warning' | 'info'; title?: string; description?: string }>(
    { visible: false, type: 'info' }
  );
  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title?: string, description?: string) => {
    setToast({ visible: true, type, title, description });
  };

  // Aggregate load: goals, categories, statuses, statistics
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load goals
      const goalsResponse = await goalsService.getGoals();
      if (goalsResponse.success && goalsResponse.data) {
        setGoals(goalsResponse.data as LocalGoal[]);
      } else {
        setGoals([]); // Ensure goals is always an array
        setError(goalsResponse.error || 'Failed to load goals');
      }

      // Load categories
      const categoriesResponse = await goalsService.getCategories();
      if (categoriesResponse.success) {
        const categoryList = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [];
        setCategories(categoryList);
        // Set default category if none selected
        if (categoryList.length > 0) {
          setFormState(prev => (
            !prev.category_id ? { ...prev, category_id: categoryList[0].id } : prev
          ));
        }
      } else {
        setCategories([]); // Ensure categories is always an array
      }

      // Load statuses
      const statusesResponse = await goalsService.getStatuses();
      if (statusesResponse.success) {
        const statusList = Array.isArray(statusesResponse.data) ? statusesResponse.data : [];
        setStatuses(statusList);
        // Set default status to "New" or equivalent for new goals
        if (statusList.length > 0) {
          setFormState(prev => {
            if (!prev.status_id) {
              // Find "New", "Not Started", or first status as fallback
              const newStatus = statusList.find(status => {
                if (!status || typeof status !== 'object') return false;
                const statusCode = (status.name_en || status.name || '').toLowerCase();
                return ['new', 'not started'].includes(statusCode);
              });
              return { ...prev, status_id: newStatus?.id || statusList[0]?.id || '' };
            }
            return prev;
          });
        }
      } else {
        setStatuses([]); // Ensure statuses is always an array
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
  }, []);

  // Load data on component mount - 只有在用户已认证时才加载数据
  useEffect(() => {
    if (isAuthenticated) {
      // Fetch all required data on mount
      loadData();
    }
    // Restore preferred AI model
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai_model');
      if (saved) setPreferredModel(saved);

      // Restore filters
      const url = new URL(window.location.href);
      const urlStatus = url.searchParams.get('status');
      const urlCategory = url.searchParams.get('category');
      const urlVisibility = url.searchParams.get('visibility');

      if (urlStatus) setActiveFilter(urlStatus);
      if (urlCategory) setFilterCategoryId(urlCategory);
      if (urlVisibility === 'public' || urlVisibility === 'private' || urlVisibility === 'all') {
        setFilterVisibility(urlVisibility);
      }
      if (!urlStatus && !urlCategory && !urlVisibility) {
        const savedStatus = localStorage.getItem('goals_filter_status');
        const savedCategory = localStorage.getItem('goals_filter_category');
        const savedVisibility = localStorage.getItem('goals_filter_visibility');
        if (savedStatus) setActiveFilter(savedStatus);
        if (savedCategory) setFilterCategoryId(savedCategory);
        if (savedVisibility === 'public' || savedVisibility === 'private' || savedVisibility === 'all') {
          setFilterVisibility(savedVisibility);
        }
      }
    }
  }, [loadData, isAuthenticated]);

  // Debounced URL updater to reduce replace() calls
  const urlUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleUrlUpdate = useCallback((delta: { status?: string; category?: string; visibility?: string }) => {
    if (urlUpdateTimer.current) clearTimeout(urlUpdateTimer.current);
    urlUpdateTimer.current = setTimeout(() => {
      try {
        const params = new URLSearchParams(searchParams?.toString());
        if (delta.status !== undefined) {
          if (delta.status) params.set('status', delta.status); else params.delete('status');
        }
        if (delta.category !== undefined) {
          if (delta.category) params.set('category', delta.category); else params.delete('category');
        }
        if (delta.visibility !== undefined) {
          if (delta.visibility) params.set('visibility', delta.visibility); else params.delete('visibility');
        }
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      } catch { }
    }, 150);
  }, [searchParams, router, pathname]);

  // Persist filters when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('goals_filter_status', activeFilter);
    }
    // Update URL query for shareable filters (status)
    scheduleUrlUpdate({ status: activeFilter !== 'all' ? activeFilter : undefined });
  }, [activeFilter, scheduleUrlUpdate]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('goals_filter_category', filterCategoryId);
    }
    // Update URL query (category)
    scheduleUrlUpdate({ category: filterCategoryId || undefined });
  }, [filterCategoryId, scheduleUrlUpdate]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('goals_filter_visibility', filterVisibility);
    }
    // Update URL query (visibility)
    scheduleUrlUpdate({ visibility: filterVisibility !== 'all' ? filterVisibility : undefined });
  }, [filterVisibility, scheduleUrlUpdate]);

  // loadData defined above

  // Map a language-agnostic status code to badge color
  const getStatusColor = (statusCode: string) => {
    switch (statusCode) {
      case 'new':
        return 'default';  // Gray for "New" - neutral, not yet started
      case 'not started':
        return 'default';  // Gray for "Not Started" - neutral, not yet started
      case 'in progress':
        return 'info';     // Blue for "In Progress" - actively working
      case 'active':
        return 'info';     // Blue for "Active" - actively working
      case 'done':
        return 'success';  // Green for "Done" - successful completion
      case 'completed':
        return 'success';  // Green for "Completed" - successful completion
      case 'on hold':
        return 'warning';  // Orange/Yellow for "On Hold" - temporarily paused
      case 'paused':
        return 'warning';  // Orange/Yellow for "Paused" - temporarily paused
      default:
        return 'default';
    }
  };

  // Pick status display text based on current language (backend provides name/name_en)
  const getStatusText = (status: GoalStatus) => {
    if (!status || typeof status !== 'object') return '';
    // Use the translated name based on current language
    return language === 'en' ? (status.name_en || status.name || '') : (status.name || status.name_en || '');
  };

  // Get a language-agnostic status code for logic (prefer English, lowercase)
  const getStatusCode = (status: GoalStatus) => {
    if (!status || typeof status !== 'object') return '';
    return (status.name_en || status.name || '').toLowerCase();
  };

  // Sort statuses by natural progression order
  const getSortedStatuses = (statusList: GoalStatus[]) => {
    // Ensure we have a valid array
    if (!statusList || !Array.isArray(statusList)) return [];
    
    const statusOrder = ['new', 'not started', 'in progress', 'active', 'on hold', 'paused', 'done', 'completed'];
    
    // Create a safe copy and filter out invalid entries
    const validStatuses = statusList.filter(status => status && typeof status === 'object' && status.id);
    
    return validStatuses.sort((a, b) => {
      const codeA = getStatusCode(a);
      const codeB = getStatusCode(b);
      
      const indexA = statusOrder.findIndex(order => order === codeA);
      const indexB = statusOrder.findIndex(order => order === codeB);
      
      // If both statuses are in the order array, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // If only one is in the order array, it comes first
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // If neither is in the order array, sort alphabetically
      return codeA.localeCompare(codeB);
    });
  };

  // Pick category display text based on current language (backend provides name/name_en)
  const getCategoryText = (category: GoalCategory) => {
    if (!category || typeof category !== 'object') return '';
    // Use the translated name based on current language
    return language === 'en' ? (category.name_en || category.name || '') : (category.name || category.name_en || '');
  };

  // Controlled update for create form fields
  const handleFormChange = (field: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Create goal: on success, append to list and refresh statistics
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
          status_id: (() => {
            // Find "New" or "Not Started" status for new goals
            if (!statuses || statuses.length === 0) return '';
            
            const newStatus = statuses.find(status => {
              if (!status || typeof status !== 'object') return false;
              const statusCode = (status.name_en || status.name || '').toLowerCase();
              return ['new', 'not started'].includes(statusCode);
            });
            return newStatus?.id || statuses[0]?.id || '';
          })(),
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

  // AI analysis flow:
  // 1) Try to get existing suggestions
  // 2) If none, call analyze to generate new suggestions
  // 3) Open the suggestion panel for this goal
  const handleAnalyzeGoal = async (goalId: string, model?: string) => {
    try {
      setAnalyzing(prev => ({ ...prev, [goalId]: true }));
      if (model && typeof window !== 'undefined') {
        localStorage.setItem('ai_model', model);
        setPreferredModel(model);
      }
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
        const analyzeResponse = await goalsService.analyzeGoal(goalId, { model, timeoutMs: 20000 });

        if (analyzeResponse.success && analyzeResponse.data) {
          setAiSuggestions(prev => ({
            ...prev,
            [goalId]: analyzeResponse.data || []
          }));
          showToast('success', t('goals.aiAnalyzeSuccess'));
        } else {
          const msg = analyzeResponse.error || 'Failed to analyze goal';
          setError(msg);
          showToast('error', t('goals.aiAnalyzeFailed'), msg);
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
      showToast('error', t('goals.aiAnalyzeFailed'));
    } finally {
      setAnalyzing(prev => ({ ...prev, [goalId]: false }));
    }
  };

  // Accept an AI suggestion and mark it as accepted locally
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
        showToast('success', t('goals.accepted'));
      } else {
        const msg = response.error || 'Failed to accept suggestion';
        setError(msg);
        showToast('error', t('goals.acceptFailed'), msg);
      }
    } catch (err) {
      setError('Failed to accept suggestion');
      console.error('Error accepting suggestion:', err);
      showToast('error', t('goals.acceptFailed'));
    }
  };

  // Mark goal as complete: update list and refresh statistics
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
        showToast('success', t('goals.markedComplete'));
      } else {
        const msg = response.error || 'Failed to mark goal as complete';
        setError(msg);
        showToast('error', t('goals.markCompleteFailed'), msg);
      }
    } catch (err) {
      setError('Failed to mark goal as complete');
      console.error('Error marking goal as complete:', err);
      showToast('error', t('goals.markCompleteFailed'));
    }
  };

  // Delete goal
  const handleDeleteGoal = async (goalId: string) => {
    try {
      const res = await goalsService.deleteGoal(goalId);
      if (res.success) {
        setGoals(prev => (prev || []).filter(g => g.id !== goalId));
        const statsResponse = await goalsService.getStatistics();
        if (statsResponse.success && statsResponse.data) {
          setStatistics(statsResponse.data);
        }
        showToast('success', t('goals.deleted'));
      } else {
        const msg = res.error || 'Failed to delete goal';
        setError(msg);
        showToast('error', t('goals.deleteFailed'), msg);
      }
    } catch (err) {
      setError('Failed to delete goal');
      console.error('Error deleting goal:', err);
      showToast('error', t('goals.deleteFailed'));
    }
  };

  // Compute filtered goal list based on activeFilter using language-agnostic status code
  const filteredGoals = (() => {
    // Ensure goals is a valid array
    if (!goals || !Array.isArray(goals)) {
      console.log('DEBUG: Goals is not a valid array:', goals);
      return [];
    }
    
    console.log('DEBUG: Starting filter process');
    console.log('DEBUG: Total goals:', goals.length);
    console.log('DEBUG: Active filter:', activeFilter);
    console.log('DEBUG: Filter category ID:', filterCategoryId);
    console.log('DEBUG: Filter visibility:', filterVisibility);
    
    const result = goals.filter(goal => {
      console.log('DEBUG: Processing goal:', goal?.title, 'ID:', goal?.id);
      
      // Ensure goal is a valid object
      if (!goal || typeof goal !== 'object') {
        console.log('DEBUG: Goal is not a valid object:', goal);
        return false;
      }
      
      // status filter
      if (activeFilter !== 'all') {
        // Ensure goal has a valid status object
        if (!goal.status || typeof goal.status !== 'object') {
          console.log('DEBUG: Goal has invalid status:', goal.status);
          return false;
        }
        
        const code = getStatusCode(goal.status);
        console.log('DEBUG: Goal status code:', code, 'for goal:', goal.title);
        
        // Handle various possible status names from backend
        if (activeFilter === 'not_started' && !['new', 'not started'].includes(code)) {
          console.log('DEBUG: Goal filtered out by not_started filter:', goal.title);
          return false;
        }
        if (activeFilter === 'active' && !['in progress', 'active'].includes(code)) {
          console.log('DEBUG: Goal filtered out by active filter:', goal.title);
          return false;
        }
        if (activeFilter === 'completed' && !['done', 'completed'].includes(code)) {
          console.log('DEBUG: Goal filtered out by completed filter:', goal.title);
          return false;
        }
        if (activeFilter === 'paused' && !['on hold', 'paused'].includes(code)) {
          console.log('DEBUG: Goal filtered out by paused filter:', goal.title);
          return false;
        }
      }
      
      // category filter
      if (filterCategoryId) {
        // Ensure goal has a valid category object
        if (!goal.category || typeof goal.category !== 'object' || !goal.category.id) {
          console.log('DEBUG: Goal has invalid category:', goal.category);
          return false;
        }
        if (goal.category.id !== filterCategoryId) {
          console.log('DEBUG: Goal filtered out by category filter:', goal.title, 'category:', goal.category.id);
          return false;
        }
      }
      
      // visibility filter
      if (filterVisibility !== 'all' && goal.visibility !== filterVisibility) {
        console.log('DEBUG: Goal filtered out by visibility filter:', goal.title, 'visibility:', goal.visibility);
        return false;
      }
      
      console.log('DEBUG: Goal passed all filters:', goal.title);
      return true;
    });
    
    console.log('DEBUG: Filtered goals count:', result.length);
    console.log('DEBUG: Filtered goals:', result.map(g => ({ title: g.title, status: g.status?.name || g.status?.name_en, category: g.category?.name || g.category?.name_en })));
    
    return result;
  })();

  // Loading fallback
  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6 space-y-6">
            {/* Skeleton for header */}
            <div className="flex justify-between items-center">
              <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              <div className="h-9 w-32 bg-muted animate-pulse rounded" />
            </div>
            {/* Skeleton for stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-6 border rounded-lg bg-card">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-muted animate-pulse rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                      <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Skeleton for list */}
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-6 border rounded-lg">
                  <div className="h-5 w-2/3 bg-muted animate-pulse rounded mb-3" />
                  <div className="h-4 w-3/5 bg-muted animate-pulse rounded mb-4" />
                  <div className="h-2 w-full bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // Error fallback (with retry)
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
          {/* Header: title + actions */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold mb-2">{t('goals.title')}</h1>
              <p className="text-muted-foreground">
                {t('goals.subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowAddModal(true)} aria-label={t('goals.addNew')}>
                + {t('goals.addNew')}
              </Button>

            </div>
          </div>

          {/* Statistics cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-lg">🎯</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-muted-foreground">{t('goals.total')}</p>
                    <p className="text-xl font-bold">{statistics.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-lg">✅</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-muted-foreground">{t('goals.active')}</p>
                    <p className="text-xl font-bold text-green-600">{statistics.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-lg">🏆</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-muted-foreground">{t('goals.completed')}</p>
                    <p className="text-xl font-bold text-blue-600">{statistics.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <span className="text-lg">⏸️</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-muted-foreground">{t('goals.paused')}</p>
                    <p className="text-xl font-bold text-orange-600">{statistics.paused}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters: status (buttons), category (select), visibility (buttons) */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Button
              variant={activeFilter === 'all' ? "primary" : "outline"}
              size="sm"
              aria-pressed={activeFilter === 'all'}
              aria-label={t('goals.filter.all')}
              onClick={() => setActiveFilter('all')}
            >
              {t('goals.filter.all')}
            </Button>
            <Button
              variant={activeFilter === 'not_started' ? "primary" : "outline"}
              size="sm"
              aria-pressed={activeFilter === 'not_started'}
              aria-label={t('goals.status.not_started')}
              onClick={() => setActiveFilter('not_started')}
            >
              {t('goals.status.not_started')}
            </Button>
            <Button
              variant={activeFilter === 'active' ? "primary" : "outline"}
              size="sm"
              aria-pressed={activeFilter === 'active'}
              aria-label={t('goals.status.active')}
              onClick={() => setActiveFilter('active')}
            >
              {t('goals.status.active')}
            </Button>
            <Button
              variant={activeFilter === 'completed' ? "primary" : "outline"}
              size="sm"
              aria-pressed={activeFilter === 'completed'}
              aria-label={t('goals.status.completed')}
              onClick={() => setActiveFilter('completed')}
            >
              {t('goals.status.completed')}
            </Button>
            <Button
              variant={activeFilter === 'paused' ? "primary" : "outline"}
              size="sm"
              aria-pressed={activeFilter === 'paused'}
              aria-label={t('goals.status.paused')}
              onClick={() => setActiveFilter('paused')}
            >
              {t('goals.status.paused')}
            </Button>

            <div className="ml-2 flex items-center gap-2">
              <label className="text-sm text-muted-foreground" htmlFor="goals-filter-category">{t('goals.category')}</label>
              <select
                className="p-2 border border-input rounded-md text-sm"
                value={filterCategoryId}
                onChange={(e) => setFilterCategoryId(e.target.value)}
                id="goals-filter-category"
                aria-label={t('goals.category')}
              >
                <option value="">{t('goals.filter.all')}</option>
                {(categories || []).filter(c => c && typeof c === 'object' && c.id).map((c) => (
                  <option key={c.id} value={c.id}>{getCategoryText(c)}</option>
                ))}
              </select>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('goals.visibility')}</span>
              <Button
                variant={filterVisibility === 'all' ? 'primary' : 'outline'}
                size="sm"
                aria-pressed={filterVisibility === 'all'}
                aria-label={t('goals.filter.all')}
                onClick={() => setFilterVisibility('all')}
              >{t('goals.filter.all')}</Button>
              <Button
                variant={filterVisibility === 'public' ? 'primary' : 'outline'}
                size="sm"
                aria-pressed={filterVisibility === 'public'}
                aria-label={t('goals.visibility.public')}
                onClick={() => setFilterVisibility('public')}
              >{t('goals.visibility.public')}</Button>
              <Button
                variant={filterVisibility === 'private' ? 'primary' : 'outline'}
                size="sm"
                aria-pressed={filterVisibility === 'private'}
                aria-label={t('goals.visibility.private')}
                onClick={() => setFilterVisibility('private')}
              >{t('goals.visibility.private')}</Button>

              {/* Clear all filters */}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                aria-label={t('goals.resetFilters')}
              >
                {t('goals.resetFilters')}
              </Button>
            </div>
          </div>



          {/* Goals list and AI suggestion panel */}
          <div className="space-y-4">
            {filteredGoals.length === 0 ? (
              <div className="text-center py-12">
                {goals.length === 0 ? (
                  <>
                    <p className="text-muted-foreground">{t('goals.empty')}</p>
                    <p className="text-muted-foreground mt-2">{t('goals.emptyDescription')}</p>
                  
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground">{t('goals.emptyFiltered')}</p>
                    <div className="flex gap-2 justify-center mt-4">
                      <Button size="sm" variant="outline" onClick={clearAllFilters}>
                        {t('goals.resetFilters')}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              (filteredGoals || []).filter(goal => goal && typeof goal === 'object' && goal.id).map((goal) => (
                <div key={goal.id}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {goal.title}
                            <Badge variant={getStatusColor(getStatusCode(goal.status)) as 'success' | 'info' | 'warning' | 'default'} size="sm">
                              {getStatusText(goal.status)}
                            </Badge>
                            <Badge variant={'default'} size="sm">
                              {goal.visibility === 'public' ? t('goals.visibility.public') : t('goals.visibility.private')}
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDetailsGoal(goal);
                              setShowDetailsModal(true);
                            }}
                          >
                            {t('goals.viewDetails')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingGoal(goal);
                              setEditForm({
                                title: goal.title,
                                description: goal.description,
                                category_id: goal.category.id,
                                status_id: goal.status.id,
                                visibility: goal.visibility,
                                target_date: goal.target_date || ''
                              });
                              setShowEditModal(true);
                            }}
                          >
                            {t('goals.edit')}
                          </Button>
                          <Dropdown
                            trigger={
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!!analyzing[goal.id]}
                                aria-label={t('goals.analyzeWithAI')}
                              >
                                {analyzing[goal.id] ? t('goals.analyzing') : `${t('goals.analyzeWithAI')}${preferredModel ? ` (${preferredModel})` : ''}`}
                              </Button>
                            }
                          >
                            <DropdownItem onClick={() => handleAnalyzeGoal(goal.id)}>
                              {t('goals.quickAnalyze')}
                            </DropdownItem>
                            <DropdownItem onClick={() => handleAnalyzeGoal(goal.id, 'gpt-4o-mini')}>
                              gpt-4o-mini
                            </DropdownItem>
                            <DropdownItem onClick={() => handleAnalyzeGoal(goal.id, 'gpt-4o')}>
                              gpt-4o
                            </DropdownItem>
                            <DropdownItem onClick={() => handleAnalyzeGoal(goal.id, 'o3-mini')}>
                              o3-mini
                            </DropdownItem>
                          </Dropdown>
                          {getStatusCode(goal.status) !== 'completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkComplete(goal.id)}
                            >
                              {t('goals.markComplete')}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteGoalId(goal.id);
                              setShowDeleteModal(true);
                            }}
                          >
                            {t('goals.delete')}
                          </Button>
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
                          {(aiSuggestions[goal.id] || []).filter(suggestion => suggestion && typeof suggestion === 'object' && suggestion.id).map((suggestion) => (
                            <div
                              key={suggestion.id}
                              className={`flex items-start p-3 rounded-lg ${suggestion.completed
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('goals.create.category')}</label>
                    <select
                      className="w-full p-2 border border-input rounded-md bg-background"
                      value={formState.category_id}
                      onChange={(e) => handleFormChange('category_id', e.target.value)}
                    >
                      {(categories || []).filter(category => category && typeof category === 'object' && category.id).map((category) => (
                        <option key={category.id} value={category.id}>
                          {getCategoryText(category)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('goals.create.status')}</label>
                    <select
                      className="w-full p-2 border border-input rounded-md bg-background"
                      value={formState.status_id}
                      onChange={(e) => handleFormChange('status_id', e.target.value)}
                    >
                      {getSortedStatuses(statuses).map((status) => (
                        <option key={status.id} value={status.id}>
                          {getStatusText(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('goals.visibility')}</label>
                    <select
                      className="w-full p-2 border border-input rounded-md bg-background"
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
                    lang={language === 'zh' ? 'zh-CN' : 'en-US'}
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
        {/* Global toast */}
        {toast.visible && (
          <Toast
            type={toast.type}
            title={toast.title}
            description={toast.description}
            onClose={() => setToast(prev => ({ ...prev, visible: false }))}
          />
        )}

        {/* Delete confirmation modal */}
        <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <ModalHeader
            title={t('goals.deleteConfirmTitle')}
            description={t('goals.deleteConfirmDescription')}
            onClose={() => setShowDeleteModal(false)}
          />
          <ModalContent>
            <div className="text-sm text-muted-foreground">
              {t('common.confirmDelete')}
            </div>
          </ModalContent>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (deleteGoalId) {
                  handleDeleteGoal(deleteGoalId);
                }
                setShowDeleteModal(false);
                setDeleteGoalId(null);
              }}
            >
              {t('common.confirm')}
            </Button>
          </ModalFooter>
        </Modal>

        {/* Edit goal modal */}
        <Modal open={showEditModal} onClose={() => setShowEditModal(false)}>
          <ModalHeader
            title={t('goals.editGoal')}
            description={t('goals.updateGoal')}
            onClose={() => setShowEditModal(false)}
          />
          <ModalContent>
            <div className="space-y-4">
              <Input
                label={t('goals.create.goalTitle')}
                placeholder={t('goals.create.goalTitlePlaceholder')}
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              />
              <Input
                label={t('goals.create.goalDescription')}
                type="textarea"
                placeholder={t('goals.create.goalDescriptionPlaceholder')}
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('goals.create.category')}</label>
                  <select
                    className="w-full mt-1 p-2 border border-input rounded-md"
                    value={editForm.category_id}
                    onChange={(e) => setEditForm(prev => ({ ...prev, category_id: e.target.value }))}
                  >
                    {(categories || []).filter(category => category && typeof category === 'object' && category.id).map((category) => (
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
                    value={editForm.status_id}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status_id: e.target.value }))}
                  >
                    {getSortedStatuses(statuses).map((status) => (
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
                    value={editForm.visibility}
                    onChange={(e) => setEditForm(prev => ({ ...prev, visibility: e.target.value as 'public' | 'private' }))}
                  >
                    <option value="public">{t('goals.visibility.public')}</option>
                    <option value="private">{t('goals.visibility.private')}</option>
                  </select>
                </div>
                <Input
                  label={t('goals.create.targetDate')}
                  type="date"
                  value={editForm.target_date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, target_date: e.target.value }))}
                  lang={language === 'zh' ? 'zh-CN' : 'en-US'}
                />
              </div>
            </div>
          </ModalContent>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              {t('goals.create.cancel')}
            </Button>
            <Button
              onClick={async () => {
                if (!editingGoal) return;
                const res = await goalsService.updateGoal(editingGoal.id, editForm);
                console.log('Update goal response:', res);
                
                if (res.success && res.data) {
                  // Ensure the updated goal has a valid status object
                  const updatedGoal = res.data as LocalGoal;
                  console.log('Updated goal data:', updatedGoal);
                  console.log('Updated goal status:', updatedGoal.status);
                  console.log('Updated goal category:', updatedGoal.category);
                  
                  if (updatedGoal && (!updatedGoal.status || typeof updatedGoal.status !== 'object')) {
                    console.log('Status missing or invalid, trying to find from statuses list');
                    // If status is missing, try to find it from the current statuses list
                    const matchingStatus = statuses.find(s => s && s.id === editForm.status_id);
                    console.log('Matching status found:', matchingStatus);
                    if (matchingStatus) {
                      updatedGoal.status = matchingStatus;
                    } else {
                      // Fallback to original goal's status
                      console.log('Using original goal status as fallback:', editingGoal.status);
                      updatedGoal.status = editingGoal.status;
                    }
                  }
                  
                  if (updatedGoal && (!updatedGoal.category || typeof updatedGoal.category !== 'object')) {
                    console.log('Category missing or invalid, trying to find from categories list');
                    // If category is missing, try to find it from the current categories list
                    const matchingCategory = categories.find(c => c && c.id === editForm.category_id);
                    console.log('Matching category found:', matchingCategory);
                    if (matchingCategory) {
                      updatedGoal.category = matchingCategory;
                    } else {
                      // Fallback to original goal's category
                      console.log('Using original goal category as fallback:', editingGoal.category);
                      updatedGoal.category = editingGoal.category;
                    }
                  }
                  
                  setGoals(prev => prev.map(g => g.id === editingGoal.id ? updatedGoal : g));
                  showToast('success', t('goals.updateSuccess'));
                  setShowEditModal(false);
                } else {
                  showToast('error', t('goals.updateFailed'), res.error);
                }
              }}
              disabled={!editForm.title.trim()}
            >
              {t('goals.updateGoal')}
            </Button>
          </ModalFooter>
        </Modal>

        {/* Details modal */}
        <Modal open={showDetailsModal} onClose={() => setShowDetailsModal(false)}>
          <ModalHeader
            title={t('goals.details.title')}
            description={detailsGoal?.title || ''}
            onClose={() => setShowDetailsModal(false)}
          />
          <ModalContent>
            {detailsGoal && (
              <div className="space-y-3 text-sm">
                <div>{t('goals.create.goalDescription')}: {detailsGoal.description || '-'}</div>
                <div>{t('goals.category')}: {getCategoryText(detailsGoal.category)}</div>
                <div>{t('goals.progress')}: {detailsGoal.progress}%</div>
                <div>{t('goals.targetDate')}: {detailsGoal.target_date || t('goals.noTargetDate')}</div>
                <div>
                  {t('goals.visibility')}: {detailsGoal.visibility === 'public' ? t('goals.visibility.public') : t('goals.visibility.private')}
                </div>
              </div>
            )}
          </ModalContent>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              {t('common.close') || 'Close'}
            </Button>
          </ModalFooter>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default function GoalsPage() {
  // Wrap content in Suspense to satisfy useSearchParams requirement
  return (
    <Suspense fallback={<div />}>
      <GoalsPageContent />
    </Suspense>
  );
}