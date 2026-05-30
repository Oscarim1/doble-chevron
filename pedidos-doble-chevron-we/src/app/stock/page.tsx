'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserRoleFromToken } from '@/utils/auth';
import { useStockSummary } from '@/hooks/useStock';
import { StockSummaryCard } from '@/app/components/stock';
import DCTopbar from '@/app/components/DCTopbar';

const quickActions = [
  {
    href: '/stock/purchase',
    label: 'Registrar Compra',
    icon: (
      <svg viewBox="0 0 24 24" style={{ width: 28, height: 28, stroke: 'currentColor', strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 3l-4 4-4-4"/>
      </svg>
    ),
    accent: '#2C7A45',
  },
  {
    href: '/stock/restock',
    label: 'Reposición',
    icon: (
      <svg viewBox="0 0 24 24" style={{ width: 28, height: 28, stroke: 'currentColor', strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
        <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
      </svg>
    ),
    accent: '#2A5B9E',
  },
  {
    href: '/stock/employee-consumption',
    label: 'Consumo Empleado',
    icon: (
      <svg viewBox="0 0 24 24" style={{ width: 28, height: 28, stroke: 'currentColor', strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
        <circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/>
      </svg>
    ),
    accent: '#D8482A',
  },
  {
    href: '/stock/movements',
    label: 'Historial',
    icon: (
      <svg viewBox="0 0 24 24" style={{ width: 28, height: 28, stroke: 'currentColor', strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>
      </svg>
    ),
    accent: '#6B3FC0',
  },
  {
    href: '/stock/locations',
    label: 'Ubicaciones',
    icon: (
      <svg viewBox="0 0 24 24" style={{ width: 28, height: 28, stroke: 'currentColor', strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
        <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
      </svg>
    ),
    accent: '#4A3A30',
  },
  {
    href: '/stock/reports/employees',
    label: 'Reporte Empleados',
    icon: (
      <svg viewBox="0 0 24 24" style={{ width: 28, height: 28, stroke: 'currentColor', strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/>
      </svg>
    ),
    accent: '#0E7490',
  },
];

export default function StockDashboardPage() {
  const router = useRouter();
  const { data: summaries, loading, error, refetch } = useStockSummary();

  useEffect(() => {
    const role = getUserRoleFromToken();
    if (role !== 'admin') router.replace('/login');
  }, [router]);

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
              <div className="dc-kicker">· Inventario ·</div>
              <h1 className="dc-title">Control de Stock</h1>
              <p className="dc-sub">Gestión de inventario por ubicación.</p>
            </div>
          </div>
          <div className="dc-head__actions">
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

        {/* ── Summary Cards ── */}
        <section className="loc-grid" style={{ marginBottom: 28 }}>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <StockSummaryCard key={i} summary={{} as never} loading />
              ))
            : summaries?.map(summary => (
                <StockSummaryCard
                  key={summary.location_id}
                  summary={summary}
                  onClick={() => router.push(`/stock/location/${summary.location_id}`)}
                />
              ))}
        </section>

        {/* ── Quick Actions ── */}
        <div className="panel">
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A3A30', marginBottom: 16 }}>Acciones Rápidas</div>
          <div className="tile-grid">
            {quickActions.map(action => (
              <Link key={action.href} href={action.href} className="tile">
                <div style={{ width: 52, height: 52, borderRadius: 12, background: '#FBF1E2', border: '1.5px solid #221813', display: 'flex', alignItems: 'center', justifyContent: 'center', color: action.accent }}>
                  {action.icon}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#221813', textAlign: 'center', lineHeight: 1.3 }}>{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
