'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input } from '@/components/ui';
import { DashboardLayout, ProtectedRoute } from '@/components/layout';
import { useI18n } from '@/contexts';

export default function ExamsPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'discover' | 'plans' | 'practice'>('discover');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock exam data
  const mockExams = [
    {
      id: '1',
      title: 'IELTS Academic',
      category: 'Language',
      difficulty: 'Intermediate',
      description: 'International English Language Testing System for academic purposes',
      duration: '2h 45m',
      studyTime: '3-6 months'
    },
    {
      id: '2',
      title: 'AWS Solutions Architect',
      category: 'Technical',
      difficulty: 'Advanced',
      description: 'AWS Certified Solutions Architect Associate certification',
      duration: '130 minutes',
      studyTime: '2-4 months'
    }
  ];

  const filteredExams = mockExams.filter(exam => 
    exam.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">{t('exams.title')}</h1>
            <p className="text-muted-foreground">
              {t('exams.subtitle')}
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-8 bg-muted p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('discover')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'discover'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('exams.discoverTab')}
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'plans'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('exams.plansTab')}
            </button>
            <button
              onClick={() => setActiveTab('practice')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'practice'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('exams.practiceTab')}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'discover' && (
            <div className="space-y-6">
              {/* Search */}
              <div className="flex gap-4">
                <Input
                  type="text"
                  placeholder={t('exams.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>

              {/* Exam Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExams.map((exam) => (
                  <Card key={exam.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{exam.title}</CardTitle>
                        <Badge variant="outline">{exam.difficulty}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{exam.description}</p>
                      <div className="space-y-2 text-xs text-muted-foreground mb-4">
                        <div>⏱️ {t('exams.duration')}: {exam.duration}</div>
                        <div>📅 {t('exams.studyTime')}: {exam.studyTime}</div>
                        <div>📚 {t('exams.category')}: {exam.category}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          {t('exams.viewRequirements')}
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          {t('exams.startPreparation')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{t('exams.myStudyPlans')}</h3>
                <Button>{t('exams.createStudyPlan')}</Button>
              </div>
              
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-semibold mb-2">{t('exams.noPlansYet')}</h3>
                <p className="text-muted-foreground mb-4">{t('exams.createFirstPlan')}</p>
                <Button>{t('exams.createStudyPlan')}</Button>
              </div>
            </div>
          )}

          {activeTab === 'practice' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">{t('exams.practiceTools')}</h3>
              
              {/* Practice Categories */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">📝</span>
                      {t('exams.mockExams')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('exams.mockExamsDesc')}
                    </p>
                    <Button className="w-full">{t('exams.startMockExam')}</Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">🃏</span>
                      {t('exams.flashcards')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('exams.flashcardsDesc')}
                    </p>
                    <Button className="w-full">{t('exams.studyFlashcards')}</Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">⚡</span>
                      {t('exams.quickQuizzes')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('exams.quickQuizzesDesc')}
                    </p>
                    <Button className="w-full">{t('exams.takeQuiz')}</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}