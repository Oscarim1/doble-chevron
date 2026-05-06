'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth, getApiUrl } from '@/utils/api';
import type {
  StockSummary,
  StockItem,
  StockMovement,
  StockLocation,
  StockProduct,
  StockEmployee,
  EmployeeConsumptionReport,
  PurchasePayload,
  RestockPayload,
  EmployeeConsumptionPayload,
  LocationPayload,
  MovementFilters,
} from '@/types/stock';

const API_BASE_URL = getApiUrl();

// ============================================
// HOOKS DE LECTURA
// ============================================

// Hook para resumen de stock (dashboard)
export function useStockSummary() {
  const [data, setData] = useState<StockSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/stock/summary`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar resumen';
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { data, loading, error, refetch: fetchSummary };
}

// Hook para stock por ubicación
export function useStockByLocation(locationId: string) {
  const [data, setData] = useState<StockItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStock = useCallback(async () => {
    if (!locationId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/stock/location/${locationId}`
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar stock';
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  return { data, loading, error, refetch: fetchStock };
}

// Hook para ubicaciones
export function useLocations() {
  const [data, setData] = useState<StockLocation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/stock/locations`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar ubicaciones';
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return { data, loading, error, refetch: fetchLocations };
}

// Hook para productos (para selects)
export function useProducts(category?: string) {
  const [data, setData] = useState<StockProduct[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      const url = `${API_BASE_URL}/api/products${params.toString() ? `?${params.toString()}` : ''}`;
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
  }, [category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { data, loading, error, refetch: fetchProducts };
}

// Hook para empleados (para selects)
export function useEmployees() {
  const [data, setData] = useState<StockEmployee[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/users`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error ${response.status}`);
      }
      const result = await response.json();
      // Filtrar solo trabajadores y mapear campos
      const employees = Array.isArray(result)
        ? result
            .filter((u: { role?: string }) => u.role === 'trabajador' || u.role === 'admin')
            .map((u: { id: string; full_name?: string; name?: string; email?: string }) => ({
              id: u.id,
              name: u.full_name || u.name || 'Sin nombre',
              email: u.email || '',
            }))
        : [];
      setData(employees);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar empleados';
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return { data, loading, error, refetch: fetchEmployees };
}

// Hook para historial de movimientos con filtros
export function useMovements(filters: MovementFilters) {
  const [data, setData] = useState<StockMovement[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.product_id) params.append('product_id', filters.product_id);
      if (filters.location_id) params.append('location_id', filters.location_id);
      if (filters.employee_id) params.append('employee_id', filters.employee_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.offset) params.append('offset', String(filters.offset));

      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/stock/movements?${params.toString()}`
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error ${response.status}`);
      }
      const result = await response.json();
      setData(Array.isArray(result) ? result : result.movements || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar movimientos';
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [
    filters.type,
    filters.product_id,
    filters.location_id,
    filters.employee_id,
    filters.start_date,
    filters.end_date,
    filters.limit,
    filters.offset,
  ]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return { data, loading, error, refetch: fetchMovements };
}

// Hook para reporte de consumo de empleados
export function useEmployeeConsumptionReport(startDate?: string, endDate?: string) {
  const [data, setData] = useState<EmployeeConsumptionReport[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/stock/reports/employee-consumption?${params.toString()}`
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar reporte';
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { data, loading, error, refetch: fetchReport };
}

// ============================================
// FUNCIONES DE MUTACIÓN (POST/PUT)
// ============================================

// Registrar compra
export async function createPurchase(payload: PurchasePayload): Promise<StockMovement> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/stock/movements/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al registrar compra');
  }
  return response.json();
}

// Registrar reposición
export async function createRestock(payload: RestockPayload): Promise<StockMovement> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/stock/movements/restock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al registrar reposición');
  }
  return response.json();
}

// Registrar consumo de empleado
export async function createEmployeeConsumption(
  payload: EmployeeConsumptionPayload
): Promise<StockMovement> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/stock/movements/employee`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al registrar consumo');
  }
  return response.json();
}

// Crear ubicación
export async function createLocation(payload: LocationPayload): Promise<StockLocation> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/stock/locations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al crear ubicación');
  }
  return response.json();
}

// Actualizar ubicación
export async function updateLocation(
  id: string,
  payload: LocationPayload
): Promise<StockLocation> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/stock/locations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al actualizar ubicación');
  }
  return response.json();
}

// Actualizar cantidad mínima de stock
export async function updateMinQuantity(
  locationId: string,
  productId: string,
  minQuantity: number
): Promise<void> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/api/stock/location/${locationId}/product/${productId}/min-quantity`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ min_quantity: minQuantity }),
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al actualizar cantidad mínima');
  }
}
