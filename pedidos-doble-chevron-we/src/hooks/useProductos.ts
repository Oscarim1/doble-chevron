'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth, getApiUrl } from '@/utils/api';

const API_BASE_URL = getApiUrl();

export interface Producto {
  id: string;
  name: string;
  price: number;
  points: number;
  image_url: string | null;
  description: string | null;
  precio_puntos: number;
  category: string | null;
  sub_category: string | null;
  is_active: number | boolean;
  track_stock: number | boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductoPayload {
  name: string;
  price: number;
  points?: number;
  image_url?: string | null;
  description?: string | null;
  precio_puntos?: number;
  category?: string | null;
  sub_category?: string | null;
  is_active?: boolean;
}

// Hook para listar productos
// includeInactive: true para admin (todos los productos), false para tienda (solo activos)
export function useProductos(includeInactive: boolean = false) {
  const [data, setData] = useState<Producto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = includeInactive
        ? `${API_BASE_URL}/api/products?includeInactive=true`
        : `${API_BASE_URL}/api/products`;
      const response = await fetchWithAuth(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar productos';
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  return { data, loading, error, refetch: fetchProductos };
}

// Obtener producto por ID
export async function getProducto(id: string): Promise<Producto> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/products/${id}`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al obtener producto');
  }
  return response.json();
}

// Crear producto
export async function crearProducto(payload: ProductoPayload): Promise<Producto> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al crear producto');
  }
  return response.json();
}

// Actualizar producto
export async function actualizarProducto(id: string, payload: Partial<ProductoPayload>): Promise<Producto> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al actualizar producto');
  }
  return response.json();
}

// Eliminar producto
export async function eliminarProducto(id: string): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/products/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al eliminar producto');
  }
}
