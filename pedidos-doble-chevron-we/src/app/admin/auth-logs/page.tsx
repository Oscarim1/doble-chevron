'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUserRoleFromToken } from '@/utils/auth'
import {
  useAuthLogsDashboard,
  AuthEventType,
  AuthLog,
  DeviceInfo,
  TopIp,
  DailyActivity,
} from '@/hooks/useAuthLogs'
import DCTopbar from '@/app/components/DCTopbar'

const EVENT_CONFIG: Record<AuthEventType, { label: string; bg: string; color: string }> = {
  login_success: { label: 'Login OK',  bg: '#DCEFD9', color: '#2C7A45' },
  login_failed:  { label: 'Fallido',   bg: '#F7D9D5', color: '#C23A2E' },
  logout:        { label: 'Logout',    bg: '#F0E8E0', color: '#4A3A30' },
  register:      { label: 'Registro',  bg: '#D8EAF8', color: '#2A5B9E' },
  refresh_token: { label: 'Refresh',   bg: '#FBE9C8', color: '#9A6B12' },
}

function EventBadge({ type }: { type: AuthEventType }) {
  const cfg = EVENT_CONFIG[type] ?? EVENT_CONFIG.login_success
  return (
    <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}` }}>
      {cfg.label}
    </span>
  )
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
}

export default function AuthLogsPage() {
  const router = useRouter()
  const [days, setDays] = useState(7)
  const { data, loading, error, refetch } = useAuthLogsDashboard(days)

  useEffect(() => {
    const role = getUserRoleFromToken()
    if (role !== 'admin') router.replace('/login')
  }, [router])

  return (
    <div style={{ minHeight: '100dvh', background: '#FBF1E2', color: '#221813' }}>
      <DCTopbar active="admin" />

      <main className="dc-page dc-page--wide">
        {/* ── Header ── */}
        <div className="dc-head">
          <div className="dc-head__left">
            <Link href="/admin" className="dc-back" aria-label="Volver">
              <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </Link>
            <div>
              <div className="dc-kicker">· Seguridad ·</div>
              <h1 className="dc-title">Registro de Accesos</h1>
              <p className="dc-sub">Monitoreo de autenticación y seguridad.</p>
            </div>
          </div>
          <div className="dc-head__actions">
            <select
              className="dc-select"
              value={days}
              onChange={e => setDays(Number(e.target.value))}
              style={{ maxWidth: 200 }}
            >
              <option value={7}>Últimos 7 días</option>
              <option value={14}>Últimos 14 días</option>
              <option value={30}>Últimos 30 días</option>
            </select>
            <button className="btn btn--ghost" onClick={refetch} disabled={loading}>
              <svg viewBox="0 0 24 24"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
              Actualizar
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="card" style={{ padding: '14px 18px', marginBottom: 20, background: '#F7D9D5', borderColor: '#D63B30', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <p style={{ color: '#C23A2E', fontWeight: 600, margin: 0 }}>{error}</p>
            <button className="btn btn--sm" style={{ background: '#D63B30', color: '#fff', borderColor: '#D63B30' }} onClick={refetch}>Reintentar</button>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="stat-grid stat-grid--4" style={{ marginBottom: 24 }}>
          {loading ? (
            [0,1,2,3].map(i => <div key={i} className="stat skeleton" style={{ height: 88 }} />)
          ) : (
            <>
              <div className="stat">
                <div className="stat__num" style={{ color: '#2C7A45' }}>{(data?.stats.successful_logins ?? 0).toLocaleString('es-CL')}</div>
                <div className="stat__label">Logins Exitosos</div>
              </div>
              <div className="stat">
                <div className="stat__num" style={{ color: '#C23A2E' }}>{(data?.stats.failed_logins ?? 0).toLocaleString('es-CL')}</div>
                <div className="stat__label">Logins Fallidos</div>
              </div>
              <div className="stat">
                <div className="stat__num" style={{ color: '#2A5B9E' }}>{(data?.stats.unique_ips ?? 0).toLocaleString('es-CL')}</div>
                <div className="stat__label">IPs Únicas</div>
              </div>
              <div className="stat">
                <div className="stat__num">{(data?.stats.unique_users ?? 0).toLocaleString('es-CL')}</div>
                <div className="stat__label">Usuarios Activos</div>
              </div>
            </>
          )}
        </div>

        {/* ── Two-column ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 20 }}>
          {/* Daily Activity */}
          <div className="panel">
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Actividad Diaria</div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[0,1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 24, borderRadius: 6 }} />)}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data?.dailyActivity.slice(-7).map((day: DailyActivity) => {
                    const maxTotal = Math.max(...(data?.dailyActivity.map(d => d.total) ?? [1]))
                    const successWidth = maxTotal > 0 ? (day.successful / maxTotal) * 100 : 0
                    const failedWidth  = maxTotal > 0 ? (day.failed / maxTotal) * 100 : 0
                    return (
                      <div key={day.date} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 44, fontSize: 12, color: '#4A3A30', flexShrink: 0 }}>{formatShortDate(day.date)}</span>
                        <div style={{ flex: 1, display: 'flex', height: 22, background: '#F0E8E0', borderRadius: 6, overflow: 'hidden', border: '1px solid #E5D5BA' }}>
                          {successWidth > 0 && (
                            <div style={{ width: `${successWidth}%`, background: '#2C7A45', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {day.successful > 0 && <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>{day.successful}</span>}
                            </div>
                          )}
                          {failedWidth > 0 && (
                            <div style={{ width: `${failedWidth}%`, background: '#C23A2E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {day.failed > 0 && <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>{day.failed}</span>}
                            </div>
                          )}
                        </div>
                        <span style={{ width: 28, fontSize: 12, fontWeight: 700, textAlign: 'right' }}>{day.total}</span>
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: '#4A3A30' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: '#2C7A45', display: 'inline-block' }} /> Exitosos
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: '#C23A2E', display: 'inline-block' }} /> Fallidos
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Devices */}
          <div className="panel">
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Dispositivos</div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[0,1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data?.devices.slice(0, 5).map((device: DeviceInfo, idx: number) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FBF1E2', border: '1px solid #E5D5BA', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ width: 38, height: 38, background: '#F4E6CE', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {device.device_type === 'mobile' ? (
                        <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: '#4A3A30', strokeWidth: 2, fill: 'none' }}><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: '#4A3A30', strokeWidth: 2, fill: 'none' }}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{device.os || 'Desconocido'}</div>
                      <div style={{ fontSize: 12, color: '#4A3A30', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{device.browser || 'Navegador desconocido'}</div>
                    </div>
                    <span style={{ background: '#221813', color: '#FBF1E2', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{device.count}</span>
                  </div>
                ))}
                {(!data?.devices || data.devices.length === 0) && (
                  <p style={{ color: '#4A3A30', textAlign: 'center', padding: '16px 0', fontSize: 13 }}>Sin datos de dispositivos</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Top IPs ── */}
        <div className="panel" style={{ padding: 0, marginBottom: 20 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1.5px solid #E5D5BA', fontWeight: 800, fontSize: 15 }}>IPs más Frecuentes</div>
          {loading ? (
            <div style={{ padding: 20 }}>
              {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 40, marginBottom: 10, borderRadius: 6 }} />)}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="dc-table">
                <thead>
                  <tr>
                    <th>IP</th><th>Accesos</th><th>Usuarios</th><th>Último acceso</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.topIps.map((ip: TopIp) => (
                    <tr key={ip.ip_address}>
                      <td className="mono">{ip.ip_address}</td>
                      <td className="strong">{ip.access_count}</td>
                      <td>{ip.users_count}</td>
                      <td className="muted">{formatDate(ip.last_access)}</td>
                    </tr>
                  ))}
                  {(!data?.topIps || data.topIps.length === 0) && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#4A3A30' }}>Sin datos de IPs</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Recent Logins ── */}
        <div className="panel" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1.5px solid #E5D5BA', fontWeight: 800, fontSize: 15 }}>Últimos Accesos</div>
          {loading ? (
            <div style={{ padding: 20 }}>
              {[0,1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 44, marginBottom: 10, borderRadius: 6 }} />)}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="dc-table">
                <thead>
                  <tr>
                    <th>Usuario</th><th>Evento</th><th>IP</th><th>Dispositivo</th><th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recentLogins.map((log: AuthLog) => (
                    <tr key={log.id}>
                      <td>
                        <div className="strong" style={{ fontSize: 13 }}>{log.username || 'Sin nombre'}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{log.email}</div>
                      </td>
                      <td>
                        <EventBadge type={log.event_type} />
                        {log.failure_reason && <div style={{ fontSize: 11, color: '#C23A2E', marginTop: 2 }}>{log.failure_reason}</div>}
                      </td>
                      <td className="mono muted" style={{ fontSize: 13 }}>{log.ip_address}</td>
                      <td>
                        <div style={{ fontSize: 13 }}>{log.sistema_operativo || 'Desconocido'}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{log.navegador || '-'}</div>
                      </td>
                      <td className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(log.created_at)}</td>
                    </tr>
                  ))}
                  {(!data?.recentLogins || data.recentLogins.length === 0) && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#4A3A30' }}>Sin registros de acceso</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
