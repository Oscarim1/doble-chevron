'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth, getApiUrl } from '@/utils/api';

const API_BASE_URL = getApiUrl();

export interface Empleado {
  id: string;
  username: string;
  email: string;
  rut: string;
  role_name: string;
}

export interface Asistencia {
  id: string;
  usuario_id: string;
  fecha: string;
  horario_entrada: string | null;
  horario_inicio_colacion: string | null;
  horario_fin_colacion: string | null;
  horario_salida: string | null;
  created_at: string;
  updated_at: string;
}

export type TipoMarca = 'horario_entrada' | 'horario_inicio_colacion' | 'horario_fin_colacion' | 'horario_salida';

// Hook para listar empleados activos
export function useEmpleadosActivos() {
  const [data, setData] = useState<Empleado[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmpleados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/users/employees`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar empleados';
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmpleados();
  }, [fetchEmpleados]);

  return { data, loading, error, refetch: fetchEmpleados };
}

// Obtener asistencia de un empleado para una fecha
export async function getAsistenciaEmpleado(fecha: string, usuarioId: string): Promise<Asistencia | null> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/asistencias/${fecha}/${usuarioId}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al obtener asistencia');
  }
  const data = await response.json();
  if ('message' in data) return null;
  return data as Asistencia;
}

// Crear asistencia (primera marca del dia)
export async function crearAsistencia(usuarioId: string, tipo: TipoMarca): Promise<Asistencia> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/asistencias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario_id: usuarioId, tipo }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al crear asistencia');
  }
  return response.json();
}

// Actualizar asistencia (marcas siguientes del dia)
export async function actualizarAsistencia(usuarioId: string, fecha: string, tipo: TipoMarca): Promise<Asistencia> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/asistencias/usuario/${usuarioId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fecha, tipo }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al actualizar asistencia');
  }
  return response.json();
}
