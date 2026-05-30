'use client'
import Link from 'next/link'

type ActiveLink = 'dashboard' | 'admin'

export default function DCTopbar({ active }: { active?: ActiveLink }) {
  return (
    <header className="dc-topbar">
      <Link href="/select-mode" className="brand">Doble Chevron</Link>
      <nav className="dc-nav">
        <Link href="/dashboard" className={active === 'dashboard' ? 'active' : ''}>Dashboard</Link>
        <span className="sep">|</span>
        <Link href="/admin" className={active === 'admin' ? 'active' : ''}>Administración</Link>
        <span className="sep">|</span>
        <Link href="/logout" style={{ opacity: 0.6 }}>Cerrar sesión</Link>
      </nav>
    </header>
  )
}
