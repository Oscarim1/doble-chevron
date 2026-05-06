'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth, getApiUrl } from '@/utils/api';
import type { DashboardData, Period } from '@/types/dashboard';

const API_BASE_URL = getApiUrl();

interface UseDashboardOptions {
  period: Period;
  date?: string;
  from?: string;
  to?: string;
}

interface UseDashboardReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function getToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function useDashboard(options: UseDashboardOptions): UseDashboardReturn {
  const { period, date, from, to } = options;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ period });

      if (date) {
        params.append('date', date);
      } else if (!from && !to) {
        params.append('date', getToday());
      }

      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/dashboard?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error ${response.status}: ${response.statusText}`);
      }

      const result: DashboardData = await response.json();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar el dashboard';
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period, date, from, to]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboard,
  };
}
