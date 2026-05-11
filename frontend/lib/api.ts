// helper de API client
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('contia_token');
}

export function setToken(t: string) {
  localStorage.setItem('contia_token', t);
}

export function clearToken() {
  localStorage.removeItem('contia_token');
}

export async function api(path: string, opts: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api${path}`, { ...opts, headers });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(body?.error || `HTTP ${res.status}`);
  }
  return body;
}
