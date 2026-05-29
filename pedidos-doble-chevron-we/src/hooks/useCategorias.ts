'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth, getApiUrl } from '@/utils/api';

export interface Categoria {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  parent_name: string | null;
}

export function useCategorias(parentId?: string) {
  const [data, setData] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategorias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = getApiUrl();
      const url = parentId
        ? `${apiUrl}/api/categories?parentId=${parentId}`
        : `${apiUrl}/api/categories`;
      const response = await fetchWithAuth(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar categorías';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [parentId]);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  return { data, loading, error, refetch: fetchCategorias };
}
