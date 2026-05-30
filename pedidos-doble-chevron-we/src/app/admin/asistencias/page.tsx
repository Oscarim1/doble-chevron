'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import DCTopbar from '@/app/components/DCTopbar';

function getTodayLocal(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatHora(value: string | null): string {
  if (!value) return '--:--';
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(value)) {
    const parts = value.split(':');
    return `${parts[0].padStart(2, '0')}:${parts[1]}`;
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

interface EmpleadoConAsistencia extends Empleado { asistencia: Asistencia | null; loadingAsistencia: boolean; }
type EstadoEmpleado = 'sin_entrada' | 'en_jornada' | 'en_colacion' | 'colacion_terminada' | 'finalizada';

function getEstado(a: Asistencia | null): EstadoEmpleado {
  if (!a?.horario_entrada) return 'sin_entrada';
  if (a.horario_salida) return 'finalizada';
  if (a.horario_inicio_colacion && !a.horario_fin_colacion) return 'en_colacion';
  if (a.horario_inicio_colacion && a.horario_fin_colacion) return 'colacion_terminada';
  return 'en_jornada';
}
function getSiguiente(estado: EstadoEmpleado): { tipo: TipoMarca; label: string; color: string } | null {
  switch (estado) {
    case 'sin_entrada':       return { tipo: 'horario_entrada',          label: 'Marcar Entrada',   color: '#2FA35A' };
    case 'en_jornada':        return { tipo: 'horario_inicio_colacion',  label: 'Iniciar Colación', color: '#E8B547' };
    case 'en_colacion':       return { tipo: 'horario_fin_colacion',     label: 'Fin Colación',     color: '#2A5B9E' };
    case 'colacion_terminada':return { tipo: 'horario_salida',           label: 'Marcar Salida',    color: '#D63B30' };
    default: return null;
  }
}

function SLOT({ label, value, active }: { label: string; value: string | null; active: boolean }) {
  return (
    <div className={`emp-slot${active ? ' has-value' : ''}`}>
      <div className="k">{label}</div>
      <div className="v">{formatHora(value)}</div>
    </div>
  );
}

function EmpleadoCard({ emp, fecha, onMarcar, onSalidaDirecta }: {
  emp: EmpleadoConAsistencia; fecha: string;
  onMarcar: (id: string, tipo: TipoMarca) => Promise<void>;
  onSalidaDirecta: (id: string) => Promise<void>;
}) {
  const [marcando, setMarcando] = useState(false);
  const estado = getEstado(emp.asistencia);
  const siguiente = getSiguiente(estado);
  const a = emp.asistencia;

  const badgeStyle: React.CSSProperties = estado === 'sin_entrada'
    ? { background: '#F7E0DC', color: '#C23A2E' }
    : estado === 'finalizada'
    ? { background: '#F0E8E0', color: '#4A3A30' }
    : estado === 'en_colacion'
    ? { background: '#FBE9C8', color: '#9A6B12' }
    : { background: '#DCEFD9', color: '#2C7A45' };

  const badgeLabel: Record<EstadoEmpleado, string> = {
    sin_entrada: 'Sin entrada', en_jornada: 'En turno', en_colacion: 'En colación',
    colacion_terminada: 'Trabajando', finalizada: 'Finalizado',
  };

  const handleMarcar = async () => {
    if (!siguiente) return;
    setMarcando(true);
    try { await onMarcar(emp.id, siguiente.tipo); } finally { setMarcando(false); }
  };
  const handleSalidaDirecta = async () => {
    setMarcando(true);
    try { await onSalidaDirecta(emp.id); } finally { setMarcando(false); }
  };

  return (
    <div className="card emp-card">
      <div className="emp-top">
        <span className="avatar">{emp.username.charAt(0).toUpperCase()}</span>
        <span>
          <div className="emp-name">{emp.username}</div>
          <div className="emp-rut">{emp.rut || emp.email}</div>
        </span>
        <span style={{ flex: 1 }} />
        <span className="badge badge--bare" style={{ ...badgeStyle, border: '1.5px solid currentColor' }}>{badgeLabel[estado]}</span>
      </div>

      {emp.loadingAsistencia
        ? <div className="emp-slots">{[0,1,2,3].map(i => <div key={i} className="emp-slot skeleton" />)}</div>
        : <div className="emp-slots">
            <SLOT label="Entrada"  value={a?.horario_entrada ?? null}         active={!!a?.horario_entrada} />
            <SLOT label="Colación" value={a?.horario_inicio_colacion ?? null} active={!!a?.horario_inicio_colacion} />
            <SLOT label="Fin Col." value={a?.horario_fin_colacion ?? null}    active={!!a?.horario_fin_colacion} />
            <SLOT label="Salida"   value={a?.horario_salida ?? null}          active={!!a?.horario_salida} />
          </div>
      }

      {siguiente && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn--block"
            style={{ background: siguiente.color, color: '#fff', borderColor: siguiente.color }}
            onClick={handleMarcar}
            disabled={marcando || emp.loadingAsistencia}
          >
            {marcando ? 'Marcando…' : siguiente.label}
          </button>
          {(estado === 'en_jornada' || estado === 'en_colacion') && (
            <button
              className="btn btn--danger"
              onClick={handleSalidaDirecta}
              disabled={marcando || emp.loadingAsistencia}
              title="Marcar salida directa"
            >
              <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
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
  const { data: empleados, loading: loadingEmp, error: errorEmp, refetch: refetchEmp } = useEmpleadosActivos();
  const [empConAs, setEmpConAs] = useState<EmpleadoConAsistencia[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (getUserRoleFromToken() !== 'admin') router.replace('/login');
  }, [router]);

  const cargarAsistencias = useCallback(async () => {
    if (!empleados) return;
    setEmpConAs(empleados.map(e => ({ ...e, asistencia: null, loadingAsistencia: true })));
    const resultados = await Promise.all(
      empleados.map(async e => {
        try { const a = await getAsistenciaEmpleado(fecha, e.id); return { ...e, asistencia: a, loadingAsistencia: false }; }
        catch { return { ...e, asistencia: null, loadingAsistencia: false }; }
      })
    );
    setEmpConAs(resultados);
  }, [empleados, fecha]);

  useEffect(() => { cargarAsistencias(); }, [cargarAsistencias]);

  const handleMarcar = async (empleadoId: string, tipo: TipoMarca) => {
    setError(null);
    const emp = empConAs.find(e => e.id === empleadoId);
    if (!emp) return;
    try {
      const nueva = (!emp.asistencia && tipo === 'horario_entrada')
        ? await crearAsistencia(empleadoId, tipo)
        : await actualizarAsistencia(empleadoId, fecha, tipo);
      setEmpConAs(prev => prev.map(e => e.id === empleadoId ? { ...e, asistencia: nueva } : e));
    } catch (err) { setError((err as Error).message); }
  };

  const handleSalidaDirecta = async (empleadoId: string) => {
    setError(null);
    try {
      const nueva = await actualizarAsistencia(empleadoId, fecha, 'horario_salida');
      setEmpConAs(prev => prev.map(e => e.id === empleadoId ? { ...e, asistencia: nueva } : e));
    } catch (err) { setError((err as Error).message); }
  };

  const stats = {
    total: empConAs.length,
    conEntrada: empConAs.filter(e => e.asistencia?.horario_entrada).length,
    enTurno: empConAs.filter(e => ['en_jornada','en_colacion','colacion_terminada'].includes(getEstado(e.asistencia))).length,
    finalizados: empConAs.filter(e => e.asistencia?.horario_salida).length,
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#FBF1E2', color: '#221813' }}>
      <DCTopbar active="admin" />

      <main className="dc-page">
        {/* ── Header ── */}
        <div className="dc-head">
          <div className="dc-head__left">
            <Link href="/admin" className="dc-back" aria-label="Volver">
              <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </Link>
            <div>
              <div className="dc-kicker">· Personal ·</div>
              <h1 className="dc-title">Control de Asistencias</h1>
              <p className="dc-sub">Marca entrada, colación y salida de cada empleado.</p>
            </div>
          </div>
          <div className="dc-head__actions">
            <button className="icon-btn" onClick={() => { refetchEmp(); cargarAsistencias(); }} title="Actualizar">
              <svg viewBox="0 0 24 24"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
            </button>
          </div>
        </div>

        {/* ── Date card ── */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', marginBottom: 22 }}>
          <label style={{ fontSize: 13, fontWeight: 700 }}>Fecha:</label>
          <input className="dc-input" type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={{ maxWidth: 240 }} />
          <button className="btn btn--ghost btn--sm" style={{ color: '#D8482A', borderColor: '#D8482A' }} onClick={() => setFecha(getTodayLocal())}>Hoy</button>
        </div>

        {/* ── Stats ── */}
        <div className="stat-grid stat-grid--4" style={{ marginBottom: 24 }}>
          <div className="stat"><div className="stat__num">{stats.total}</div><div className="stat__label">Total</div></div>
          <div className="stat"><div className="stat__num" style={{ color: '#2C7A45' }}>{stats.conEntrada}</div><div className="stat__label">Con entrada</div></div>
          <div className="stat"><div className="stat__num" style={{ color: '#2C7A45' }}>{stats.enTurno}</div><div className="stat__label">En turno</div></div>
          <div className="stat"><div className="stat__num" style={{ color: '#2C7A45' }}>{stats.finalizados}</div><div className="stat__label">Finalizados</div></div>
        </div>

        {/* ── Error ── */}
        {(error || errorEmp) && (
          <div className="card" style={{ padding: '14px 18px', marginBottom: 16, background: '#F7D9D5', borderColor: '#D63B30' }}>
            <p style={{ color: '#C23A2E', fontWeight: 600, fontSize: 13, margin: 0 }}>{error || errorEmp}</p>
          </div>
        )}

        {/* ── Empty ── */}
        {!loadingEmp && empConAs.length === 0 && (
          <div className="dc-empty">
            <div className="ic"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.2"/><path d="M16 14.2a4.5 4.5 0 0 1 4.5 4.3"/></svg></div>
            <h3>Sin empleados activos</h3>
            <p>No hay empleados registrados en el sistema.</p>
          </div>
        )}

        {/* ── Grid ── */}
        <div className="emp-grid">
          {loadingEmp
            ? [1,2,3,4].map(i => <div key={i} className="card emp-card skeleton" style={{ height: 200 }} />)
            : empConAs.map(emp => (
                <EmpleadoCard key={emp.id} emp={emp} fecha={fecha} onMarcar={handleMarcar} onSalidaDirecta={handleSalidaDirecta} />
              ))
          }
        </div>
      </main>
    </div>
  );
}
