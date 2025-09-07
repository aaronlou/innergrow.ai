import { ApiResponse } from '@/types';
import { getApiBaseUrl, getAuthScheme, getAuthToken } from '@/lib/utils';

// Unified API Client: handles base URL, auth header, timeout, abort, 401 recovery, debug

const API_BASE_URL = getApiBaseUrl();

export type ApiRequestOptions = RequestInit & {
  timeoutMs?: number;
  rawResponse?: boolean;
  // retry settings
  retry?: number; // total attempts (>=1). default 1 (no retry)
  retryDelayMs?: number; // initial delay
  retryBackoff?: number; // multiplier, default 2
  retryOn?: Array<number | 'network' | 'timeout'>; // status codes or special tokens
  retryJitter?: 'none' | 'full' | 'equal'; // jitter strategy
  // throttle key groups concurrent identical requests
  throttleKey?: string; // same key -> share in-flight promise
  throttleDedupWindowMs?: number; // within window return same promise
  silent?: boolean; // if true do not dispatch global error event
};

interface AbortWrapper {
  signal: AbortSignal;
  cleanup: () => void;
  isTimedOut: () => boolean;
}

const createAbortController = (timeoutMs?: number, externalSignal?: AbortSignal): AbortWrapper => {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason ?? new Error('Aborted'));
    } else {
      externalSignal.addEventListener('abort', () => controller.abort(externalSignal.reason ?? new Error('Aborted')));
    }
  }

  if (typeof timeoutMs === 'number' && timeoutMs > 0) {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort(new Error('Request timeout'));
    }, timeoutMs);
  }

  const cleanup = () => { if (timer) clearTimeout(timer); };
  return { signal: controller.signal, cleanup, isTimedOut: () => timedOut };
};

const parsePayload = async (response: Response) => {
  const tryJson = async () => {
    try { return await response.json(); } catch { return undefined; }
  };
  const json = await tryJson();
  if (json !== undefined) return json;
  try {
    const text = await response.text();
    return text ? { message: text } : {};
  } catch { return {}; }
};

const shouldDebug = () => typeof window !== 'undefined' && (process.env.NEXT_PUBLIC_DEBUG_APIS === 'true');

// In-flight map for throttling / de-duplication
const inflight: Map<string, { promise: Promise<unknown>; ts: number }> = new Map();

// Dispatch global error event for unified toast layer
const emitApiError = (detail: { endpoint: string; method: string; error: string; status?: number }) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('app:api-error', { detail }));
};

export const apiRequest = async <T = unknown>(endpoint: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> => {
  const {
    timeoutMs,
    signal: externalSignal,
    rawResponse,
    headers,
    retry = 1,
    retryDelayMs = 300,
  retryBackoff = 2,
    retryOn = ['network', 'timeout', 500, 502, 503, 504],
  retryJitter = 'full',
    throttleKey,
    throttleDedupWindowMs = 0,
    silent,
    ...rest
  } = options;
  const token = getAuthToken();

  const baseHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) baseHeaders['Authorization'] = `${getAuthScheme()} ${token}`;

  const mergedHeaders: Record<string, string> = {
    ...baseHeaders,
    ...(headers && typeof headers === 'object' && !Array.isArray(headers) ? headers as Record<string, string> : {}),
  };

  const { signal, cleanup, isTimedOut } = createAbortController(timeoutMs, externalSignal as AbortSignal | undefined);

  const url = new URL(endpoint, API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`);

  if (shouldDebug()) {
    // Minimal debug to avoid leaking full token
    console.log('[apiRequest]', {
      endpoint: url.toString(),
      method: rest.method || 'GET',
      hasToken: !!token,
      tokenLen: token?.length,
      timeoutMs,
    });
  }

  const attemptFetch = async (attempt: number): Promise<ApiResponse<T>> => {
    if (shouldDebug()) {
      console.log('[apiRequest attempt]', { endpoint: url.toString(), attempt });
    }
    try {
      const response = await fetch(url.toString(), { ...rest, headers: mergedHeaders, signal });
    if (rawResponse) {
      // Caller handles response directly
      return { success: response.ok, data: response as unknown as T, error: response.ok ? undefined : `${response.status}` } as ApiResponse<T>;
    }

    const payload = await parsePayload(response);

    if (!response.ok) {
      const errorMsg = (payload && (payload.error || payload.detail || payload.message)) || `${response.status} ${response.statusText}`;
      if (response.status === 401 && typeof window !== 'undefined') {
        try {
          localStorage.removeItem('auth_token');
          window.dispatchEvent(new CustomEvent('app:unauthorized'));
        } catch { /* ignore */ }
      }
        const result = { success: false, error: String(errorMsg) } as ApiResponse<T>;
        // decide retry
        if (attempt < retry && retryOn.some(r => r === response.status)) {
          let delayBase = retryDelayMs * Math.pow(retryBackoff, attempt - 1);
          if (retryJitter === 'full') {
            delayBase = Math.random() * delayBase;
          } else if (retryJitter === 'equal') {
            const half = delayBase / 2;
            delayBase = half + Math.random() * half; // spreads between 50%-100%
          }
          await new Promise(res => setTimeout(res, delayBase));
          return attemptFetch(attempt + 1);
        }
        if (!silent) emitApiError({ endpoint: url.toString(), method: rest.method || 'GET', error: String(errorMsg), status: response.status });
        return result;
    }

    if (payload && typeof payload === 'object' && 'success' in payload) {
      return payload as ApiResponse<T>;
    }

    return { success: true, data: payload as T } as ApiResponse<T>;
    } catch (err: unknown) {
      let isTimeout = false;
      let message = 'Network error';
      if (err instanceof Error) {
        isTimeout = isTimedOut() || err.message.includes('timeout');
        if (err.name === 'AbortError' || err.message.includes('aborted')) {
          message = isTimedOut() ? 'Request timeout' : 'Request aborted';
        } else {
          message = err.message;
        }
      }
      const shouldRetry = attempt < retry && retryOn.some(r => (r === 'network' && message === 'Network error') || (r === 'timeout' && isTimeout));
      if (shouldRetry) {
        let delayBase = retryDelayMs * Math.pow(retryBackoff, attempt - 1);
        if (retryJitter === 'full') {
          delayBase = Math.random() * delayBase;
        } else if (retryJitter === 'equal') {
          const half = delayBase / 2;
          delayBase = half + Math.random() * half;
        }
        await new Promise(res => setTimeout(res, delayBase));
        return attemptFetch(attempt + 1);
      }
      if (!silent) emitApiError({ endpoint: url.toString(), method: rest.method || 'GET', error: message });
      return { success: false, error: message } as ApiResponse<T>;
    }
  };

  const exec = attemptFetch(1);

  let finalPromise: Promise<ApiResponse<T>> = exec.finally(() => cleanup());

  if (throttleKey) {
  const existing = inflight.get(throttleKey);
    const now = Date.now();
    if (existing && (throttleDedupWindowMs <= 0 || now - existing.ts < throttleDedupWindowMs)) {
  return existing.promise as Promise<ApiResponse<T>>;
    }
    inflight.set(throttleKey, { promise: finalPromise, ts: now });
    // Clean up after settle
    finalPromise = finalPromise.finally(() => {
      const current = inflight.get(throttleKey);
      if (current && current.promise === finalPromise) {
        inflight.delete(throttleKey);
      }
    });
  }

  return finalPromise;
};

export default apiRequest;
