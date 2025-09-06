'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout, ProtectedRoute } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from '@/components/ui';
import { goalsService, GoalStatistics } from '@/lib/api/goals';
import { useI18n } from '@/contexts';

export default function ReportsPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<GoalStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await goalsService.getStatistics();
    if (res.success && res.data) {
      setStats(res.data);
    } else {
      setError(res.error || 'Failed to load reports');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6">{t('common.loading')}</div>
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
              <Button className="mt-2" onClick={load}>{t('common.retry')}</Button>
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
          <h1 className="text-2xl font-bold mb-6">{t('dashboard.viewReports')}</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total</CardTitle>
                <CardDescription>All goals</CardDescription>
              </CardHeader>
              <CardContent><div className="text-3xl font-bold">{stats?.total ?? 0}</div></CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Active</CardTitle>
                <CardDescription>In progress</CardDescription>
              </CardHeader>
              <CardContent><div className="text-3xl font-bold text-green-600">{((stats?.new ?? 0) + (stats?.['in progress'] ?? 0))}</div></CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Completed</CardTitle>
                <CardDescription>Finished goals</CardDescription>
              </CardHeader>
              <CardContent><div className="text-3xl font-bold text-blue-600">{stats?.done ?? 0}</div></CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Paused</CardTitle>
                <CardDescription>On hold</CardDescription>
              </CardHeader>
              <CardContent><div className="text-3xl font-bold text-orange-600">{stats?.paused ?? 0}</div></CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Public</CardTitle>
                <CardDescription>Visible to all</CardDescription>
              </CardHeader>
              <CardContent><div className="text-3xl font-bold">{stats?.public ?? 0}</div></CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Private</CardTitle>
                <CardDescription>Visible to you</CardDescription>
              </CardHeader>
              <CardContent><div className="text-3xl font-bold">{stats?.private ?? 0}</div></CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
