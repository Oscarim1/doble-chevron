'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth, getApiUrl } from '@/utils/api';

const API_BASE_URL = getApiUrl();

// Tipos
export interface AuthLogStats {
  total_events: number;
  successful_logins: number;
  failed_logins: number;
  logouts: number;
  registrations: number;
  unique_ips: number;
  unique_users: number;
}

export interface TopIp {
  ip_address: string;
  access_count: number;
  users_count: number;
  last_access: string;
}

export interface DailyActivity {
  date: string;
  total: number;
  successful: number;
  failed: number;
}

export interface DeviceInfo {
  device_type: string;
  os: string;
  browser: string;
  count: number;
}

export type AuthEventType = 'login_success' | 'login_failed' | 'logout' | 'refresh_token' | 'register';

export interface AuthLog {
  id: string;
  user_id: string;
  username: string;
  email: string;
  event_type: AuthEventType;
  ip_address: string;
  device_type: string;
  sistema_operativo: string;
  navegador: string;
  failure_reason: string | null;
  created_at: string;
}

export interface AuthLogsDashboard {
  stats: AuthLogStats;
  topIps: TopIp[];
  dailyActivity: DailyActivity[];
  devices: DeviceInfo[];
  recentLogins: AuthLog[];
}

// Hook para el dashboard completo
export function useAuthLogsDashboard(days: number = 7) {
  const [data, setData] = useState<AuthLogsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/auth-logs/dashboard?days=${days}`
      );
      if (!response.ok) {
        throw new Error('Error al obtener dashboard de logs');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refetch: fetchDashboard };
}

// Hook para obtener todos los logs (paginado)
export function useAuthLogs(params: {
  limit?: number;
  offset?: number;
  eventType?: string;
  userId?: string;
} = {}) {
  const [data, setData] = useState<AuthLog[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.set('limit', String(params.limit));
      if (params.offset) queryParams.set('offset', String(params.offset));
      if (params.eventType) queryParams.set('eventType', params.eventType);
      if (params.userId) queryParams.set('userId', params.userId);

      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/auth-logs?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Error al obtener logs');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [params.limit, params.offset, params.eventType, params.userId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { data, loading, error, refetch: fetchLogs };
}

// Función para detectar accesos sospechosos
export async function detectSuspiciousAccess(
  knownIps: string[],
  hours: number = 24
): Promise<AuthLog[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/auth-logs/suspicious`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ knownIps, hours }),
  });
  if (!response.ok) {
    throw new Error('Error al detectar accesos sospechosos');
  }
  return response.json();
}

// Función para obtener intentos fallidos
export async function getFailedAttempts(hours: number = 24): Promise<AuthLog[]> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/api/auth-logs/failed-attempts?hours=${hours}`
  );
  if (!response.ok) {
    throw new Error('Error al obtener intentos fallidos');
  }
  return response.json();
}
