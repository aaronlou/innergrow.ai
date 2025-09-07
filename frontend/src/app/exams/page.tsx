'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import { DashboardLayout, ProtectedRoute } from '@/components/layout';
import { useI18n } from '@/contexts';
import examsService from '@/lib/api/exams';
import { StudyPlanData, Exam } from '@/types';

export default function ExamsPage() {
  const { t, formatDate } = useI18n();
  const [activeTab, setActiveTab] = useState<'discover' | 'plans' | 'practice'>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [planGenerating, setPlanGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [studyPlans, setStudyPlans] = useState<Record<string, StudyPlanData>>({});
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

  // Toast-like feedback via simple transient state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchExams = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await examsService.list();
    if (res.success && res.data) {
      setExams(res.data);
    } else {
      setError(res.error || 'Failed to load exams');
      showToast('error', res.error || 'Failed to load exams');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchExams(); }, [fetchExams]);

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

  const handleGeneratePlan = async (examId: string) => {
    setPlanGenerating(examId);
    const res = await examsService.generateStudyPlan(examId);
    if (res.success && res.data) {
      setStudyPlans(prev => ({ ...prev, [examId]: res.data! }));
      showToast('success', t('common.success'));
      setActiveTab('plans');
    } else {
      showToast('error', res.error || t('common.error'));
    }
    setPlanGenerating(null);
  };

  const handleDeleteExam = async () => {
    if (!showDeleteConfirm) return;
    setDeleting(true);
    const res = await examsService.delete(showDeleteConfirm.id);
    if ((res.success && !res.error) || res.success === true) {
      setExams(prev => prev.filter(e => e.id !== showDeleteConfirm.id));
      setStudyPlans(prev => { const clone = { ...prev }; delete clone[showDeleteConfirm.id]; return clone; });
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
      exam_time: exam.exam_time ? exam.exam_time.slice(0,10) : '',
      materialFile: null,
    });
    setShowCreateModal(true);
  };

  const [planOptionsExam, setPlanOptionsExam] = useState<Exam | null>(null);
  const [planLanguage, setPlanLanguage] = useState<'en' | 'zh'>('en');
  const [planModel, setPlanModel] = useState('');

  const openPlanOptions = (exam: Exam) => {
    setPlanOptionsExam(exam);
    setPlanLanguage((typeof window !== 'undefined' ? (localStorage.getItem('language') as 'en' | 'zh') : 'en') || 'en');
    setPlanModel('');
  };

  const handleGenerateWithOptions = async () => {
    if (!planOptionsExam) return;
    setPlanGenerating(planOptionsExam.id);
    const res = await examsService.generateStudyPlan(planOptionsExam.id, { language: planLanguage, model: planModel || undefined });
    if (res.success && res.data) {
      setStudyPlans(prev => ({ ...prev, [planOptionsExam.id]: res.data! }));
      showToast('success', t(studyPlans[planOptionsExam.id] ? 'exams.planRegenerated' : 'exams.planGenerated'));
      setActiveTab('plans');
    } else {
      showToast('error', res.error || t('exams.planGenerateFailed'));
    }
    setPlanGenerating(null);
    setPlanOptionsExam(null);
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
    const action = exam.is_participant ? examsService.leaveExam : examsService.joinExam;
    const res = await action(exam.id);
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
            <button onClick={() => setActiveTab('plans')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'plans' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{t('exams.plansTab')}</button>
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
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" className="flex-1" onClick={() => handleGeneratePlan(exam.id)} disabled={planGenerating === exam.id}>{planGenerating === exam.id ? t('common.loading') : t('exams.startPreparation')}</Button>
                        <Button size="sm" variant="outline" className="flex-1">{t('exams.viewRequirements')}</Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(exam)}>✏️</Button>
                        <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(exam)}>🗑️</Button>
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

          {/* Plans Tab */}
          {activeTab === 'plans' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center"><h3 className="text-lg font-semibold">{t('exams.myStudyPlans')}</h3></div>
              {Object.keys(studyPlans).length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="text-lg font-semibold mb-2">{t('exams.noPlansYet')}</h3>
                  <p className="text-muted-foreground mb-4">{t('exams.createFirstPlan')}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(studyPlans).map(([examId, plan]) => {
                  const exam = exams.find(e => e.id === examId);
                  return (
                    <Card key={examId} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{exam?.title || 'Exam'}</CardTitle>
                          <Button size="sm" variant="outline" onClick={() => openPlanOptions(exam!)} disabled={planGenerating === examId}>{planGenerating === examId ? t('exams.regeneratingPlan') : t('exams.regeneratePlan')}</Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {plan.summary && <p className="text-sm text-muted-foreground mb-4">{plan.summary}</p>}
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                          {plan.plan.map((section, idx) => (
                            <div key={idx} className="border border-border rounded-md p-2">
                              <div className="font-medium text-sm mb-1">{section.title}</div>
                              <div className="text-xs text-muted-foreground whitespace-pre-line">{section.content}</div>
                              {section.duration && <div className="text-[10px] mt-1 text-muted-foreground">⏱️ {section.duration}</div>}
                            </div>
                          ))}
                          {plan.plan.length === 0 && (<div className="text-xs text-muted-foreground">(Empty plan)</div>)}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Practice Tab */}
          {activeTab === 'practice' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">{t('exams.practiceTools')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader><CardTitle className="flex items-center gap-2"><span className="text-2xl">📝</span>{t('exams.mockExams')}</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-muted-foreground mb-4">{t('exams.mockExamsDesc')}</p><Button className="w-full">{t('exams.startMockExam')}</Button></CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader><CardTitle className="flex items-center gap-2"><span className="text-2xl">🃏</span>{t('exams.flashcards')}</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-muted-foreground mb-4">{t('exams.flashcardsDesc')}</p><Button className="w-full">{t('exams.studyFlashcards')}</Button></CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader><CardTitle className="flex items-center gap-2"><span className="text-2xl">⚡</span>{t('exams.quickQuizzes')}</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-muted-foreground mb-4">{t('exams.quickQuizzesDesc')}</p><Button className="w-full">{t('exams.takeQuiz')}</Button></CardContent>
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
                  <Input type="text" placeholder={t('exams.examDescriptionPlaceholder')} value={newExam.description} onChange={(e) => setNewExam({ ...newExam, description: e.target.value })} />
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
                    <input
                      type="date"
                      required
                      className={`w-full px-3 py-2 text-sm border rounded-md bg-background ${validationErrors.exam_time ? 'border-red-500 focus-visible:outline-red-500' : 'border-input'}`}
                      value={newExam.exam_time}
                      onChange={(e) => { setNewExam({ ...newExam, exam_time: e.target.value }); setValidationErrors(v => ({ ...v, exam_time: undefined })); }}
                    />
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
                              const allowed = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/png','image/jpeg'];
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

        {/* Plan Options Modal */}
        {planOptionsExam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4">{planOptionsExam.title}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Language</label>
                  <select className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background" value={planLanguage} onChange={e => setPlanLanguage(e.target.value as 'en' | 'zh')}>
                    <option value="en">English</option>
                    <option value="zh">中文</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Model (optional)</label>
                  <Input type="text" placeholder="e.g. gpt-4o-mini" value={planModel} onChange={e => setPlanModel(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setPlanOptionsExam(null)} disabled={planGenerating === planOptionsExam.id}>{t('common.cancel')}</Button>
                <Button className="flex-1" onClick={handleGenerateWithOptions} disabled={planGenerating === planOptionsExam.id}>{planGenerating === planOptionsExam.id ? t('common.loading') : (studyPlans[planOptionsExam.id] ? t('exams.regeneratePlan') : t('exams.generatePlan'))}</Button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}