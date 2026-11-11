// ============ Account client (بخش ۱۲ — حساب کاربری، مهمان، همگام‌سازی) ============
// Thin bridge to /api/account/*. The session token lives in the game store
// (persisted). Snapshot payloads carry ONLY gameplay progress fields —
// credentials never enter the cloud copy.
'use client';

export type SyncMode = 'push' | 'pull';

export interface AuthResult {
  ok: boolean;
  token?: string;
  username?: string;
  error?: string;
}

async function post<T>(url: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout?.(6000),
    });
    return (await res.json()) as T;
  } catch {
    return null; // offline / server down
  }
}

export function apiRegister(username: string, password: string): Promise<AuthResult | null> {
  return post<AuthResult>('/api/account/register', { username, password });
}

export function apiLogin(username: string, password: string): Promise<AuthResult | null> {
  return post<AuthResult>('/api/account/login', { username, password });
}

export interface SyncPushResult {
  ok: boolean;
  updatedAt?: number;
  error?: string;
}

export function apiPushSnapshot(token: string, state: unknown): Promise<SyncPushResult | null> {
  return post<SyncPushResult>('/api/account/sync', { token, mode: 'push', state });
}

export interface SyncPullResult {
  ok: boolean;
  state: unknown;
  updatedAt: number | null;
  username?: string;
  error?: string;
}

export function apiPullSnapshot(token: string): Promise<SyncPullResult | null> {
  return post<SyncPullResult>('/api/account/sync', { token, mode: 'pull' });
}

/** map an API error code to an i18n DictKey suffix for friendly messages */
export function authErrorKey(error?: string): string {
  switch (error) {
    case 'username_taken': return 'accountErrTaken';
    case 'invalid_credentials': return 'accountErrCreds';
    case 'bad_username': return 'accountErrUser';
    case 'bad_password': return 'accountErrPass';
    case 'rate_limited': return 'accountErrRate';
    case 'unauthorized': return 'accountErrCreds';
    case 'too_large': return 'accountErrSize';
    default: return 'accountErrNet'; // network / offline / unknown
  }
}
