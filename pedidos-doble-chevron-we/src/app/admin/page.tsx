'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUserRoleFromToken } from '@/utils/auth'

/* ─── Data ───────────────────────────────────────────────── */
const sections = [
  {
    label: 'Catálogo',
    count: '02',
    items: [
      {
        num: 'N.º 01',
        title: 'Productos',
        desc: 'Crear, editar y eliminar productos del catálogo.',
        href: '/admin/productos',
        variant: 'accent',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <path d="M3.3 7 12 12l8.7-5M12 22V12"/>
          </svg>
        ),
      },
      {
        num: 'N.º 02',
        title: 'Categorías',
        desc: 'Crear y organizar categorías de productos.',
        href: '/admin/categorias',
        variant: 'gold',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/>
            <circle cx="7.5" cy="7.5" r="1.5"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Operación',
    count: '03',
    items: [
      {
        num: 'N.º 03',
        title: 'Pedidos',
        desc: 'Ver y administrar todos los pedidos realizados.',
        href: '/admin/pedidos',
        variant: 'accent',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2h9l3 3v17l-2.2-1.5L13.6 22 12 20.5 10.4 22 8.2 20.5 6 22V2z"/>
            <path d="M9 8h6M9 12h6M9 16h4"/>
          </svg>
        ),
      },
      {
        num: 'N.º 04',
        title: 'Stock',
        desc: 'Gestión de inventario y movimientos.',
        href: '/stock',
        variant: 'default',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="4" width="14" height="18" rx="2"/>
            <path d="M9 4V3a3 3 0 0 1 6 0v1M9 11h.01M9 15h.01M13 11h3M13 15h3"/>
          </svg>
        ),
      },
      {
        num: 'N.º 05',
        title: 'Historial de Cierres',
        desc: 'Ver todos los cierres de caja con sus informes.',
        href: '/admin/cierres-caja',
        variant: 'gold',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9"/>
            <path d="M14.5 9a2.5 2 0 0 0-2.5-1.5c-1.4 0-2.5.7-2.5 2s1.1 1.6 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2A2.5 2 0 0 1 9.5 15M12 6v1.5M12 16.5V18"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Personal & Seguridad',
    count: '02',
    items: [
      {
        num: 'N.º 06',
        title: 'Asistencias',
        desc: 'Control de asistencia de empleados.',
        href: '/admin/asistencias',
        variant: 'ink',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="8" r="3"/>
            <path d="M3.5 20a5.5 5.5 0 0 1 11 0"/>
            <circle cx="17" cy="9" r="2.2"/>
            <path d="M16 14.2a4.5 4.5 0 0 1 4.5 4.3"/>
          </svg>
        ),
      },
      {
        num: 'N.º 07',
        title: 'Registro de Accesos',
        desc: 'Monitoreo de autenticación y seguridad.',
        href: '/admin/auth-logs',
        variant: 'ink',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5l-8-3z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        ),
      },
    ],
  },
]

const quickLinks = [
  { label: 'Dashboard',         href: '/dashboard' },
  { label: 'Cierre de caja',    href: '/cierre-caja' },
  { label: 'Historial de stock', href: '/stock' },
  { label: 'Reporte consumos',  href: '/stock/reports/employees' },
]

/* ─── Card variant styles ────────────────────────────────── */
const iconStyles: Record<string, React.CSSProperties> = {
  accent:  { background: '#D8482A', color: '#FBF1E2' },
  gold:    { background: '#E8B547', color: '#221813' },
  ink:     { background: '#221813', color: '#E8B547' },
  default: { background: '#F4E8D0', color: '#221813' },
}

/* ─── Sub-components ─────────────────────────────────────── */
function SectionHead({ label, count }: { label: string; count: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-alfa-slab-one), "Alfa Slab One", serif',
        fontSize: 13,
        color: '#D8482A',
      }}>
        {count}
      </span>
      <span style={{ flex: 1, height: 0, borderTop: '1.5px dashed #E5D5BA' }} />
    </div>
  )
}

function ModuleCard({ num, title, desc, href, variant, icon }: {
  num: string; title: string; desc: string; href: string; variant: string; icon: React.ReactNode
}) {
  return (
    <Link href={href} className="dc-admin-card" data-variant={variant} style={{ textDecoration: 'none', color: 'inherit' }}>
      <span className="dc-admin-icon" style={{ ...iconStyles[variant] ?? iconStyles.default }}>
        {icon}
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{
          display: 'block',
          fontFamily: 'var(--font-alfa-slab-one), "Alfa Slab One", serif',
          fontSize: 11,
          letterSpacing: '0.08em',
          color: '#D8482A',
          marginBottom: 3,
        }}>
          {num}
        </span>
        <span style={{
          display: 'block',
          fontFamily: 'var(--font-alfa-slab-one), "Alfa Slab One", serif',
          fontWeight: 400,
          fontSize: 21,
          lineHeight: 1.02,
          letterSpacing: '-0.01em',
          color: '#221813',
        }}>
          {title}
        </span>
        <span style={{ display: 'block', marginTop: 5, fontSize: 13, lineHeight: 1.4, color: '#4A3A30' }}>
          {desc}
        </span>
      </span>
      <span className="dc-admin-arrow">→</span>
    </Link>
  )
}

/* ─── Page ───────────────────────────────────────────────── */
export default function AdminHubPage() {
  const router = useRouter()

  useEffect(() => {
    const role = getUserRoleFromToken()
    if (role !== 'admin') router.replace('/login')
  }, [router])

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#FBF1E2',
      fontFamily: '"DM Sans", var(--font-geist-sans), system-ui, sans-serif',
      color: '#221813',
    }}>
      {/* ── Topbar ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        padding: '16px clamp(20px, 5vw, 56px)',
        background: '#221813',
        color: '#FBF1E2',
        borderBottom: '3px solid #D8482A',
      }}>
        <Link href="/select-mode" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: 'var(--font-yellowtail), Yellowtail, cursive',
            fontSize: 26,
            color: '#FBF1E2',
            textShadow: '1.5px 1.5px 0 #000',
            lineHeight: 0.9,
          }}>
            Doble Chevron
          </span>
        </Link>
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
          <Link href="/dashboard" className="dc-topnav-link">Dashboard</Link>
          <span style={{ opacity: 0.3, padding: '0 4px' }}>|</span>
          <Link href="/admin" className="dc-topnav-link dc-topnav-active">Administración</Link>
          <span style={{ opacity: 0.3, padding: '0 4px' }}>|</span>
          <Link href="/logout" className="dc-topnav-link" style={{ opacity: 0.6 }}>Cerrar sesión</Link>
        </nav>
      </header>

      {/* ── Content ── */}
      <main style={{
        maxWidth: 1160,
        margin: '0 auto',
        padding: 'clamp(28px, 5vw, 52px) clamp(20px, 5vw, 56px) 72px',
      }}>
        {/* Page header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{
            fontFamily: 'var(--font-yellowtail), Yellowtail, cursive',
            fontSize: 24,
            color: '#D8482A',
            lineHeight: 1,
          }}>
            · Panel de control ·
          </div>
          <h1 style={{
            fontFamily: 'var(--font-alfa-slab-one), "Alfa Slab One", serif',
            fontWeight: 400,
            fontSize: 'clamp(34px, 5vw, 52px)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            margin: '6px 0 0',
            color: '#221813',
          }}>
            Administración
          </h1>
          <p style={{ marginTop: 12, fontSize: 15, color: '#4A3A30' }}>
            Selecciona un módulo para comenzar.
          </p>
        </div>

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.label} style={{ marginTop: 40 }}>
            <SectionHead label={section.label} count={section.count} />
            <div className="dc-admin-grid">
              {section.items.map((item) => (
                <ModuleCard key={item.href} {...item} />
              ))}
            </div>
          </div>
        ))}

        {/* Quick access */}
        <div style={{
          marginTop: 44,
          border: '1.5px solid #221813',
          borderRadius: 12,
          background: '#221813',
          color: '#FBF1E2',
          padding: '22px 24px',
          boxShadow: '0 5px 0 #221813',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* stripes */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(45deg, #FBF1E2 0 2px, transparent 2px 16px)',
            opacity: 0.05,
            pointerEvents: 'none',
          }} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16, position: 'relative' }}>
            <span style={{
              fontFamily: 'var(--font-alfa-slab-one), "Alfa Slab One", serif',
              fontSize: 16,
              letterSpacing: '0.02em',
            }}>
              Accesos rápidos
            </span>
            <span style={{ fontSize: 12, color: 'rgba(251,241,226,0.6)' }}>
              Atajos a las pantallas más usadas del turno
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, position: 'relative' }}>
            {quickLinks.map(({ label, href }) => (
              <Link key={href} href={href} className="dc-quick-tag">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
