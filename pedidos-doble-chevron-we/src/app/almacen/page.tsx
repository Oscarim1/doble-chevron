'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { HiPlus, HiMinus, HiSearch, HiX, HiTrash } from 'react-icons/hi'
import { MdQrCodeScanner } from 'react-icons/md'
import { useCart } from '../../context/CartContext'
import { fetchWithAuth, getApiUrl } from '@/utils/api'
import { useLoading } from '../../context/LoadingContext'
import { useCategorias } from '@/hooks/useCategorias'
import { getUserIdFromToken } from '@/utils/auth'
import DCTopbar from '../components/DCTopbar'
import { CartProvider } from '../../context/CartContext'

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

/* ── Style constants ─────────────────────────────────────── */
const catBtn = (active: boolean): React.CSSProperties => ({
  padding: '6px 14px',
  borderRadius: 999,
  border: '1.5px solid #221813',
  background: active ? '#221813' : '#FFFCF6',
  color: active ? '#FBF1E2' : '#221813',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  letterSpacing: '0.04em',
  boxShadow: active ? '0 2px 0 #000' : '0 2px 0 #221813',
  transition: 'all 70ms ease',
  whiteSpace: 'nowrap' as const,
})

const qtyBtn: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 8,
  border: '1.5px solid #221813',
  background: '#FFFCF6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 0,
  boxShadow: '0 1px 0 #221813',
  color: '#221813',
}

const cartQtyBtn: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 6,
  border: '1.5px solid #E5D5BA',
  background: '#F4E8D0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 0,
  color: '#221813',
}

const payBtn = (active: boolean): React.CSSProperties => ({
  padding: '10px',
  borderRadius: 10,
  border: `1.5px solid ${active ? '#D8482A' : '#221813'}`,
  background: active ? '#D8482A' : '#FFFCF6',
  color: active ? '#FBF1E2' : '#221813',
  fontWeight: 700,
  fontSize: 12,
  letterSpacing: '0.04em',
  cursor: 'pointer',
  fontFamily: 'inherit',
  boxShadow: `0 2px 0 ${active ? '#9A2A0F' : '#221813'}`,
  transition: 'all 70ms ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
})

export default function AlmacenPage() {
  return (
    <CartProvider storageKey="cart-tienda">
      <AlmacenContent />
    </CartProvider>
  )
}

function AlmacenContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [esEscaneo, setEsEscaneo] = useState(false)
  const lastKeystrokeTime = useRef(0)
  const fastKeystrokeCount = useRef(0)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [payment, setPayment] = useState<'efectivo' | 'tarjeta' | null>(null)
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const { items, addItem, removeItem, removeOne, clearCart } = useCart()
  const { setLoading } = useLoading()
  const { data: categorias } = useCategorias(undefined, 'tienda')

  const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0)
  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.replace('/login'); return }

    setLoading(true)
    const apiUrl = getApiUrl()
    fetchWithAuth(`${apiUrl}/api/products?locationType=tienda`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text() || 'Error cargando productos')
        return res.json()
      })
      .then((data) => setProducts(data))
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false))
  }, [router, setLoading])

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

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
    if (e.key === 'Enter' && busqueda.trim() && filteredProducts.length === 1) {
      const p = filteredProducts[0]
      addItem({ id: p.id, name: p.name, price: parseInt(p.price), image_url: p.image_url, category: p.category })
      setBusqueda('')
      setEsEscaneo(false)
      fastKeystrokeCount.current = 0
      searchInputRef.current?.focus()
    }
  }

  const handleClearSearch = () => {
    setBusqueda('')
    setEsEscaneo(false)
    fastKeystrokeCount.current = 0
    searchInputRef.current?.focus()
  }

  const filteredProducts = useMemo(() => {
    if (busqueda.trim()) {
      const t = busqueda.toLowerCase()
      return products.filter(p => p.name.toLowerCase().includes(t) || (p.barcode && p.barcode.toLowerCase().includes(t)))
    }
    if (!activeCategory) return products
    const activeCat = categorias.find(c => c.id === activeCategory)
    return products.filter(p => {
      if (p.category_id) return p.category_id === activeCategory
      return activeCat ? (p.category || '').trim().toLowerCase() === activeCat.slug : false
    })
  }, [products, busqueda, activeCategory, categorias])

  const handleConfirm = async () => {
    if (!payment || loadingOrder) return
    setLoadingOrder(true)
    setOrderError(null)
    try {
      const apiUrl = getApiUrl()
      const userId = getUserIdFromToken()
      if (!userId) throw new Error('No hay sesión activa. Por favor inicia sesión nuevamente.')

      const orderRes = await fetchWithAuth(`${apiUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          guest_name: null,
          total,
          points_used: 0,
          points_earned: 0,
          metodo_pago: payment,
          status: 'complete',
          is_active: true,
        }),
      })
      if (!orderRes.ok) throw new Error(await orderRes.text() || 'Error creando orden')
      const orderData = await orderRes.json()
      const orderId = orderData.id

      await Promise.all(
        items.map(item =>
          fetchWithAuth(`${apiUrl}/api/order-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId, product_id: item.id, quantity: item.quantity, price: item.price, is_active: true }),
          }).then(async res => { if (!res.ok) throw new Error(await res.text() || 'Error creando item') })
        )
      )

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setPayment(null)
        clearCart()
        searchInputRef.current?.focus()
      }, 2500)
    } catch (err) {
      console.error('Error confirmando pedido tienda:', err)
      setOrderError('No se pudo realizar la venta. Intente nuevamente.')
    } finally {
      setLoadingOrder(false)
    }
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#FBF1E2', color: '#C23A2E', fontWeight: 600, fontFamily: 'inherit' }}>
        {error}
      </div>
    )
  }

  return (
    <div style={{
      height: '100dvh',
      background: '#F4E8D0',
      fontFamily: '"DM Sans", var(--font-geist-sans), system-ui, sans-serif',
      color: '#221813',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <DCTopbar backHref="/select-mode" stationBadge="Tienda" />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* ── LEFT: Products ─────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16, gap: 12, minHeight: 0, overflow: 'hidden' }}>

          {/* Search / scanner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            background: '#FFFCF6',
            border: `1.5px solid ${esEscaneo ? '#2C7A45' : '#221813'}`,
            borderRadius: 12,
            boxShadow: `0 4px 0 ${esEscaneo ? '#2C7A45' : '#221813'}`,
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
          }}>
            {esEscaneo
              ? <MdQrCodeScanner style={{ color: '#2C7A45', fontSize: 20, flexShrink: 0 }} />
              : <HiSearch style={{ color: '#4A3A30', fontSize: 18, flexShrink: 0 }} />
            }
            <input
              ref={searchInputRef}
              type="text"
              value={busqueda}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              placeholder="Escanear código de barras o buscar producto..."
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontFamily: 'inherit',
                fontSize: 15,
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
                {filteredProducts.length === 1 ? 'Enter → agregar' : 'Escaneando...'}
              </span>
            )}
            {busqueda && (
              <button
                onClick={handleClearSearch}
                style={{
                  width: 28,
                  height: 28,
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
                <HiX size={14} />
              </button>
            )}
          </div>

          {/* Category filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setActiveCategory('')} style={catBtn(activeCategory === '')}>
              Todos
            </button>
            {categorias.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={catBtn(activeCategory === cat.id)}>
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product count */}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A3A30' }}>
            {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
          </div>

          {/* Products grid */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
              {filteredProducts.map(p => {
                const qty = items.find(i => i.id === p.id)?.quantity ?? 0
                return (
                  <div
                    key={p.id}
                    style={{
                      background: '#FFFCF6',
                      border: `1.5px solid ${qty > 0 ? '#D8482A' : '#221813'}`,
                      borderRadius: 12,
                      boxShadow: `0 4px 0 ${qty > 0 ? '#B83918' : '#221813'}`,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'box-shadow 80ms ease, border-color 80ms ease',
                    }}
                  >
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block', borderBottom: '1.5px solid #E5D5BA' }} />
                      : <div style={{ width: '100%', height: 90, background: '#F4E8D0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1.5px solid #E5D5BA' }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C5AE9E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                          </svg>
                        </div>
                    }
                    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <p style={{
                        fontFamily: 'var(--font-alfa-slab-one), "Alfa Slab One", serif',
                        fontWeight: 400,
                        fontSize: 14,
                        lineHeight: 1.1,
                        margin: '0 0 4px',
                        color: '#221813',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {p.name}
                      </p>
                      <p style={{
                        fontFamily: 'var(--font-alfa-slab-one), "Alfa Slab One", serif',
                        fontSize: 17,
                        color: '#D8482A',
                        margin: '0 0 8px',
                        lineHeight: 1,
                      }}>
                        ${parseInt(p.price).toLocaleString('es-CL')}
                      </p>
                      <div style={{ marginTop: 'auto' }}>
                        {qty > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FBF1E2', borderRadius: 8, padding: '5px 8px', border: '1px solid #E5D5BA' }}>
                            <button onClick={() => removeOne(p.id)} style={qtyBtn}><HiMinus size={11} /></button>
                            <span style={{ fontWeight: 800, fontSize: 13, color: '#221813', fontFamily: 'var(--font-alfa-slab-one), serif' }}>{qty}</span>
                            <button onClick={() => addItem({ id: p.id, name: p.name, price: parseInt(p.price), image_url: p.image_url, category: p.category })} style={qtyBtn}><HiPlus size={11} /></button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addItem({ id: p.id, name: p.name, price: parseInt(p.price), image_url: p.image_url, category: p.category })}
                            style={{
                              width: '100%',
                              padding: '7px',
                              borderRadius: 8,
                              border: '1.5px solid #221813',
                              background: '#221813',
                              color: '#FBF1E2',
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: 'pointer',
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              boxShadow: '0 2px 0 #000',
                              fontFamily: 'inherit',
                              transition: 'transform 65ms ease',
                            }}
                          >
                            + Agregar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {!filteredProducts.length && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 16px', color: '#4A3A30', fontSize: 14 }}>
                  {busqueda ? `Sin resultados para "${busqueda}"` : 'Sin productos en esta categoría'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Cart ────────────────────────────────────── */}
        <div style={{
          width: 300,
          borderLeft: '1.5px solid #221813',
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFCF6',
          flexShrink: 0,
          minHeight: 0,
        }}>
          {/* Cart header */}
          <div style={{
            padding: '14px 18px',
            background: '#221813',
            color: '#FBF1E2',
            borderBottom: '3px solid #D8482A',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  fontFamily: 'var(--font-alfa-slab-one), "Alfa Slab One", serif',
                  fontWeight: 400,
                  fontSize: 18,
                  letterSpacing: '-0.01em',
                }}>
                  Carrito
                </div>
                <div style={{
                  fontSize: 10,
                  color: 'rgba(251,241,226,0.6)',
                  marginTop: 2,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}>
                  {totalItems === 0 ? 'Vacío' : `${totalItems} ${totalItems === 1 ? 'producto' : 'productos'}`}
                </div>
              </div>
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#FF7A5C',
                    background: 'none',
                    border: '1.5px solid rgba(255,122,92,0.35)',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    padding: '4px 8px',
                  }}
                >
                  Vaciar
                </button>
              )}
            </div>
          </div>

          {/* Cart items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {success ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, textAlign: 'center', padding: 24 }}>
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: 999,
                  background: '#DCEFD9',
                  border: '1.5px solid #221813',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 0 #221813',
                }}>
                  <svg height={28} width={28} viewBox="0 0 24 24" fill="none">
                    <path d="M8 12l2.5 2.5L16 9" stroke="#2C7A45" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontFamily: 'var(--font-alfa-slab-one), serif', fontSize: 19, color: '#221813', margin: '0 0 4px' }}>¡Venta realizada!</p>
                  <p style={{ color: '#2C7A45', fontSize: 12, margin: 0, fontWeight: 600 }}>Pedido registrado correctamente</p>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, textAlign: 'center', padding: 24 }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  border: '1.5px solid #221813',
                  background: '#F4E8D0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 0 #221813',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#221813" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                </div>
                <p style={{ color: '#4A3A30', fontSize: 12, fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
                  Escanea o agrega<br />productos
                </p>
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} style={{
                  background: '#FFFCF6',
                  border: '1.5px solid #E5D5BA',
                  borderRadius: 10,
                  padding: 10,
                  display: 'flex',
                  gap: 8,
                }}>
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #E5D5BA', flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontWeight: 700,
                      fontSize: 12,
                      color: '#221813',
                      margin: '0 0 2px',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {item.name}
                    </p>
                    <p style={{ fontFamily: 'var(--font-alfa-slab-one), serif', fontSize: 14, color: '#D8482A', margin: '0 0 6px', lineHeight: 1 }}>
                      ${(item.price * item.quantity).toLocaleString('es-CL')}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => removeOne(item.id)} style={cartQtyBtn}><HiMinus size={10} /></button>
                      <span style={{ fontWeight: 800, fontSize: 12, color: '#221813', minWidth: 16, textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => addItem({ id: item.id, name: item.name, price: item.price, image_url: item.image_url, category: item.category })} style={cartQtyBtn}><HiPlus size={10} /></button>
                      <button onClick={() => removeItem(item.id)} style={{ ...cartQtyBtn, marginLeft: 'auto', background: 'transparent', border: 'none', color: '#C23A2E' }}>
                        <HiTrash size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout footer */}
          {!success && items.length > 0 && (
            <div style={{
              borderTop: '1.5px solid #221813',
              padding: '14px 16px',
              background: '#F4E8D0',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              flexShrink: 0,
            }}>
              {/* Total */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A3A30', paddingBottom: 4 }}>Total</span>
                <span style={{ fontFamily: 'var(--font-alfa-slab-one), "Alfa Slab One", serif', fontSize: 30, color: '#221813', lineHeight: 1 }}>
                  ${total.toLocaleString('es-CL')}
                </span>
              </div>

              {/* Payment */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button onClick={() => setPayment('efectivo')} style={payBtn(payment === 'efectivo')}>
                  💵 Efectivo
                </button>
                <button onClick={() => setPayment('tarjeta')} style={payBtn(payment === 'tarjeta')}>
                  💳 Tarjeta
                </button>
              </div>

              {/* Confirm */}
              <button
                onClick={handleConfirm}
                disabled={!payment || loadingOrder}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 10,
                  border: '1.5px solid #221813',
                  background: !payment || loadingOrder ? '#C5AE9E' : '#221813',
                  color: '#FBF1E2',
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: !payment || loadingOrder ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: !payment || loadingOrder ? 'none' : '0 4px 0 #000',
                  transition: 'all 70ms ease',
                }}
              >
                {loadingOrder ? 'Procesando...' : 'Confirmar pedido'}
              </button>

              {orderError && (
                <p style={{ color: '#C23A2E', fontSize: 11, textAlign: 'center', margin: 0 }}>{orderError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
