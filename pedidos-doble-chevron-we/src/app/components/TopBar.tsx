'use client'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { HiX, HiShoppingCart } from 'react-icons/hi'
import LogoTopBar from './LogoTopBar'
import { useCart } from '../../context/CartContext'
import { useCartDrawer } from '../../context/CartDrawerContext'
import Link from 'next/link'
import { useLoading } from '../../context/LoadingContext'
import { getUserRoleFromToken } from '@/utils/auth'

const MENU_LINKS = [
  { href: '/products', label: 'Productos', roles: ['user', 'admin', 'trabajador'] },
  { href: '/dashboard', label: 'Dashboard', roles: ['admin'] },
  { href: '/admin', label: 'Administración', roles: ['admin'] },
  { href: '/logout', label: 'Cerrar sesión', roles: ['user', 'admin', 'trabajador'] },
]

// Decoración de rayos para el botón CTA (lado izquierdo)
function RayLeft() {
  return (
    <svg width="18" height="30" viewBox="0 0 18 30" fill="none" aria-hidden="true">
      <line x1="17" y1="3"  x2="8"  y2="10" stroke="#CC4422" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="17" y1="15" x2="4"  y2="15" stroke="#CC4422" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="17" y1="27" x2="8"  y2="20" stroke="#CC4422" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

// Decoración de rayos para el botón CTA (lado derecho)
function RayRight() {
  return (
    <svg width="18" height="30" viewBox="0 0 18 30" fill="none" aria-hidden="true">
      <line x1="1" y1="3"  x2="10" y2="10" stroke="#CC4422" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="1" y1="15" x2="14" y2="15" stroke="#CC4422" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="1" y1="27" x2="10" y2="20" stroke="#CC4422" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

// Estrella 5 puntas sólida
function Star({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <polygon
        points="11,1 13.47,7.91 20.78,7.91 15.06,12.35 17.53,19.26 11,14.82 4.47,19.26 6.94,12.35 1.22,7.91 8.53,7.91"
        fill="#1A0F08"
      />
    </svg>
  )
}

export default function TopBar() {
  const [open, setOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const { items } = useCart()
  const { openDrawer } = useCartDrawer()
  const { setLoading } = useLoading()
  const pathname = usePathname()
  const role = getUserRoleFromToken() || 'user'
  const filteredLinks = MENU_LINKS.filter(link => link.roles.includes(role))
  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0)

  function handleNavigate(href: string, closeDrawer = false) {
    if (closeDrawer) setOpen(false)
    if (href !== pathname) setLoading(true)
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    function handleClickOutside(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const cartBadge = totalItems > 0 && (
    <span className="absolute -top-2 -right-2 bg-[#F2E2B8] text-[#CC4422] text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-0.5">
      {totalItems}
    </span>
  )

  return (
    <>
      <header className="w-full sticky top-0 z-30 shadow-lg" style={{ backgroundColor: '#CC4422' }}>
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 gap-4">

          {/* Izquierda: hamburguesa + logo + estrella */}
          <div className="flex items-center gap-3">

            <Link href="/" className="flex items-center gap-2" onClick={() => handleNavigate('/')}>
              <LogoTopBar className="h-13 w-auto" />
            </Link>
          </div>

          {/* Centro: links de navegación (solo desktop) */}
          <div className="hidden md:flex items-center">
            {filteredLinks.map((link, i) => (
              <div key={link.href} className="flex items-center">
                {i > 0 && (
                  <span className="text-[#F2E2B8] opacity-30 mx-4 text-lg select-none">|</span>
                )}
                <Link
                  href={link.href}
                  className="font-bold text-[#F2E2B8] uppercase tracking-widest text-sm hover:text-white transition"
                  onClick={() => handleNavigate(link.href)}
                >
                  {link.label}
                </Link>
              </div>
            ))}
          </div>

          {/* Derecha: botón CTA + carrito */}
          <div className="flex items-center gap-2">

            {/* Carrito */}
            {pathname.startsWith('/products') ? (
              <button
                className="relative text-[#F2E2B8] hover:text-white transition p-1"
                aria-label="Carrito"
                onClick={openDrawer}
              >
                <HiShoppingCart size={26} />
                {cartBadge}
              </button>
            ) : (
              <Link
                href="/cart"
                className="relative text-[#F2E2B8] hover:text-white transition p-1"
                aria-label="Carrito"
                onClick={() => handleNavigate('/cart')}
              >
                <HiShoppingCart size={26} />
                {cartBadge}
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-hidden={!open}
      />

      {/* Drawer lateral */}
      <aside
        ref={drawerRef}
        className={`fixed top-0 right-0 z-50 h-full w-72 shadow-2xl transform transition-transform duration-300
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ backgroundColor: '#B83918' }}
        aria-label="Menú lateral"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#F2E2B8]/20">
          <LogoTopBar className="h-10 w-auto" />
          <button
            onClick={() => setOpen(false)}
            className="text-[#F2E2B8] hover:text-white transition"
            aria-label="Cerrar menú"
          >
            <HiX size={28} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 mt-4 px-4">
          {filteredLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-3 px-4 rounded-lg font-bold uppercase tracking-widest text-[#F2E2B8] hover:bg-[#CC4422] hover:text-white transition text-sm"
              onClick={() => handleNavigate(link.href, true)}
            >
              {link.label}
            </Link>
          ))}

          {/* CTA en mobile */}
          <Link
            href="/products"
            className="mt-5 flex items-center justify-center bg-[#F2E2B8] text-[#1A0F08] font-extrabold uppercase tracking-widest text-sm px-5 py-3 rounded-full hover:bg-white transition shadow-md"
            onClick={() => handleNavigate('/products', true)}
          >
            Pedí la tuya
          </Link>
        </nav>

        <div className="absolute bottom-4 left-0 w-full text-center text-xs text-[#F2E2B8]/40">
          © 2025 Doble Chevron
        </div>
      </aside>
    </>
  )
}
