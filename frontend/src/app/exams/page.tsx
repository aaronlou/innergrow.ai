'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import { DashboardLayout, ProtectedRoute } from '@/components/layout';
import { PostCard, CreatePostForm } from '@/components/features';
import { useI18n, useAuth } from '@/contexts';
import examsService from '@/lib/api/exams';
import discussionsService from '@/lib/api/discussions';
import { DiscussionRoom, Post, CreatePostData, Exam, PostType } from '@/types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function ExamsPage() {
  const { user } = useAuth();
  const { t, language, formatDate } = useI18n();
  
  const [activeTab, setActiveTab] = useState<'discover' | 'discussions' | 'practice'>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [planGenerating, setPlanGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [discussionRooms, setDiscussionRooms] = useState<Record<string, DiscussionRoom>>({});
  const [currentRoomPosts, setCurrentRoomPosts] = useState<Post[]>([]);
  const [currentRoom, setCurrentRoom] = useState<DiscussionRoom | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postFilter, setPostFilter] = useState<PostType | 'all'>('all');
  const [postSort, setPostSort] = useState<'hot' | 'new' | 'top'>('hot');
  const [newExam, setNewExam] = useState({
    title: '',
    category: 'Language',
    description: '',
    exam_time: '',
    materialFile: null as File | null,
  });
  const [validationErrors, setValidationErrors] = useState<{ exam_time?: string; materialFile?: string }>({});
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Exam | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [waitlistFeatures, setWaitlistFeatures] = useState<Set<string>>(new Set());

  // Toast-like feedback via simple transient state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchExams = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Debug authentication status
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    console.log('[fetchExams] Auth debug:', {
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPreview: token ? `${token.substring(0, 10)}...` : null,
      isAuthenticated: true // This should match the auth context
    });
    
    const res = await examsService.list();
    console.log('Fetched exams:', { 
      success: res.success, 
      error: res.error, 
      dataCount: res.data?.length || 0,
      rawData: res.data,
      fullResponse: res
    });
    if (res.success && res.data) {
      setExams(res.data);
    } else {
      setError(res.error || 'Failed to load exams');
      showToast('error', res.error || 'Failed to load exams');
    }
    setLoading(false);
  }, []);

  // Fetch saved discussion rooms
  const fetchDiscussionRooms = useCallback(async () => {
    try {
      const roomsMap: Record<string, DiscussionRoom> = {};
      // For each exam, try to get its discussion room
      for (const exam of exams) {
        const res = await discussionsService.getRoom(exam.id);
        if (res.success && res.data) {
          roomsMap[exam.id] = res.data;
        }
      }
      setDiscussionRooms(roomsMap);
      console.log('Loaded discussion rooms:', roomsMap);
    } catch (err) {
      console.log('Failed to load discussion rooms:', err);
    }
  }, [exams]);

  useEffect(() => { 
    fetchExams();
  }, [fetchExams]);

  useEffect(() => {
    if (exams.length > 0) {
      fetchDiscussionRooms();
    }
  }, [exams, fetchDiscussionRooms]);

  const filteredExams = exams.filter(exam => exam.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCreateExam = async () => {
    const errors: typeof validationErrors = {};
    if (!newExam.exam_time) errors.exam_time = t('exams.examTimeRequired');
    setValidationErrors(errors);
    if (Object.keys(errors).length) {
      showToast('error', t('exams.examTimeRequired'));
      return;
    }
    setCreating(true);
    // exam_time already YYYY-MM-DD (DateField backend)
    const payload = { title: newExam.title, description: newExam.description, category: newExam.category, exam_time: newExam.exam_time, file: newExam.materialFile || undefined } as Partial<Exam> & { file?: File };
    const res = await examsService.create(payload);
    if (res.success && res.data) {
      setExams(prev => [...prev, res.data!]);
      showToast('success', newExam.materialFile ? t('exams.materialReady') : t('common.success'));
      setNewExam({ title: '', category: 'Language', description: '', exam_time: '', materialFile: null });
      setShowCreateModal(false);
    } else {
      showToast('error', res.error || t('common.error'));
    }
    setCreating(false);
  };

  const handleUpdateExam = async () => {
    if (!editingExam) return;
    const errors: typeof validationErrors = {};
    if (!newExam.exam_time) errors.exam_time = t('exams.examTimeRequired');
    setValidationErrors(errors);
    if (Object.keys(errors).length) {
      showToast('error', t('exams.examTimeRequired'));
      return;
    }
    setUpdating(true);
    const payload = { title: newExam.title, description: newExam.description, category: newExam.category, exam_time: newExam.exam_time, file: newExam.materialFile || undefined } as Partial<Exam> & { file?: File };
    const res = await examsService.update(editingExam.id, payload);
    if (res.success && res.data) {
      setExams(prev => prev.map(e => e.id === editingExam.id ? res.data! : e));
      const usedMaterial = newExam.materialFile || editingExam.material;
      showToast('success', usedMaterial ? t('exams.materialReady') : t('common.success'));
      setShowCreateModal(false);
      setEditingExam(null);
    } else {
      showToast('error', res.error || t('common.error'));
    }
    setUpdating(false);
  };

  const loadRoomPosts = async (roomId: string, filters?: { sort?: 'hot' | 'new' | 'top'; post_type?: PostType | 'all' }) => {
    setPostsLoading(true);
    try {
      const res = await discussionsService.getPosts(roomId, {
        sort: filters?.sort || postSort,
        post_type: (filters?.post_type && filters.post_type !== 'all') ? filters.post_type : undefined,
      });
      if (res.success && res.data) {
        setCurrentRoomPosts(res.data);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleCreatePost = async (postData: CreatePostData) => {
    if (!currentRoom) return;
    
    try {
      const res = await discussionsService.createPost(currentRoom.id, postData);
      if (res.success && res.data) {
        setCurrentRoomPosts(prev => [res.data!, ...prev]);
        setShowCreatePost(false);
        showToast('success', t('discussions.postCreated'));
      }
    } catch (error) {
      showToast('error', t('common.error'));
    }
  };

  const handlePostVote = async (postId: string, voteType: 'up' | 'down' | 'remove') => {
    try {
      const res = await discussionsService.votePost(postId, voteType);
      if (res.success && res.data) {
        setCurrentRoomPosts(prev => 
          prev.map(post => post.id === postId ? res.data! : post)
        );
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleJoinDiscussion = async (examId: string) => {
    setPlanGenerating(examId);
    try {
      const res = await discussionsService.getRoom(examId);
      if (res.success && res.data) {
        setCurrentRoom(res.data);
        setDiscussionRooms(prev => ({ ...prev, [examId]: res.data! }));
        setActiveTab('discussions');
        await loadRoomPosts(res.data.id);
      } else {
        // Room doesn't exist, might need to create or join first
        const joinRes = await discussionsService.joinRoom(examId);
        if (joinRes.success && joinRes.data) {
          setCurrentRoom(joinRes.data);
          setDiscussionRooms(prev => ({ ...prev, [examId]: joinRes.data! }));
          setActiveTab('discussions');
          await loadRoomPosts(joinRes.data.id);
        }
      }
      showToast('success', t('discussions.joinedRoom'));
    } catch (error) {
      showToast('error', t('common.error'));
    }
    setPlanGenerating(null);
  };

  const handleDeleteExam = async () => {
    if (!showDeleteConfirm) return;
    setDeleting(true);
    const res = await examsService.delete(showDeleteConfirm.id);
    if ((res.success && !res.error) || res.success === true) {
      setExams(prev => prev.filter(e => e.id !== showDeleteConfirm.id));
      setDiscussionRooms(prev => { const clone = { ...prev }; delete clone[showDeleteConfirm.id]; return clone; });
      if (currentRoom?.exam_id === showDeleteConfirm.id) {
        setCurrentRoom(null);
        setCurrentRoomPosts([]);
      }
      showToast('success', t('common.success'));
      setShowDeleteConfirm(null);
    } else {
      showToast('error', res.error || t('common.error'));
    }
    setDeleting(false);
  };

  const openEdit = (exam: Exam) => {
    setEditingExam(exam);
    setNewExam({
      title: exam.title,
      category: exam.category || 'Language',
      description: exam.description || '',
      exam_time: exam.exam_time ? exam.exam_time.slice(0, 10) : '',
      materialFile: null,
    });
    setShowCreateModal(true);
  };

  const handleJoinLeave = async (exam: Exam) => {
    // Optimistic update
    setExams(prev => prev.map(e => {
      if (e.id !== exam.id) return e;
      const joining = !e.is_participant;
      return {
        ...e,
        is_participant: joining,
        participants_count: (e.participants_count || 0) + (joining ? 1 : -1),
      };
    }));
    
    // Call the methods on the service object to preserve 'this' context
    const res = exam.is_participant 
      ? await examsService.leaveExam(exam.id)
      : await examsService.joinExam(exam.id);
      
    if (res.success && res.data) {
      setExams(prev => prev.map(e => e.id === exam.id ? res.data! : e));
      showToast('success', exam.is_participant ? t('exams.leaveSuccess') : t('exams.joinSuccess'));
    } else {
      // rollback
      setExams(prev => prev.map(e => {
        if (e.id !== exam.id) return e;
        return { ...e, is_participant: exam.is_participant, participants_count: exam.participants_count };
      }));
      showToast('error', res.error || t('common.error'));
    }
  };

  const handleJoinWaitlist = (feature: string) => {
    setWaitlistFeatures(prev => new Set([...prev, feature]));
    showToast('success', t('exams.waitlistSuccess'));
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          {toast && (
            <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-sm shadow ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{toast.message}</div>
          )}
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">{t('exams.title')}</h1>
            <p className="text-muted-foreground">{t('exams.subtitle')}</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-8 bg-muted p-1 rounded-lg w-fit">
            <button onClick={() => setActiveTab('discover')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'discover' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{t('exams.discoverTab')}</button>
            <button onClick={() => setActiveTab('discussions')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'discussions' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{t('exams.discussionsTab')}</button>
            <button onClick={() => setActiveTab('practice')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'practice' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{t('exams.practiceTab')}</button>
          </div>

          {/* Loading/Error States */}
          {activeTab === 'discover' && loading && (<div className="text-sm text-muted-foreground mb-4">{t('common.loading')}</div>)}
          {activeTab === 'discover' && error && !loading && (<div className="text-sm text-red-500 mb-4">{error}</div>)}

          {/* Discover Tab */}
          {activeTab === 'discover' && !loading && (
            <div className="space-y-6">
              <div className="flex gap-4 mb-4">
                <Input type="text" placeholder={t('exams.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1" />
                <Button onClick={() => { setValidationErrors({}); setShowCreateModal(true); }}>{t('exams.createExam')}</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExams.map(exam => (
                  <Card key={exam.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{exam.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{exam.description}</p>
                      <div className="space-y-2 text-xs text-muted-foreground mb-4">
                        {exam.category && <div>📚 {t('exams.category')}: {exam.category}</div>}
                        {exam.exam_time && <div>🕒 {t('exams.examTime')}: {(() => { try { return formatDate(new Date(exam.exam_time + 'T00:00:00'), { dateStyle: 'medium' }); } catch { return exam.exam_time; } })()}</div>}
                        {exam.material && (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">📎 <a href={exam.material} target="_blank" rel="noreferrer" className="underline hover:no-underline">{t('exams.materialAvailable')}</a></div>
                        )}
                        <div>👥 {t('exams.participants')}: {exam.participants_count ?? 0}</div>
                        {exam.user_name && (
                          <div className="flex items-center gap-1">
                            👤 {t('exams.createdBy') || 'Created by'}: {exam.user_name}
                            {user && exam.user_id === user.id && (
                              <span className="text-primary text-[10px] ml-1">({t('exams.you') || 'You'})</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" className="flex-1" onClick={() => handleJoinDiscussion(exam.id)} disabled={planGenerating === exam.id}>{planGenerating === exam.id ? t('common.loading') : t('exams.startPreparation')}</Button>
                        {/* <Button size="sm" variant="outline" className="flex-1">{t('exams.viewRequirements')}</Button> */}
                        {/* Only show edit/delete buttons for exam owner */}
                        {user && exam.user_id === user.id && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => openEdit(exam)}>✏️</Button>
                            <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(exam)}>🗑️</Button>
                          </>
                        )}
                        <Button size="sm" variant={exam.is_participant ? 'secondary' : 'default'} onClick={() => handleJoinLeave(exam)}>
                          {exam.is_participant ? t('exams.leave') : t('exams.join')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredExams.length === 0 && (<div className="col-span-full text-sm text-muted-foreground">No exams found</div>)}
              </div>
            </div>
          )}

          {/* Discussion Room Tab */}
          {activeTab === 'discussions' && (
            <div className="space-y-6">
              {!currentRoom ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-lg font-semibold mb-2">{t('discussions.noRoomSelected')}</h3>
                  <p className="text-muted-foreground mb-4">{t('discussions.selectExamToJoin')}</p>
                  <Button onClick={() => setActiveTab('discover')} variant="outline">
                    {t('exams.discoverTab')}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Room Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{currentRoom.title}</h3>
                      <div className="text-sm text-muted-foreground">
                        {currentRoom.members_count} {t('discussions.members')} • {currentRoom.posts_count} {t('discussions.posts')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setShowCreatePost(!showCreatePost)}
                        disabled={!currentRoom.is_member}
                      >
                        {t('discussions.createPost')}
                      </Button>
                      {!currentRoom.is_member && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleJoinDiscussion(currentRoom.exam_id)}
                        >
                          {t('discussions.joinRoom')}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="flex gap-4 items-center">
                    <div className="flex gap-2">
                      <select
                        value={postSort}
                        onChange={(e) => {
                          setPostSort(e.target.value as 'hot' | 'new' | 'top');
                          loadRoomPosts(currentRoom.id, { sort: e.target.value as 'hot' | 'new' | 'top', post_type: postFilter });
                        }}
                        className="px-3 py-1 text-sm border border-input rounded-md bg-background"
                      >
                        <option value="hot">{t('discussions.sortHot')}</option>
                        <option value="new">{t('discussions.sortNew')}</option>
                        <option value="top">{t('discussions.sortTop')}</option>
                      </select>
                      <select
                        value={postFilter}
                        onChange={(e) => {
                          setPostFilter(e.target.value as PostType | 'all');
                          loadRoomPosts(currentRoom.id, { sort: postSort, post_type: e.target.value as PostType | 'all' });
                        }}
                        className="px-3 py-1 text-sm border border-input rounded-md bg-background"
                      >
                        <option value="all">{t('discussions.allTypes')}</option>
                        <option value="question">{t('discussions.questions')}</option>
                        <option value="resource">{t('discussions.resources')}</option>
                        <option value="experience">{t('discussions.experiences')}</option>
                        <option value="note">{t('discussions.notes')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Create Post Form */}
                  {showCreatePost && (
                    <CreatePostForm
                      onSubmit={handleCreatePost}
                      onCancel={() => setShowCreatePost(false)}
                      isSubmitting={false}
                    />
                  )}

                  {/* Posts List */}
                  {postsLoading ? (
                    <div className="text-center py-8">
                      <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
                    </div>
                  ) : currentRoomPosts.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">📝</div>
                      <h3 className="text-lg font-semibold mb-2">{t('discussions.noPostsYet')}</h3>
                      <p className="text-muted-foreground mb-4">{t('discussions.beFirst')}</p>
                      {currentRoom.is_member && (
                        <Button onClick={() => setShowCreatePost(true)}>
                          {t('discussions.createPost')}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {currentRoomPosts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          onVote={handlePostVote}
                          onCommentAdded={() => loadRoomPosts(currentRoom.id)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Practice Tab */}
          {activeTab === 'practice' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">{t('exams.practiceTools')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-md transition-shadow cursor-pointer relative">
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                    {t('exams.inDevelopment')}
                  </div>
                  <CardHeader><CardTitle className="flex items-center gap-2"><span className="text-2xl">📝</span>{t('exams.mockExams')}</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{t('exams.mockExamsDesc')}</p>
                    <Button 
                      className="w-full" 
                      variant={waitlistFeatures.has('mockExams') ? 'secondary' : 'default'}
                      disabled={waitlistFeatures.has('mockExams')}
                      onClick={() => handleJoinWaitlist('mockExams')}
                    >
                      {waitlistFeatures.has('mockExams') ? '✓ ' + t('exams.joinWaitlist') : t('exams.joinWaitlist')}
                    </Button>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow cursor-pointer relative">
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                    {t('exams.inDevelopment')}
                  </div>
                  <CardHeader><CardTitle className="flex items-center gap-2"><span className="text-2xl">🃏</span>{t('exams.flashcards')}</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{t('exams.flashcardsDesc')}</p>
                    <Button 
                      className="w-full" 
                      variant={waitlistFeatures.has('flashcards') ? 'secondary' : 'default'}
                      disabled={waitlistFeatures.has('flashcards')}
                      onClick={() => handleJoinWaitlist('flashcards')}
                    >
                      {waitlistFeatures.has('flashcards') ? '✓ ' + t('exams.joinWaitlist') : t('exams.joinWaitlist')}
                    </Button>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow cursor-pointer relative">
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                    {t('exams.inDevelopment')}
                  </div>
                  <CardHeader><CardTitle className="flex items-center gap-2"><span className="text-2xl">⚡</span>{t('exams.quickQuizzes')}</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{t('exams.quickQuizzesDesc')}</p>
                    <Button 
                      className="w-full" 
                      variant={waitlistFeatures.has('quickQuizzes') ? 'secondary' : 'default'}
                      disabled={waitlistFeatures.has('quickQuizzes')}
                      onClick={() => handleJoinWaitlist('quickQuizzes')}
                    >
                      {waitlistFeatures.has('quickQuizzes') ? '✓ ' + t('exams.joinWaitlist') : t('exams.joinWaitlist')}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Create / Edit Exam Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4">{t('exams.createExamTitle')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('exams.examTitle')}</label>
                  <Input type="text" placeholder={t('exams.examTitlePlaceholder')} value={newExam.title} onChange={(e) => setNewExam({ ...newExam, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('exams.examDescription')}</label>
                  <Input type="textarea" rows={5} placeholder={t('exams.examDescriptionPlaceholder')} value={newExam.description} onChange={(e) => setNewExam({ ...newExam, description: e.target.value })} className="min-h-[120px]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('exams.examCategory')}</label>
                  <select className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background" value={newExam.category} onChange={(e) => setNewExam({ ...newExam, category: e.target.value })}>
                    <option value="Language">{t('exams.categoryLanguage')}</option>
                    <option value="Technical">{t('exams.categoryTechnical')}</option>
                    <option value="Business">{t('exams.categoryBusiness')}</option>
                    <option value="Health">{t('exams.categoryHealth')}</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('exams.examTime')}</label>
                    <div className="relative">
                      <DatePicker
                        key={language}
                        selected={newExam.exam_time ? new Date(newExam.exam_time + 'T00:00:00') : null}
                        onChange={(date: Date | null) => {
                          const dateStr = date ?
                            new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0] :
                            '';
                          setNewExam({ ...newExam, exam_time: dateStr });
                          setValidationErrors(v => ({ ...v, exam_time: undefined }));
                        }}
                        dateFormat="yyyy-MM-dd"
                        placeholderText={language === 'zh' ? '选择考试日期' : 'Select exam date'}
                        className={`w-full px-3 py-2 text-sm border rounded-md bg-background ${validationErrors.exam_time ? 'border-red-500 focus-visible:outline-red-500' : 'border-input'}`}
                        calendarClassName="bg-background border border-border shadow-lg"
                        dayClassName={() => "hover:bg-muted text-sm"}
                        isClearable
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                      />
                    </div>
                    {validationErrors.exam_time && <div className="mt-1 text-[11px] text-red-500">{validationErrors.exam_time}</div>}
                    {newExam.exam_time && (
                      <div className="mt-1 text-[11px] text-muted-foreground">{(() => { try { return formatDate(new Date(newExam.exam_time + 'T00:00:00'), { dateStyle: 'full' }); } catch { return newExam.exam_time; } })()}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('exams.examMaterial') || 'Material (optional)'}</label>
                    {editingExam?.material && !newExam.materialFile ? (
                      <div className="text-xs flex flex-col gap-2">
                        <a href={editingExam.material} target="_blank" rel="noreferrer" className="text-primary underline break-all">{editingExam.material}</a>
                        <button type="button" className="self-start text-[11px] text-muted-foreground hover:text-primary" onClick={() => setNewExam({ ...newExam, materialFile: null })}>{t('common.update') || 'Replace'}</button>
                      </div>
                    ) : (
                      <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/30 text-xs gap-1 ${validationErrors.materialFile ? 'border-red-500 text-red-500' : 'text-muted-foreground'}`}>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            if (file) {
                              const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'];
                              if (!allowed.includes(file.type)) {
                                setValidationErrors(v => ({ ...v, materialFile: t('exams.unsupportedFileType') }));
                                showToast('error', t('exams.unsupportedFileType'));
                                return;
                              }
                              if (file.size > 10 * 1024 * 1024) {
                                setValidationErrors(v => ({ ...v, materialFile: t('exams.fileTooLarge') }));
                                showToast('error', t('exams.fileTooLarge'));
                                return;
                              }
                            }
                            setValidationErrors(v => ({ ...v, materialFile: undefined }));
                            setNewExam({ ...newExam, materialFile: file });
                          }}
                        />
                        <span>📤 {newExam.materialFile ? newExam.materialFile.name : (t('exams.materialUploadHint') || 'Click to upload')}</span>
                        {newExam.materialFile && (
                          <button type="button" className="mt-1 text-[10px] text-red-500 hover:underline" onClick={() => setNewExam({ ...newExam, materialFile: null })}>{t('common.delete') || 'Clear'}</button>
                        )}
                        {validationErrors.materialFile && <div className="text-[10px] mt-1">{validationErrors.materialFile}</div>}
                      </label>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">{t('common.cancel')}</Button>
                <Button onClick={editingExam ? handleUpdateExam : handleCreateExam} className="flex-1" disabled={!newExam.title || !newExam.description || !newExam.exam_time || creating || updating}>
                  {creating || updating ? t('common.loading') : editingExam ? t('common.update') : t('common.create')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background rounded-lg p-6 w-full max-w-sm mx-4">
              <h2 className="text-lg font-semibold mb-2">{t('exams.deleteConfirmTitle') || t('common.confirm')}</h2>
              <p className="text-sm text-muted-foreground mb-4">{t('exams.deleteConfirmMessage')}</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(null)} disabled={deleting}>{t('common.cancel')}</Button>
                <Button className="flex-1" onClick={handleDeleteExam} disabled={deleting}>{deleting ? t('common.loading') : t('common.delete')}</Button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}