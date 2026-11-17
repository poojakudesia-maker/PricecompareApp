import type { Comparison, ProductSummary, SuggestionItem, User } from '../shared/types.ts';
import { session } from './lib/session';

export class ApiError extends Error {
  constructor(message: string, public code: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('content-type', 'application/json');
  const token = session.get().token;
  if (token) headers.set('authorization', `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...init, headers });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiError("You're offline. Check your connection and try again.", 'network', 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) session.logout();
    throw new ApiError(body.error ?? 'Something went wrong.', body.code ?? 'unknown', res.status);
  }
  return body as T;
}

export const api = {
  sendOtp: (phone: string) =>
    request<{ phone: string; resendIn: number; devOtp?: string }>('/auth/otp', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOtp: (phone: string, otp: string) =>
    request<{ token: string; user: User }>('/auth/verify', { method: 'POST', body: JSON.stringify({ phone, otp }) }),
  me: () => request<{ user: User }>('/me'),
  saveProfile: (p: { name: string; email: string; pincode: string }) =>
    request<{ user: User }>('/me/profile', { method: 'PUT', body: JSON.stringify(p) }),
  suggest: (q: string, signal?: AbortSignal) =>
    request<{ items: SuggestionItem[]; exactId: string | null }>(`/suggest?q=${encodeURIComponent(q)}`, { signal }),
  trending: () => request<{ items: (ProductSummary & { fromPrice: number | null })[] }>('/trending'),
  compare: (id: string, signal?: AbortSignal) => request<Comparison>(`/products/${encodeURIComponent(id)}/compare`, { signal }),
};
