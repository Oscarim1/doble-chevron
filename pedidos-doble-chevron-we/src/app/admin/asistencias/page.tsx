'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HiArrowLeft, HiRefresh, HiCheck, HiClock, HiLogout } from 'react-icons/hi';
import { getUserRoleFromToken } from '@/utils/auth';
import {
  useEmpleadosActivos,
  getAsistenciaEmpleado,
  crearAsistencia,
  actualizarAsistencia,
  type Empleado,
  type Asistencia,
  type TipoMarca,
} from '@/hooks/useAsistencias';

function getTodayLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatHora(value: string | null): string {
  if (!value) return '--:--';

  // Si es solo hora (HH:mm:ss o HH:mm), mostrar directamente
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(value)) {
    const parts = value.split(':');
    return `${parts[0].padStart(2, '0')}:${parts[1]}`;
  }

  // Si es timestamp ISO, parsear
  const date = new Date(value);
  if (isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

interface EmpleadoConAsistencia extends Empleado {
  asistencia: Asistencia | null;
  loadingAsistencia: boolean;
}

type EstadoEmpleado = 'sin_entrada' | 'en_jornada' | 'en_colacion' | 'colacion_terminada' | 'finalizada';

function getEstado(asistencia: Asistencia | null): EstadoEmpleado {
  if (!asistencia || !asistencia.horario_entrada) return 'sin_entrada';
  if (asistencia.horario_salida) return 'finalizada';
  if (asistencia.horario_inicio_colacion && !asistencia.horario_fin_colacion) return 'en_colacion';
  if (asistencia.horario_inicio_colacion && asistencia.horario_fin_colacion && !asistencia.horario_salida) return 'colacion_terminada';
  return 'en_jornada';
}

function getSiguienteAccion(estado: EstadoEmpleado): { tipo: TipoMarca; label: string; color: string } | null {
  switch (estado) {
    case 'sin_entrada':
      return { tipo: 'horario_entrada', label: 'Marcar Entrada', color: 'bg-green-500 hover:bg-green-600' };
    case 'en_jornada':
      return { tipo: 'horario_inicio_colacion', label: 'Iniciar Colacion', color: 'bg-yellow-500 hover:bg-yellow-600' };
    case 'en_colacion':
      return { tipo: 'horario_fin_colacion', label: 'Terminar Colacion', color: 'bg-blue-500 hover:bg-blue-600' };
    case 'colacion_terminada':
      return { tipo: 'horario_salida', label: 'Marcar Salida', color: 'bg-red-500 hover:bg-red-600' };
    case 'finalizada':
      return null;
  }
}

function EmpleadoCard({
  empleado,
  fecha,
  onMarcar,
  onSalidaDirecta,
}: {
  empleado: EmpleadoConAsistencia;
  fecha: string;
  onMarcar: (empleadoId: string, tipo: TipoMarca) => Promise<void>;
  onSalidaDirecta: (empleadoId: string) => Promise<void>;
}) {
  const [marcando, setMarcando] = useState(false);
  const estado = getEstado(empleado.asistencia);
  const siguienteAccion = getSiguienteAccion(estado);
  const a = empleado.asistencia;

  const handleMarcar = async () => {
    if (!siguienteAccion) return;
    setMarcando(true);
    try {
      await onMarcar(empleado.id, siguienteAccion.tipo);
    } finally {
      setMarcando(false);
    }
  };

  const handleSalidaDirecta = async () => {
    setMarcando(true);
    try {
      await onSalidaDirecta(empleado.id);
    } finally {
      setMarcando(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3">
      {/* Header con nombre y estado */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full grid place-items-center text-lg bg-orange-100 border-2 border-orange-200 text-orange-700 font-bold flex-shrink-0">
          {empleado.username.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 truncate">{empleado.username}</div>
          <div className="text-xs font-semibold text-gray-400 truncate">{empleado.rut || empleado.email}</div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          estado === 'finalizada'
            ? 'bg-gray-100 text-gray-500'
            : estado === 'sin_entrada'
              ? 'bg-red-50 text-red-500 border border-red-200'
              : estado === 'en_colacion'
                ? 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
        }`}>
          {estado === 'sin_entrada' && 'Sin entrada'}
          {estado === 'en_jornada' && 'En turno'}
          {estado === 'en_colacion' && 'En colacion'}
          {estado === 'colacion_terminada' && 'Trabajando'}
          {estado === 'finalizada' && 'Finalizado'}
        </span>
      </div>

      {/* Horarios */}
      {empleado.loadingAsistencia ? (
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className={`p-2 rounded-lg ${a?.horario_entrada ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-100'}`}>
            <div className="text-[10px] font-bold text-gray-400 uppercase">Entrada</div>
            <div className={`text-sm font-bold ${a?.horario_entrada ? 'text-green-700' : 'text-gray-300'}`}>
              {formatHora(a?.horario_entrada ?? null)}
            </div>
          </div>
          <div className={`p-2 rounded-lg ${a?.horario_inicio_colacion ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-100'}`}>
            <div className="text-[10px] font-bold text-gray-400 uppercase">Colacion</div>
            <div className={`text-sm font-bold ${a?.horario_inicio_colacion ? 'text-yellow-700' : 'text-gray-300'}`}>
              {formatHora(a?.horario_inicio_colacion ?? null)}
            </div>
          </div>
          <div className={`p-2 rounded-lg ${a?.horario_fin_colacion ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-100'}`}>
            <div className="text-[10px] font-bold text-gray-400 uppercase">Fin Col.</div>
            <div className={`text-sm font-bold ${a?.horario_fin_colacion ? 'text-blue-700' : 'text-gray-300'}`}>
              {formatHora(a?.horario_fin_colacion ?? null)}
            </div>
          </div>
          <div className={`p-2 rounded-lg ${a?.horario_salida ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-100'}`}>
            <div className="text-[10px] font-bold text-gray-400 uppercase">Salida</div>
            <div className={`text-sm font-bold ${a?.horario_salida ? 'text-red-700' : 'text-gray-300'}`}>
              {formatHora(a?.horario_salida ?? null)}
            </div>
          </div>
        </div>
      )}

      {/* Boton de accion */}
      {siguienteAccion && (
        <div className="flex gap-2">
          <button
            onClick={handleMarcar}
            disabled={marcando || empleado.loadingAsistencia}
            className={`flex-1 py-2.5 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 ${siguienteAccion.color}`}
          >
            {marcando ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <>
                {siguienteAccion.tipo === 'horario_entrada' && <HiCheck className="text-lg" />}
                {siguienteAccion.tipo === 'horario_inicio_colacion' && <HiClock className="text-lg" />}
                {siguienteAccion.tipo === 'horario_fin_colacion' && <HiClock className="text-lg" />}
                {siguienteAccion.tipo === 'horario_salida' && <HiLogout className="text-lg" />}
                {siguienteAccion.label}
              </>
            )}
          </button>
          {/* Boton de salida directa si esta en jornada o colacion */}
          {(estado === 'en_jornada' || estado === 'en_colacion') && (
            <button
              onClick={handleSalidaDirecta}
              disabled={marcando || empleado.loadingAsistencia}
              className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-50"
              title="Marcar salida directa"
            >
              <HiLogout className="text-lg" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminAsistenciasPage() {
  const router = useRouter();
  const [fecha, setFecha] = useState(getTodayLocal());
  const { data: empleados, loading: loadingEmpleados, error: errorEmpleados, refetch: refetchEmpleados } = useEmpleadosActivos();
  const [empleadosConAsistencia, setEmpleadosConAsistencia] = useState<EmpleadoConAsistencia[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Verificar rol admin
  useEffect(() => {
    const role = getUserRoleFromToken();
    if (role !== 'admin') {
      router.replace('/login');
    }
  }, [router]);

  // Cargar asistencias cuando cambian empleados o fecha
  const cargarAsistencias = useCallback(async () => {
    if (!empleados) return;

    // Inicializar con loading
    setEmpleadosConAsistencia(
      empleados.map((emp) => ({
        ...emp,
        asistencia: null,
        loadingAsistencia: true,
      }))
    );

    // Cargar asistencia de cada empleado
    const resultados = await Promise.all(
      empleados.map(async (emp) => {
        try {
          const asistencia = await getAsistenciaEmpleado(fecha, emp.id);
          return { ...emp, asistencia, loadingAsistencia: false };
        } catch {
          return { ...emp, asistencia: null, loadingAsistencia: false };
        }
      })
    );

    setEmpleadosConAsistencia(resultados);
  }, [empleados, fecha]);

  useEffect(() => {
    cargarAsistencias();
  }, [cargarAsistencias]);

  // Marcar asistencia
  const handleMarcar = async (empleadoId: string, tipo: TipoMarca) => {
    setError(null);
    const empleado = empleadosConAsistencia.find((e) => e.id === empleadoId);
    if (!empleado) return;

    try {
      let nuevaAsistencia: Asistencia;
      if (!empleado.asistencia && tipo === 'horario_entrada') {
        nuevaAsistencia = await crearAsistencia(empleadoId, tipo);
      } else {
        nuevaAsistencia = await actualizarAsistencia(empleadoId, fecha, tipo);
      }

      // Actualizar estado local
      setEmpleadosConAsistencia((prev) =>
        prev.map((e) => (e.id === empleadoId ? { ...e, asistencia: nuevaAsistencia } : e))
      );
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // Salida directa (salta colacion si no la ha tomado)
  const handleSalidaDirecta = async (empleadoId: string) => {
    setError(null);
    try {
      const nuevaAsistencia = await actualizarAsistencia(empleadoId, fecha, 'horario_salida');
      setEmpleadosConAsistencia((prev) =>
        prev.map((e) => (e.id === empleadoId ? { ...e, asistencia: nuevaAsistencia } : e))
      );
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // Stats
  const stats = {
    total: empleadosConAsistencia.length,
    conEntrada: empleadosConAsistencia.filter((e) => e.asistencia?.horario_entrada).length,
    enTurno: empleadosConAsistencia.filter((e) => {
      const estado = getEstado(e.asistencia);
      return estado === 'en_jornada' || estado === 'en_colacion' || estado === 'colacion_terminada';
    }).length,
    finalizados: empleadosConAsistencia.filter((e) => e.asistencia?.horario_salida).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 py-6 px-4">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 rounded-lg hover:bg-white transition">
              <HiArrowLeft className="text-xl text-gray-600" />
            </Link>
            <h1 className="text-2xl font-extrabold text-gray-900">Control de Asistencias</h1>
          </div>
          <button
            onClick={() => {
              refetchEmpleados();
              cargarAsistencias();
            }}
            className="p-2 rounded-lg hover:bg-white transition"
            title="Refrescar"
          >
            <HiRefresh className="text-xl text-gray-600" />
          </button>
        </header>

        {/* Selector de fecha */}
        <div className="bg-white rounded-2xl shadow p-4 flex items-center gap-4">
          <label className="text-sm font-bold text-gray-700">Fecha:</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 font-semibold text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          />
          <button
            onClick={() => setFecha(getTodayLocal())}
            className="px-4 py-2 bg-orange-100 text-orange-600 font-bold rounded-xl hover:bg-orange-200 transition text-sm"
          >
            Hoy
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-extrabold text-gray-900">{stats.total}</div>
            <div className="text-xs font-bold text-gray-400">Total</div>
          </div>
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-extrabold text-green-600">{stats.conEntrada}</div>
            <div className="text-xs font-bold text-gray-400">Con entrada</div>
          </div>
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-extrabold text-emerald-600">{stats.enTurno}</div>
            <div className="text-xs font-bold text-gray-400">En turno</div>
          </div>
          <div className="bg-white rounded-xl shadow p-3 text-center">
            <div className="text-2xl font-extrabold text-gray-500">{stats.finalizados}</div>
            <div className="text-xs font-bold text-gray-400">Finalizados</div>
          </div>
        </div>

        {/* Error */}
        {(error || errorEmpleados) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600 font-semibold text-sm">{error || errorEmpleados}</p>
          </div>
        )}

        {/* Lista de empleados */}
        {loadingEmpleados ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow p-4 h-48 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-24 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-12 rounded-lg bg-gray-100" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : empleadosConAsistencia.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="font-semibold text-gray-400">No hay empleados registrados</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {empleadosConAsistencia.map((empleado) => (
              <EmpleadoCard
                key={empleado.id}
                empleado={empleado}
                fecha={fecha}
                onMarcar={handleMarcar}
                onSalidaDirecta={handleSalidaDirecta}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
