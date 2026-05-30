'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { HiPlus, HiMinus, HiShoppingCart, HiSearch, HiX } from 'react-icons/hi'
import { MdQrCodeScanner } from 'react-icons/md'
import { useCart } from '../../context/CartContext'
import { useCartDrawer } from '../../context/CartDrawerContext'
import { fetchWithAuth, getApiUrl } from '@/utils/api'
import { useLoading } from '../../context/LoadingContext'
import { useCategorias } from '@/hooks/useCategorias'
import DCTopbar from '../components/DCTopbar'
import { CartProvider } from '../../context/CartContext'
import CartDrawer from '../components/CartDrawer'

interface Product {
  id: string
  name: string
  price: string
  points: number
  image_url?: string
  description: string
  category: string
  category_id?: string | null
  category_info?: {
    id: string
    name: string
    slug: string
    parent_id: string | null
    parent_name: string | null
  } | null
  barcode?: string
}

const SCANNER_THRESHOLD_MS = 50
const SCANNER_MIN_CHARS = 3

export default function ProductsPage() {
  return (
    <CartProvider storageKey="cart-restaurant">
      <CartDrawer />
      <ProductsContent />
    </CartProvider>
  )
}

function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [esEscaneo, setEsEscaneo] = useState(false)
  const lastKeystrokeTime = useRef(0)
  const fastKeystrokeCount = useRef(0)
  const router = useRouter()
  const { items, addItem, getQuantity, removeOne } = useCart()
  const { openDrawer } = useCartDrawer()
  const { setLoading } = useLoading()
  const { data: categorias } = useCategorias(undefined, 'restaurante')

  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.replace('/login'); return }

    setLoading(true)
    const apiUrl = getApiUrl()
    fetchWithAuth(`${apiUrl}/api/products?locationType=restaurante`)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || 'Request failed')
        }
        return res.json()
      })
      .then((data) => setProducts(data))
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false))
  }, [router, setLoading])

  useEffect(() => {
    if (categorias.length > 0 && !activeCategory) setActiveCategory(categorias[0].id)
  }, [categorias, activeCategory])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const now = Date.now()
    const diff = now - lastKeystrokeTime.current
    lastKeystrokeTime.current = now
    if (diff < SCANNER_THRESHOLD_MS) {
      fastKeystrokeCount.current += 1
      if (fastKeystrokeCount.current >= SCANNER_MIN_CHARS) setEsEscaneo(true)
    } else {
      fastKeystrokeCount.current = 0
      setEsEscaneo(false)
    }
    setBusqueda(e.target.value)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && esEscaneo && busqueda.trim() && filteredProducts.length === 1) {
      const p = filteredProducts[0]
      addItem({ id: p.id, name: p.name, price: parseInt(p.price), image_url: p.image_url, category: p.category })
      setBusqueda('')
      setEsEscaneo(false)
      fastKeystrokeCount.current = 0
    }
  }

  const handleClearSearch = () => {
    setBusqueda('')
    setEsEscaneo(false)
    fastKeystrokeCount.current = 0
  }

  const filteredProducts = useMemo(() => {
    if (busqueda.trim()) {
      const t = busqueda.toLowerCase()
      return products.filter(p => p.name.toLowerCase().includes(t) || (p.barcode && p.barcode.toLowerCase().includes(t)))
    }
    const activeCat = categorias.find(c => c.id === activeCategory)
    return products.filter(p => {
      if (p.category_id) return p.category_id === activeCategory
      return activeCat ? (p.category || '').trim().toLowerCase() === activeCat.slug : false
    })
  }, [products, busqueda, activeCategory, categorias])

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#FBF1E2', color: '#C23A2E', fontWeight: 600, fontFamily: 'inherit' }}>
        {error}
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#FBF1E2',
      fontFamily: '"DM Sans", var(--font-geist-sans), system-ui, sans-serif',
      color: '#221813',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <DCTopbar backHref="/select-mode" stationBadge="Restaurant" />

      {/* ── Main content ─────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

        {/* ── LEFT: Category sidebar ───────────────────────── */}
        <aside style={{
          width: 200,
          borderRight: '1.5px solid #221813',
          background: '#FFFCF6',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: 'calc(100dvh - 51px)',
          overflowY: 'auto',
        }}>
          <div style={{ padding: '16px 14px 12px', borderBottom: '1.5px solid #E5D5BA' }}>
            <div style={{
              fontFamily: 'var(--font-alfa-slab-one), "Alfa Slab One", serif',
              fontWeight: 400,
              fontSize: 13,
              letterSpacing: '0.02em',
              color: '#221813',
              marginBottom: 2,
            }}>
              Menú
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A3A30' }}>
              {products.length} productos
            </div>
          </div>
          <nav style={{ padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {categorias.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setBusqueda(''); setEsEscaneo(false) }}
                style={{
                  padding: '9px 12px',
                  borderRadius: 9,
                  border: '1.5px solid transparent',
                  background: activeCategory === cat.id ? '#221813' : 'transparent',
                  color: activeCategory === cat.id ? '#FBF1E2' : '#221813',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  letterSpacing: '0.01em',
                  textAlign: 'left',
                  transition: 'all 70ms ease',
                  borderColor: activeCategory === cat.id ? '#221813' : 'transparent',
                  width: '100%',
                }}
              >
                {cat.name}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── RIGHT: Products area ─────────────────────────── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Search bar */}
          <div style={{ padding: '14px 20px', borderBottom: '1.5px solid #E5D5BA', background: '#FFFCF6', flexShrink: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '11px 16px',
              background: '#FBF1E2',
              border: `1.5px solid ${esEscaneo ? '#2C7A45' : '#221813'}`,
              borderRadius: 12,
              boxShadow: `0 3px 0 ${esEscaneo ? '#2C7A45' : '#221813'}`,
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
            }}>
              {esEscaneo
                ? <MdQrCodeScanner style={{ color: '#2C7A45', fontSize: 19, flexShrink: 0 }} />
                : <HiSearch style={{ color: '#4A3A30', fontSize: 17, flexShrink: 0 }} />
              }
              <input
                type="text"
                value={busqueda}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                placeholder="Buscar producto o escanear código..."
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  color: '#221813',
                  flex: 1,
                  minWidth: 0,
                }}
              />
              {esEscaneo && busqueda && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: '#DCEFD9',
                  color: '#2C7A45',
                  border: '1.5px solid #2C7A45',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  {filteredProducts.length === 1 ? 'Enter → agregar' : 'Escáner activo'}
                </span>
              )}
              {busqueda && (
                <button
                  onClick={handleClearSearch}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    border: '1.5px solid #E5D5BA',
                    background: '#F4E8D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0,
                    flexShrink: 0,
                    color: '#4A3A30',
                  }}
                >
                  <HiX size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Category title + products grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {!busqueda && activeCategory && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: 'var(--font-yellowtail), Yellowtail, cursive', fontSize: 22, color: '#D8482A', lineHeight: 1, marginBottom: 4 }}>
                  · {categorias.find(c => c.id === activeCategory)?.name ?? ''} ·
                </div>
                <div style={{ height: 0, borderTop: '1.5px dashed #E5D5BA' }} />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {filteredProducts.map(p => {
                const quantity = getQuantity ? getQuantity(p.id) : 0
                return (
                  <div
                    key={p.id}
                    style={{
                      background: '#FFFCF6',
                      border: `1.5px solid ${quantity > 0 ? '#D8482A' : '#221813'}`,
                      borderRadius: 12,
                      boxShadow: `0 4px 0 ${quantity > 0 ? '#B83918' : '#221813'}`,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'box-shadow 80ms ease, border-color 80ms ease',
                    }}
                  >
                    {/* Image */}
                    <div style={{ position: 'relative', height: 160, background: '#F4E8D0', overflow: 'hidden', borderBottom: '1.5px solid #E5D5BA' }}>
                      {p.image_url
                        ? <img
                            src={p.image_url}
                            alt={p.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C5AE9E" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
                            </svg>
                          </div>
                      }
                      {quantity > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          width: 26,
                          height: 26,
                          borderRadius: 999,
                          background: '#D8482A',
                          border: '1.5px solid #221813',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-alfa-slab-one), serif',
                          fontSize: 13,
                          color: '#FBF1E2',
                          boxShadow: '0 2px 0 #221813',
                        }}>
                          {quantity}
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h3 style={{
                        fontFamily: 'var(--font-alfa-slab-one), "Alfa Slab One", serif',
                        fontWeight: 400,
                        fontSize: 16,
                        lineHeight: 1.1,
                        margin: '0 0 4px',
                        color: '#221813',
                        letterSpacing: '-0.01em',
                      }}>
                        {p.name}
                      </h3>
                      {p.description && (
                        <p style={{
                          fontSize: 12,
                          color: '#4A3A30',
                          margin: '0 0 10px',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {p.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10, borderTop: '1px dashed #E5D5BA' }}>
                        <span style={{
                          fontFamily: 'var(--font-alfa-slab-one), "Alfa Slab One", serif',
                          fontSize: 20,
                          color: '#D8482A',
                          lineHeight: 1,
                        }}>
                          ${parseInt(p.price).toLocaleString('es-CL')}
                        </span>
                        {quantity > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FBF1E2', borderRadius: 8, padding: '5px 8px', border: '1px solid #E5D5BA' }}>
                            <button
                              onClick={() => removeOne(p.id)}
                              style={{
                                width: 26, height: 26, borderRadius: 8, border: '1.5px solid #221813',
                                background: '#FFFCF6', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', cursor: 'pointer', padding: 0, boxShadow: '0 1px 0 #221813',
                              }}
                              aria-label="Quitar uno"
                            >
                              <HiMinus size={11} />
                            </button>
                            <span style={{ fontFamily: 'var(--font-alfa-slab-one), serif', fontWeight: 400, fontSize: 15, color: '#221813', minWidth: 18, textAlign: 'center' }}>
                              {quantity}
                            </span>
                            <button
                              onClick={() => addItem({ id: p.id, name: p.name, price: parseInt(p.price), image_url: p.image_url, category: p.category })}
                              style={{
                                width: 26, height: 26, borderRadius: 8, border: '1.5px solid #221813',
                                background: '#221813', color: '#FBF1E2', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', cursor: 'pointer', padding: 0, boxShadow: '0 1px 0 #000',
                              }}
                              aria-label="Agregar uno más"
                            >
                              <HiPlus size={11} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addItem({ id: p.id, name: p.name, price: parseInt(p.price), image_url: p.image_url, category: p.category })}
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              border: '1.5px solid #221813',
                              background: '#D8482A',
                              color: '#FBF1E2',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              padding: 0,
                              boxShadow: '0 3px 0 #221813',
                              transition: 'transform 65ms ease, box-shadow 65ms ease',
                            }}
                            aria-label={`Agregar ${p.name}`}
                          >
                            <HiPlus size={17} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {!filteredProducts.length && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '64px 16px' }}>
                  <div style={{
                    width: 60,
                    height: 60,
                    borderRadius: 14,
                    border: '1.5px solid #221813',
                    background: '#F4E8D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px',
                    boxShadow: '0 3px 0 #221813',
                  }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#221813" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </div>
                  <p style={{ fontFamily: 'var(--font-alfa-slab-one), serif', fontSize: 18, color: '#221813', margin: '0 0 6px' }}>Sin resultados</p>
                  <p style={{ color: '#4A3A30', fontSize: 13, margin: 0 }}>
                    {busqueda ? `No se encontraron productos para "${busqueda}"` : 'No hay productos en esta categoría'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── Floating Cart ──────────────────────────────────── */}
      {totalItems > 0 && (
        <button
          onClick={openDrawer}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 20px',
            background: '#221813',
            color: '#FBF1E2',
            border: '1.5px solid #221813',
            borderRadius: 999,
            boxShadow: '0 6px 0 #000, 0 12px 32px rgba(0,0,0,0.25)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'transform 70ms ease, box-shadow 70ms ease',
            zIndex: 30,
          }}
        >
          <HiShoppingCart size={22} />
          <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.04em' }}>
            {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
          </span>
          <span style={{
            background: '#D8482A',
            color: '#FBF1E2',
            borderRadius: 999,
            padding: '2px 8px',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.04em',
            border: '1.5px solid rgba(251,241,226,0.3)',
          }}>
            Ver carrito →
          </span>
        </button>
      )}
    </div>
  )
}
