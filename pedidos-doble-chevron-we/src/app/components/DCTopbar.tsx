'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getUserRoleFromToken } from '@/utils/auth'

type ActivePage = 'dashboard' | 'admin'

interface DCTopbarProps {
  active?: ActivePage
  backHref?: string
  stationBadge?: string
}

export default function DCTopbar({ active, backHref, stationBadge }: DCTopbarProps) {
  const router = useRouter()
  const role = getUserRoleFromToken() || 'user'

  return (
    <header className="dc-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {backHref && (
          <button
            onClick={() => router.push(backHref)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1.5px solid rgba(251,241,226,0.22)',
              background: 'transparent',
              color: '#FBF1E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              padding: 0,
            }}
            aria-label="Volver"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
        )}
        <Link href="/select-mode" className="brand">Doble Chevron</Link>
        {stationBadge && (
          <span style={{
            padding: '3px 10px',
            borderRadius: 999,
            background: '#D8482A',
            color: '#FBF1E2',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            marginLeft: 2,
          }}>
            {stationBadge}
          </span>
        )}
      </div>

      <nav className="dc-nav">
        {role === 'admin' && (
          <>
            <Link href="/dashboard" className={active === 'dashboard' ? 'active' : ''}>Dashboard</Link>
            <span className="sep">|</span>
            <Link href="/admin" className={active === 'admin' ? 'active' : ''}>Administración</Link>
            <span className="sep">|</span>
          </>
        )}
        <Link href="/logout" style={{ opacity: 0.6 }}>Cerrar sesión</Link>
      </nav>
    </header>
  )
}
