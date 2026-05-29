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

export interface CategoriaPayload {
  name: string;
  parent_id?: string | null;
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

export async function crearCategoria(payload: CategoriaPayload): Promise<Categoria> {
  const apiUrl = getApiUrl();
  const response = await fetchWithAuth(`${apiUrl}/api/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al crear categoría');
  }
  return response.json();
}

export async function actualizarCategoria(id: string, payload: CategoriaPayload): Promise<Categoria> {
  const apiUrl = getApiUrl();
  const response = await fetchWithAuth(`${apiUrl}/api/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al actualizar categoría');
  }
  return response.json();
}

export async function eliminarCategoria(id: string): Promise<void> {
  const apiUrl = getApiUrl();
  const response = await fetchWithAuth(`${apiUrl}/api/categories/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al eliminar categoría');
  }
}
