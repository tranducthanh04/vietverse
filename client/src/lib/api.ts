import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let inMemoryToken: string | null = null;

export function setApiAccessToken(token: string | null) {
  inMemoryToken = token;
}

export function getApiAccessToken(): string | null {
  return inMemoryToken;
}

/**
 * Readable companion to the httpOnly `refreshToken`: the server sets it to `1` whenever it issues a
 * refresh session and clears it on logout. The SPA checks it on a cold load so a guest who has never
 * signed in skips `POST /auth/refresh` entirely — that request would 401 and the browser would log a
 * red console error on every public page. The hint is never a credential; the server still validates
 * the refresh token on each call.
 */
export const SESSION_HINT_COOKIE = 'vv_has_session';

export function hasSessionHint(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((entry) => entry.trim().startsWith(`${SESSION_HINT_COOKIE}=`));
}

/**
 * Sessions issued before the hint cookie existed carry only the httpOnly refresh token. Each browser
 * therefore gets one bootstrap refresh without a hint: a returning user is restored (and receives the
 * hint), a guest sees a single 401 and is quiet afterwards.
 */
const LEGACY_SESSION_PROBE_KEY = 'vv_session_probe_v1';

export function hasProbedLegacySession(): boolean {
  // Without storage, keep the pre-hint behaviour (always try) rather than signing a user out.
  try { return localStorage.getItem(LEGACY_SESSION_PROBE_KEY) === '1'; } catch { return false; }
}

export function markLegacySessionProbed(): void {
  try { localStorage.setItem(LEGACY_SESSION_PROBE_KEY, '1'); } catch { /* storage unavailable: probe again next load */ }
}

/** Best-effort local clear so a stale hint self-heals even when the logout request cannot reach the server. */
export function clearSessionHint(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_HINT_COOKIE}=; Max-Age=0; path=/`;
}

// Cookie-writing auth requests must finish in order, even after their page unmounts.
// Ignoring a stale JS callback alone cannot undo a response's Set-Cookie header.
let authRequestTail: Promise<unknown> = Promise.resolve();
function enqueueAuthRequest<T>(work: () => Promise<T>): Promise<T> {
  const result = authRequestTail.then(work, work);
  authRequestTail = result.catch(() => undefined);
  return result;
}

export function authPost(path: string, data: unknown = {}) {
  return enqueueAuthRequest(() => api.post(path, data, { timeout: 20_000 }));
}

export interface RefreshedSession<TUser = unknown, TSubscription = unknown> {
  accessToken: string;
  user: TUser;
  subscription: TSubscription;
}

/**
 * Rotates the refresh cookie and stores the new access token. The server also returns the same
 * user/subscription shape as GET /auth/me, so a page reload needs only this one request.
 * `/auth/refresh` is excluded from the 401 retry interceptor below.
 */
export async function refreshSession<TUser = unknown, TSubscription = unknown>(): Promise<RefreshedSession<TUser, TSubscription>> {
  const { data } = await authPost('/auth/refresh');
  const session = data?.data as RefreshedSession<TUser, TSubscription> | undefined;
  if (!session || typeof session.accessToken !== 'string' || !session.accessToken) {
    throw new Error('Phiên đăng nhập không hợp lệ');
  }
  setApiAccessToken(session.accessToken);
  return session;
}

// Request interceptor: Attach access token and parent gate token to headers
api.interceptors.request.use((config) => {
  if (inMemoryToken) {
    config.headers.Authorization = `Bearer ${inMemoryToken}`;
  }
  const gateToken = sessionStorage.getItem('vietverse_parent_gate_token');
  if (gateToken) {
    config.headers['X-Parent-Gate-Token'] = gateToken;
  }
  return config;
});

// Response interceptor: Auto refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/logout') &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/google')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { accessToken: newAccessToken } = await refreshSession();
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setApiAccessToken(null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (
      error.response?.status === 403 &&
      typeof (error.response?.data as any)?.error?.code === 'string' &&
      (error.response?.data as any).error.code.startsWith('PARENT_GATE_')
    ) {
      sessionStorage.removeItem('vietverse_parent_gate_token');
      sessionStorage.removeItem('vietverse_parent_gate_unlocked');
    }

    return Promise.reject(error);
  }
);
