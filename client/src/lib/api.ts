const BASE = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getToken() { return localStorage.getItem('parceriza_token'); }
export function setToken(t: string) { localStorage.setItem('parceriza_token', t); }
export function clearToken() { localStorage.removeItem('parceriza_token'); }

export function apiUrl(path: string) { return `${BASE}${path}`; }

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...((options.headers as Record<string, string>) ?? {}),
      },
    });
  } catch {
    throw new ApiError(0, 'Erro de conexão. Tente novamente em instantes.');
  }
  const json = await res.json();
  if (!res.ok) throw new ApiError(res.status, json.error ?? `HTTP ${res.status}`);
  return json as T;
}
