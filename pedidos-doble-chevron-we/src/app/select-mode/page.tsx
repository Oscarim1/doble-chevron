'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseTokenPayload } from '@/utils/auth'

/* ─── Panel ──────────────────────────────────────────────── */
interface PanelProps {
  number: string
  label: string
  tagline: string
  active: boolean
  onEnter: () => void
  onLeave: () => void
  onClick: () => void
  dark?: boolean
}

function Panel({ number, label, tagline, active, onEnter, onLeave, onClick, dark = false }: PanelProps) {
  const bg     = dark ? '#221813' : '#D8482A'
  const accent = dark ? '#E8B547' : '#F3D58A'

  const notch = (top: boolean, left: boolean) => ({
    position: 'absolute' as const,
    width: 12,
    height: 12,
    border: '2px solid transparent',
    ...(top  ? { top: 0 }    : { bottom: 0 }),
    ...(left ? { left: 0 }   : { right: 0 }),
    ...(top  &&  left ? { borderTopColor: accent,    borderLeftColor: accent  } : {}),
    ...(top  && !left ? { borderTopColor: accent,    borderRightColor: accent } : {}),
    ...(!top &&  left ? { borderBottomColor: accent, borderLeftColor: accent  } : {}),
    ...(!top && !left ? { borderBottomColor: accent, borderRightColor: accent } : {}),
    pointerEvents: 'none' as const,
  })

  return (
    <button
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        position: 'relative',
        background: bg,
        color: '#FBF1E2',
        border: '2px solid #221813',
        borderRadius: 8,
        padding: '32px 36px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'transform 220ms ease, box-shadow 220ms ease',
        overflow: 'hidden',
        minHeight: 340,
        boxShadow: active ? '0 10px 0 #221813' : '0 6px 0 #221813',
        transform: active ? 'scale(1.013) translateY(-2px)' : 'scale(1)',
        textAlign: 'left',
        width: '100%',
      }}
    >
      {/* diagonal stripes */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'repeating-linear-gradient(45deg, currentColor 0 2px, transparent 2px 14px)',
        opacity: dark ? 0.06 : 0.09,
        pointerEvents: 'none',
      }} />

      {/* top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <span style={{
          fontFamily: 'var(--font-alfa-slab-one), "Alfa Slab One", serif',
          fontSize: 18,
          letterSpacing: '0.06em',
          color: accent,
        }}>
          {number}
        </span>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          padding: '4px 10px',
          border: '1.5px solid currentColor',
          borderRadius: 999,
          opacity: 0.85,
        }}>
          {tagline}
        </span>
      </div>

      {/* center */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '20px 0', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-alfa-slab-one), "Alfa Slab One", serif',
          fontSize: 'clamp(48px, 7vw, 84px)',
          letterSpacing: '-0.02em',
          lineHeight: 0.95,
          fontWeight: 400,
          color: '#FBF1E2',
        }}>
          {label}
        </div>
        <div style={{ marginTop: 8, opacity: 0.95 }}>
          <span style={{
            fontFamily: 'var(--font-yellowtail), Yellowtail, cursive',
            fontSize: 'clamp(24px, 3vw, 36px)',
            color: accent,
          }}>
            {label}
          </span>
        </div>
      </div>

      {/* CTA */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px dashed currentColor' }}>
        <div style={{
          padding: '10px 20px',
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          border: '1.5px solid #221813',
          boxShadow: '0 3px 0 #221813',
          color: bg,
          background: accent,
          fontFamily: 'inherit',
        }}>
          Entrar →
        </div>
      </div>

      {/* corner notches */}
      <div style={notch(true,  true)}  />
      <div style={notch(true,  false)} />
      <div style={notch(false, true)}  />
      <div style={notch(false, false)} />
    </button>
  )
}

/* ─── Page ───────────────────────────────────────────────── */
export default function SelectModePage() {
  const router = useRouter()
  const [active, setActive] = useState<'r' | 't' | null>(null)
  const [username, setUsername] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.replace('/login'); return }
    const payload = parseTokenPayload()
    const name = payload?.name ?? payload?.nombre ?? payload?.username ?? payload?.email?.split('@')[0] ?? ''
    if (name) setUsername(name)
  }, [router])

  return (
    <div style={{
      width: '100%',
      minHeight: '100dvh',
      background: '#FBF1E2',
      fontFamily: '"DM Sans", var(--font-geist-sans), system-ui, sans-serif',
      color: '#221813',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ── Topbar ── */}
      <header
        className="split-stage-topbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 40px',
          background: '#221813',
          color: '#FBF1E2',
          flexShrink: 0,
          borderBottom: '3px solid #D8482A',
        }}
      >
        <span style={{
          fontFamily: 'var(--font-yellowtail), Yellowtail, cursive',
          fontSize: 30,
          color: '#FBF1E2',
          textShadow: '2px 2px 0 rgba(0,0,0,0.35)',
          lineHeight: 1,
          letterSpacing: '-0.01em',
        }}>
          Doble Chevron
        </span>

        <nav
          className="split-stage-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          {[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Admin',     href: '/admin' },
          ].map(({ label, href }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              style={{
                padding: '6px 12px',
                color: '#FBF1E2',
                background: 'none',
                border: 'none',
                opacity: 0.8,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                letterSpacing: 'inherit',
                fontWeight: 'inherit',
                textTransform: 'inherit' as const,
              }}
            >
              {label}
            </button>
          ))}
          <span style={{ opacity: 0.35, padding: '0 4px' }}>·</span>
          <button
            onClick={() => router.push('/logout')}
            style={{
              padding: '6px 12px',
              color: '#FBF1E2',
              background: 'none',
              border: 'none',
              opacity: 0.6,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              letterSpacing: 'inherit',
              fontWeight: 'inherit',
              textTransform: 'inherit' as const,
            }}
          >
            Cerrar sesión
          </button>
        </nav>
      </header>

      {/* ── Prompt ── */}
      <div style={{ textAlign: 'center', padding: '36px 20px 24px', flexShrink: 0 }}>
        <div style={{
          fontFamily: 'var(--font-yellowtail), Yellowtail, cursive',
          color: '#D8482A',
          fontSize: 22,
          lineHeight: 1,
        }}>
          {username ? `· Bienvenido, ${username} ·` : '· Bienvenido ·'}
        </div>
        <h1 style={{
          fontFamily: 'var(--font-alfa-slab-one), "Alfa Slab One", serif',
          fontSize: 'clamp(28px, 4vw, 44px)',
          margin: '6px 0 0',
          letterSpacing: '-0.01em',
          fontWeight: 400,
          color: '#221813',
        }}>
          Elige tu estación
        </h1>
      </div>

      {/* ── Split Stage ── */}
      <div
        className="split-stage-grid split-stage-padding"
        style={{ flex: 1, padding: '0 40px 40px', minHeight: 0 }}
      >
        <Panel
          number="N.º 01"
          label="Restaurant"
          tagline="Mesa & Mostrador"
          active={active === 'r'}
          onEnter={() => setActive('r')}
          onLeave={() => setActive(null)}
          onClick={() => router.push('/products')}
          dark={false}
        />

        {/* divider stamp */}
        <div
          className="split-stage-divider"
          style={{ width: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            background: '#FBF1E2',
            border: '2px solid #221813',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 0 #221813',
            flexShrink: 0,
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              border: '1.5px dashed #221813',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{
                fontFamily: 'var(--font-alfa-slab-one), "Alfa Slab One", serif',
                fontSize: 18,
                color: '#221813',
              }}>
                O
              </span>
            </div>
          </div>
        </div>

        <Panel
          number="N.º 02"
          label="Tienda"
          tagline="Stock & Escaneo"
          active={active === 't'}
          onEnter={() => setActive('t')}
          onLeave={() => setActive(null)}
          onClick={() => router.push('/almacen')}
          dark={true}
        />
      </div>
    </div>
  )
}
