'use client';

import { useState } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { getToday, formatDateLong, formatCLP } from '@/utils/formatters';
import { SalesChart, PaymentMixChart, TopProductsTable, CategoriesTable, RecentOrdersTable, AttendanceBadge } from '@/app/components/dashboard';
import DCTopbar from '@/app/components/DCTopbar';
import type { Period } from '@/types/dashboard';

const KPI_DEFS = [
  {
    key: 'ventas' as const,
    label: 'Ventas totales',
    sub: 'Total período',
    isCurrency: true,
    iconBg: '#D8482A',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#FBF1E2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 8h16l-1.5 11a2 2 0 0 1-2 1.8H7.5a2 2 0 0 1-2-1.8L4 8z"/>
        <path d="M8 8a4 4 0 0 1 8 0"/>
      </svg>
    ),
  },
  {
    key: 'efectivo' as const,
    label: 'Efectivo',
    sub: 'Total período',
    isCurrency: true,
    iconBg: '#DCEFD9',
    iconStroke: '#2C7A45',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#2C7A45" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2"/>
        <circle cx="12" cy="12" r="2.5"/>
      </svg>
    ),
  },
  {
    key: 'tarjeta' as const,
    label: 'Tarjeta',
    sub: 'Total período',
    isCurrency: true,
    iconBg: '#D8E6FA',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#2A5B9E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <path d="M2 10h20"/>
      </svg>
    ),
  },
  {
    key: 'pedidos' as const,
    label: 'Pedidos',
    sub: 'Cantidad total',
    isCurrency: false,
    iconBg: '#E7E0F2',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#6B4BA8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2h9l3 3v17l-2.2-1.5L13.6 22 12 20.5 10.4 22 8.2 20.5 6 22V2z"/>
        <path d="M9 8h6M9 12h6"/>
      </svg>
    ),
  },
  {
    key: 'ticket' as const,
    label: 'Ticket promedio',
    sub: 'Total período',
    isCurrency: true,
    iconBg: '#E8B547',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#221813" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2"/>
        <path d="M8 6h8M8 10h8M8 14h4"/>
      </svg>
    ),
  },
]

function getKpiValue(data: ReturnType<typeof useDashboard>['data'], key: typeof KPI_DEFS[number]['key']): number {
  if (!data) return 0
  switch (key) {
    case 'ventas': return data.kpis.totalVentas
    case 'efectivo': return data.kpis.totalEfectivo
    case 'tarjeta': return data.kpis.totalTarjeta
    case 'pedidos': return data.kpis.pedidos
    case 'ticket': return data.kpis.ticketPromedio
  }
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('day');
  const [date, setDate] = useState(getToday());
  const { data, loading, error, refetch } = useDashboard({ period, date });

  const rangeLabel = data
    ? data.meta.from === data.meta.to ? data.meta.from : `${data.meta.from} → ${data.meta.to}`
    : '';

  return (
    <div style={{ minHeight: '100dvh', background: '#FBF1E2', color: '#221813' }}>
      <DCTopbar active="dashboard" />

      <main className="dc-page dc-page--wide">
        {/* ── Page header ── */}
        <div className="dc-head">
          <div className="dc-head__left">
            <div>
              <div className="dc-kicker">· Panel de control ·</div>
              <h1 className="dc-title">Panel de Control</h1>
              <p className="dc-sub">
                Doble Chevron · America/Santiago{date ? ` · ${formatDateLong(date)}` : ''}
              </p>
            </div>
          </div>
          <div className="dc-head__actions ctl-row">
            <span className="date-pill">
              <span className="lbl">Fecha</span>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </span>
            <div className="dc-seg">
              {(['day', 'week', 'month'] as Period[]).map(p => (
                <button
                  key={p}
                  className={period === p ? 'active' : ''}
                  onClick={() => setPeriod(p)}
                >
                  {p === 'day' ? 'Día' : p === 'week' ? 'Semana' : 'Mes'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="card" style={{ padding: '16px 20px', marginBottom: 20, background: '#F7D9D5', borderColor: '#D63B30', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <p style={{ fontWeight: 600, color: '#C23A2E', margin: 0 }}>{error}</p>
            <button className="btn btn--danger btn--sm" onClick={refetch}>Reintentar</button>
          </div>
        )}

        {/* ── KPIs ── */}
        <div className="kpi5">
          {KPI_DEFS.map(kpi => (
            <div key={kpi.key} className="kpi-card">
              <div className="top">
                <span className="k">{kpi.label}</span>
                <span className="ic" style={{ background: kpi.iconBg }}>{kpi.icon}</span>
              </div>
              {loading
                ? <div className="skeleton" style={{ height: 34, borderRadius: 6, marginBottom: 8 }} />
                : <div className="v">{kpi.isCurrency ? formatCLP(getKpiValue(data, kpi.key)) : getKpiValue(data, kpi.key).toLocaleString('es-CL')}</div>
              }
              <div className="sub">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Charts ── */}
        <div className="dc-charts">
          <div className="panel">
            <h2 className="panel__title">Ventas por hora</h2>
            <SalesChart
              labels={data?.series.labels ?? []}
              ventas={data?.series.ventas ?? []}
              pedidos={data?.series.pedidos ?? []}
              period={period}
              loading={loading}
            />
          </div>
          <div className="panel">
            <h2 className="panel__title">Mix de pago</h2>
            <PaymentMixChart
              pctEfectivo={data?.kpis.mixPago?.pctEfectivo ?? 50}
              pctTarjeta={data?.kpis.mixPago?.pctTarjeta ?? 50}
              loading={loading}
            />
          </div>
        </div>

        {/* ── Top productos + Categorías ── */}
        <div className="dc-grid2">
          <div className="panel" style={{ padding: 0 }}>
            <h2 className="panel__title" style={{ padding: '22px 22px 0' }}>Top 10 productos</h2>
            <div style={{ marginTop: 14 }}>
              <TopProductsTable productos={data?.topProductos ?? []} loading={loading} />
            </div>
          </div>
          <div className="panel">
            <h2 className="panel__title">Categorías más vendidas</h2>
            <CategoriesTable categorias={data?.categorias ?? []} loading={loading} />
          </div>
        </div>

        {/* ── Últimos pedidos + Asistencia ── */}
        <div className="dc-grid2">
          <div className="panel">
            <div className="panel__head" style={{ marginBottom: 16 }}>
              <h2 className="panel__title" style={{ margin: 0 }}>Últimos pedidos</h2>
              {rangeLabel && <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, color: '#4A3A30' }}>{rangeLabel}</span>}
            </div>
            {loading
              ? <div className="panel-empty">Cargando...</div>
              : <RecentOrdersTable pedidos={data?.ultimosPedidos ?? []} loading={loading} />
            }
          </div>
          <div className="panel">
            <h2 className="panel__title">Asistencia</h2>
            <AttendanceBadge
              count={data?.asistencia.trabajadoresAsistieron ?? 0}
              trabajadores={data?.asistencia.trabajadores ?? []}
              loading={loading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
