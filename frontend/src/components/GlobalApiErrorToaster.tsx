"use client";
import React, { useEffect, useState } from 'react';
import { Toast } from '@/components/ui/Toast';

interface ApiErrorEventDetail {
  endpoint: string;
  method: string;
  error: string;
  status?: number;
}

interface QueuedError extends ApiErrorEventDetail {
  id: number;
}

// Simple queue to show one toast at a time (could be extended)
export default function GlobalApiErrorToaster() {
  const [queue, setQueue] = useState<QueuedError[]>([]);
  const [active, setActive] = useState<QueuedError | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ApiErrorEventDetail>).detail;
      if (!detail) return;
      setQueue(q => [...q, { ...detail, id: Date.now() + Math.random() }]);
    };
    window.addEventListener('app:api-error', handler as EventListener);
    return () => window.removeEventListener('app:api-error', handler as EventListener);
  }, []);

  useEffect(() => {
    if (!active && queue.length) {
      setActive(queue[0]);
      setQueue(q => q.slice(1));
    }
  }, [queue, active]);

  if (!active) return null;

  return (
    <Toast
      type="error"
      title={active.status ? `API ${active.status}` : 'API Error'}
      description={`${active.method} ${active.endpoint}\n${active.error}`}
      duration={5000}
      onClose={() => setActive(null)}
    />
  );
}
