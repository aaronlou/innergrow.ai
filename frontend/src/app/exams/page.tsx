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
            <h1 className="text-2xl font-bold mb-2">Exam Preparation</h1>
            <p className="text-muted-foreground">
              Prepare for your exams with AI-powered study tools and personalized plans
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
              Discover Exams
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'plans'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Study Plans
            </button>
            <button
              onClick={() => setActiveTab('practice')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'practice'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Practice Online
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'discover' && (
            <div className="space-y-6">
              {/* Search */}
              <div className="flex gap-4">
                <Input
                  type="text"
                  placeholder="Search for exams..."
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
                        <div>⏱️ Duration: {exam.duration}</div>
                        <div>📅 Study Time: {exam.studyTime}</div>
                        <div>📚 Category: {exam.category}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          View Requirements
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          Start Preparation
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
                <h3 className="text-lg font-semibold">My Study Plans</h3>
                <Button>Create Study Plan</Button>
              </div>
              
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-semibold mb-2">No study plans yet</h3>
                <p className="text-muted-foreground mb-4">Create your first study plan to start preparing</p>
                <Button>Create Study Plan</Button>
              </div>
            </div>
          )}

          {activeTab === 'practice' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">Practice Tools</h3>
              
              {/* Practice Categories */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">📝</span>
                      Mock Exams
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Full-length practice exams with real exam conditions
                    </p>
                    <Button className="w-full">Start Mock Exam</Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">🃏</span>
                      Flashcards
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Study key concepts with interactive flashcards
                    </p>
                    <Button className="w-full">Study Flashcards</Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">⚡</span>
                      Quick Quizzes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Quick quizzes to test your knowledge
                    </p>
                    <Button className="w-full">Take Quiz</Button>
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