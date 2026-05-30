'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchWithAuth, getApiUrl } from '@/utils/api'
import { getUserRoleFromToken } from '@/utils/auth'
import DCTopbar from '@/app/components/DCTopbar'

const POR_PAGINA = 8

interface CierreCaja {
  id: string; fecha: string; total_efectivo: string; total_maquinas: string;
  salidas_efectivo: string; ingresos_efectivo: string; usuario_id: string;
  observacion: string | null; is_active: number; created_at: string; updated_at: string;
  informe_id: string | null; monto_declarado_efectivo: string | null;
  monto_declarado_tarjeta: string | null; monto_declarado_pedidos_ya: string | null;
  informe_created_at: string | null;
}

function fmtCLP(v: string | null): string {
  if (!v) return '—'
  const n = parseFloat(v)
  return isNaN(n) ? '—' : '$' + Math.round(n).toLocaleString('es-CL')
}
function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Santiago' })
}
function fmtHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago' })
}
function getMesAnio(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', { month: 'long', year: 'numeric', timeZone: 'America/Santiago' })
}
function getDiff(sistema: string | null, declarado: string | null): number | null {
  if (!sistema || !declarado) return null
  return parseFloat(declarado) - parseFloat(sistema)
}

function DiffBadge({ sistema, declarado }: { sistema: string | null; declarado: string | null }) {
  const diff = getDiff(sistema, declarado)
  if (diff === null) return null
  const abs = Math.abs(diff)
  if (abs < 1) return <span className="diff" style={{ background: '#DCEFD9', color: '#2C7A45' }}>= Cuadra</span>
  const isPos = diff > 0
  return (
    <span className={`diff ${isPos ? 'diff--pos' : 'diff--neg'}`}>
      <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, stroke: 'currentColor', strokeWidth: 2.4, fill: 'none' }}>
        {isPos ? <path d="M12 19V5M5 12l7-7 7 7"/> : <path d="M12 5v14M19 12l-7 7-7-7"/>}
      </svg>
      {isPos ? '+' : ''}{Math.round(diff).toLocaleString('es-CL')}
    </span>
  )
}

function CierreCard({ cierre }: { cierre: CierreCaja }) {
  const tieneInforme = cierre.informe_id !== null
  const difEf = getDiff(cierre.total_efectivo, cierre.monto_declarado_efectivo)
  const difTj = getDiff(cierre.total_maquinas, cierre.monto_declarado_tarjeta)
  const hayDiscrepancia = tieneInforme && ((difEf !== null && Math.abs(difEf) >= 1) || (difTj !== null && Math.abs(difTj) >= 1))

  return (
    <article className="card cierre">
      <div className="cierre__head">
        <div>
          <div className="cierre__date">
            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>
            <span className="d">{fmtFecha(cierre.fecha)}</span>
          </div>
          <div className="cierre__meta">
            <span>Realizado {fmtHora(cierre.created_at)}</span>
            {tieneInforme && cierre.informe_created_at && <span>Informe {fmtHora(cierre.informe_created_at)}</span>}
          </div>
        </div>
        <div className="cierre__badges">
          {hayDiscrepancia && <span className="badge badge--warn">Diferencias</span>}
          {tieneInforme
            ? <span className="badge badge--ok">Con informe</span>
            : <span className="badge badge--off">Sin informe</span>
          }
        </div>
      </div>

      <div className="pay-grid">
        <div className="pay pay--cash">
          <div className="pay__h">
            <svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>
            Efectivo
          </div>
          <div className="pay__row"><div className="pay__k">Sistema</div><div className="pay__v">{fmtCLP(cierre.total_efectivo)}</div></div>
          {parseFloat(cierre.salidas_efectivo || '0') > 0 && <div className="pay__row"><div className="pay__k">Salidas</div><div className="pay__v neg">-{fmtCLP(cierre.salidas_efectivo)}</div></div>}
          {parseFloat(cierre.ingresos_efectivo || '0') > 0 && <div className="pay__row"><div className="pay__k">Ingresos</div><div className="pay__v" style={{ color: '#2C7A45' }}>+{fmtCLP(cierre.ingresos_efectivo)}</div></div>}
          {tieneInforme && <div className="pay__row"><div className="pay__k">Declarado</div><div className="pay__v">{fmtCLP(cierre.monto_declarado_efectivo)}</div><DiffBadge sistema={cierre.total_efectivo} declarado={cierre.monto_declarado_efectivo} /></div>}
        </div>

        <div className="pay pay--card">
          <div className="pay__h">
            <svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
            Tarjeta
          </div>
          <div className="pay__row"><div className="pay__k">Sistema</div><div className="pay__v">{fmtCLP(cierre.total_maquinas)}</div></div>
          {tieneInforme && <div className="pay__row"><div className="pay__k">Declarado</div><div className="pay__v">{fmtCLP(cierre.monto_declarado_tarjeta)}</div><DiffBadge sistema={cierre.total_maquinas} declarado={cierre.monto_declarado_tarjeta} /></div>}
        </div>

        <div className="pay pay--app">
          <div className="pay__h">
            <svg viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg>
            PedidosYa
          </div>
          {tieneInforme
            ? <div className="pay__row"><div className="pay__k">Declarado</div><div className="pay__v">{fmtCLP(cierre.monto_declarado_pedidos_ya)}</div></div>
            : <div style={{ color: '#4A3A30', fontSize: 13 }}>Sin informe</div>
          }
        </div>
      </div>

      {cierre.observacion && (
        <div style={{ marginTop: 14, background: '#F4E6CE', border: '1px solid #E5D5BA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#4A3A30' }}>
          {cierre.observacion}
        </div>
      )}
    </article>
  )
}

export default function CierresCajaPage() {
  const router = useRouter()
  const [cierres, setCierres] = useState<CierreCaja[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)
  const [mesSeleccionado, setMesSeleccionado] = useState('')
  const [pagina, setPagina] = useState(1)

  useEffect(() => {
    if (getUserRoleFromToken() !== 'admin') router.replace('/login')
  }, [router])

  const cargar = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetchWithAuth(`${getApiUrl()}/api/cierres-caja/con-informe`)
      if (!res.ok) throw new Error(await res.text())
      const data: CierreCaja[] = await res.json()
      data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      setCierres(data)
    } catch (e) { setError(e instanceof Error ? e.message : 'Error al cargar') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const opcionesMes = useMemo(() => {
    const vistas = new Set<string>()
    cierres.forEach(c => vistas.add(getMesAnio(c.fecha)))
    return Array.from(vistas)
  }, [cierres])

  const filtrados = useMemo(() => {
    if (!mesSeleccionado) return cierres
    return cierres.filter(c => getMesAnio(c.fecha) === mesSeleccionado)
  }, [cierres, mesSeleccionado])

  useEffect(() => { setPagina(1) }, [mesSeleccionado])

  const visibles = useMemo(() => {
    const inicio = (pagina - 1) * POR_PAGINA
    return filtrados.slice(inicio, inicio + POR_PAGINA)
  }, [filtrados, pagina])

  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA)

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
              <div className="dc-kicker">· Caja ·</div>
              <h1 className="dc-title">Historial de Cierres</h1>
              <p className="dc-sub">Cierres de caja realizados con su informe.</p>
            </div>
          </div>
          <div className="dc-head__actions">
            <button className="btn btn--ghost" onClick={cargar} disabled={loading}>
              <svg viewBox="0 0 24 24"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
              Actualizar
            </button>
          </div>
        </div>

        {/* ── Filtro por mes ── */}
        {!loading && cierres.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A3A30' }}>Filtrar por mes:</span>
            <select
              className="dc-select"
              value={mesSeleccionado}
              onChange={e => setMesSeleccionado(e.target.value)}
              style={{ maxWidth: 220 }}
            >
              <option value="">Todos los meses</option>
              {opcionesMes.map(mes => <option key={mes} value={mes} style={{ textTransform: 'capitalize' }}>{mes}</option>)}
            </select>
            {mesSeleccionado && (
              <button className="btn btn--ghost btn--sm" onClick={() => setMesSeleccionado('')}>✕ Limpiar</button>
            )}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="card" style={{ padding: '14px 18px', marginBottom: 16, background: '#F7D9D5', borderColor: '#D63B30' }}>
            <p style={{ color: '#C23A2E', fontWeight: 600, margin: 0 }}>{error}</p>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && [0,1,2].map(i => (
          <div key={i} className="card skeleton" style={{ height: 200, marginBottom: 18 }} />
        ))}

        {/* ── Empty ── */}
        {!loading && !error && filtrados.length === 0 && (
          <div className="dc-empty">
            <div className="ic"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M14.5 9a2.5 2 0 0 0-2.5-1.5c-1.4 0-2.5.7-2.5 2s1.1 1.6 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2A2.5 2 0 0 1 9.5 15M12 6v1.5M12 16.5V18"/></svg></div>
            <h3>{mesSeleccionado ? `Sin cierres en ${mesSeleccionado}` : 'No hay cierres registrados'}</h3>
            <p>Los cierres de caja aparecerán aquí una vez generados.</p>
          </div>
        )}

        {/* ── Cards ── */}
        {!loading && visibles.map(c => <CierreCard key={c.id} cierre={c} />)}

        {/* ── Pagination ── */}
        {!loading && totalPaginas > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24 }}>
            <button className="btn btn--ghost btn--sm" onClick={() => setPagina(p => Math.max(p - 1, 1))} disabled={pagina === 1}>← Anterior</button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`btn btn--sm${p === pagina ? ' btn--ink' : ' btn--ghost'}`}
                onClick={() => setPagina(p)}
              >
                {p}
              </button>
            ))}
            <button className="btn btn--ghost btn--sm" onClick={() => setPagina(p => Math.min(p + 1, totalPaginas))} disabled={pagina === totalPaginas}>Siguiente →</button>
          </div>
        )}
      </main>
    </div>
  )
}
