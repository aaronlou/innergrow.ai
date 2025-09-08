'use client';

import { DashboardLayout, ProtectedRoute } from '@/components/layout';
import { useI18n } from '@/contexts';

export default function ReportsPage() {
  const { t } = useI18n();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">{t('reports.title') || 'Reports'}</h1>
          <p className="text-muted-foreground">{t('reports.subtitle') || 'Analytics and insights'}</p>
          
          <div className="mt-8">
            <p className="text-sm text-muted-foreground">Reports functionality coming soon...</p>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}