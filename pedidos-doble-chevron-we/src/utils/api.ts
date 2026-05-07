/**
 * En desarrollo, usa el mismo hostname que el browser (funciona con localhost y con IP local).
 * En producción, usa NEXT_PUBLIC_API_URL o el dominio hardcodeado como fallback.
 */
export function getApiUrl(): string {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    return `http://${window.location.hostname}:3000`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'https://doblechevron.cl';
}

import { isTokenExpired } from './auth';

// Lock to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
// Queue of resolvers waiting for a new token
let refreshQueue: Array<(token: string | null) => void> = [];

function notifyQueue(token: string | null) {
  refreshQueue.forEach((resolve) => resolve(token));
  refreshQueue = [];
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';
}

async function doRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    clearSession();
    throw new Error('Sin refresh token');
  }

  const apiUrl = getApiUrl();
  const refreshRes = await fetch(`${apiUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (refreshRes.ok) {
    const data = await refreshRes.json();
    const newToken = data.token || data.access_token || data.accessToken;
    const newRefresh = data.refreshToken || data.refresh_token;
    if (newToken) localStorage.setItem('token', newToken);
    if (newRefresh) localStorage.setItem('refreshToken', newRefresh);
    return newToken ?? null;
  }

  const msg = await refreshRes.text();
  clearSession();
  throw new Error(msg || 'Sesión expirada');
}

async function refreshOnce(): Promise<string | null> {
  if (isRefreshing) {
    // Wait for the in-progress refresh to finish
    return new Promise<string | null>((resolve) => {
      refreshQueue.push(resolve);
    });
  }

  isRefreshing = true;
  try {
    const token = await doRefresh();
    notifyQueue(token);
    return token;
  } catch (err) {
    notifyQueue(null);
    throw err;
  } finally {
    isRefreshing = false;
  }
}

export async function fetchWithAuth(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  // Proactively refresh if the current token is expired or about to expire
  if (isTokenExpired()) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await refreshOnce();
    } else {
      clearSession();
      throw new Error('Sesión expirada');
    }
  }

  let token = localStorage.getItem('token');

  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(input, { ...init, headers });

  if (response.status === 401 || response.status === 403) {
    const message = await response.text();

    if (message.includes('Token inválido o expirado')) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        clearSession();
        throw new Error(message);
      }

      try {
        token = await refreshOnce();
      } catch {
        // clearSession already called inside refreshOnce
        throw new Error(message);
      }

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
        response = await fetch(input, { ...init, headers });
        // If the retry also fails, return it as-is so callers can handle it
        return response;
      }
    }

    if (
      message.includes('Refresh token inválido o expirado') ||
      message.includes('No token provided')
    ) {
      clearSession();
    }

    throw new Error(message || 'Request failed');
  }

  return response;
}
