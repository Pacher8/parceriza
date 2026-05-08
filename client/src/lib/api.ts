const BASE = import.meta.env.VITE_API_URL ?? '';

export function getToken() { return localStorage.getItem('parceriza_token'); }
export function setToken(t: string) { localStorage.setItem('parceriza_token', t); }
export function clearToken() { localStorage.removeItem('parceriza_token'); }

export function apiUrl(path: string) { return `${BASE}${path}`; }

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(apiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json as T;
}
