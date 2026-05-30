'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '../../context/CartContext'
import { useCartDrawer } from '../../context/CartDrawerContext'
import { fetchWithAuth, getApiUrl } from '@/utils/api'
import { generateSinglePDF, Order } from '@/utils/pdfUtils'
import { getUserIdFromToken } from '@/utils/auth'
import { format } from 'date-fns'

export default function CartDrawer() {
  const { items, addItem, removeItem, removeOne, updateDetail, clearCart } = useCart()
  const { isOpen, closeDrawer } = useCartDrawer()
  const router = useRouter()
  const modalRef = useRef<HTMLDivElement>(null)

  const [payment, setPayment] = useState<'efectivo' | 'tarjeta' | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0)
  const totalQty = items.reduce((acc, i) => acc + i.quantity, 0)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer()
    }
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        closeDrawer()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = ''
    }
  }, [isOpen, closeDrawer])

  useEffect(() => {
    if (!isOpen) {
      setPayment(null)
      setError(null)
      setSuccess(false)
    }
  }, [isOpen])

  function downloadTicket(order: Order, metodoPago: 'efectivo' | 'tarjeta') {
    const now = format(new Date(), 'yyyyMMdd_HHmm')
    const doc = generateSinglePDF(order, 'Doble Chevron', metodoPago)
    doc.save(`pedido_${order.order_number}_${now}.pdf`)
  }

  const handleConfirm = async () => {
    if (!payment || loading) return
    setLoading(true)
    setError(null)
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
      if (!orderRes.ok) {
        const txt = await orderRes.text()
        throw new Error(txt || 'Error creando orden')
      }
      const orderData = await orderRes.json()
      const orderId = orderData.id

      await Promise.all(
        items.map((item) =>
          fetchWithAuth(`${apiUrl}/api/order-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: orderId,
              product_id: item.id,
              quantity: item.quantity,
              price: item.price,
              is_active: true,
            }),
          }).then(async (res) => {
            if (!res.ok) {
              const t = await res.text()
              throw new Error(t || 'Error creando item')
            }
          })
        )
      )

      const order: Order = {
        id: orderId,
        order_number: orderData.order_number ?? orderId,
        total,
        created_at: orderData.created_at ?? new Date().toISOString(),
        order_items: items.map((i) => ({
          id: i.id,
          quantity: i.quantity,
          price: i.price,
          detail: i.detail,
          products: { name: i.name, category: i.category, points: 0 },
        })),
      }

      downloadTicket(order, payment!)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        closeDrawer()
        router.push('/products')
        clearCart()
      }, 2000)
    } catch (err) {
      setError((err as Error).message || 'Error procesando pedido')
    } finally {
      setLoading(false)
    }
  }

  const disabled = !payment || loading

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(34,24,19,0.62)' }}
        aria-hidden={!isOpen}
      />

      {/* Centering container */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ padding: 28 }}
      >
        {/* Modal */}
        <div
          ref={modalRef}
          className={`w-full flex flex-col transform transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          style={{
            maxWidth: 540,
            maxHeight: 'calc(100vh - 56px)',
            background: 'var(--dc-cream, #FBF1E2)',
            border: '2px solid var(--dc-ink, #221813)',
            borderRadius: 18,
            boxShadow: '0 10px 0 var(--dc-ink, #221813), 0 30px 60px -20px rgba(0,0,0,0.55)',
            overflow: 'hidden',
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Carrito de compras"
        >
          {/* ── Header ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 13,
            padding: '17px 20px',
            background: 'var(--dc-ink, #221813)',
            color: 'var(--dc-cream, #FBF1E2)',
            flexShrink: 0,
            position: 'relative',
          }}>
            {/* Cart icon badge */}
            <div style={{
              width: 40, height: 40, flexShrink: 0, borderRadius: 11,
              background: 'var(--dc-orange, #D8482A)',
              border: '1.5px solid rgba(0,0,0,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
                stroke="var(--dc-cream, #FBF1E2)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>
              </svg>
            </div>

            {/* Titles */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-alfa-slab-one, serif)', fontWeight: 400, fontSize: 22, lineHeight: 1 }}>
                Carrito de compras
              </div>
              <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#F3D58A' }}>
                {totalQty === 0
                  ? 'Sin productos'
                  : `${totalQty} ${totalQty === 1 ? 'producto' : 'productos'}`}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={closeDrawer}
              style={{
                width: 38, height: 38, flexShrink: 0, borderRadius: 10,
                background: 'rgba(251,241,226,0.07)',
                border: '1.5px solid rgba(251,241,226,0.28)',
                color: 'var(--dc-cream, #FBF1E2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
              className="cart-close-btn"
              aria-label="Cerrar carrito"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18"/>
              </svg>
            </button>

            {/* Orange accent bottom line */}
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: 'var(--dc-orange, #D8482A)' }} />
          </div>

          {/* ── Item list ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {success ? (
              /* Success state */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 28px', gap: 16 }}>
                <svg height={72} width={72} viewBox="0 0 24 24" fill="none">
                  <circle cx={12} cy={12} r={12} fill="#4ade80"/>
                  <path d="M8 12l2.5 2.5L16 9" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div style={{ fontFamily: 'var(--font-alfa-slab-one, serif)', fontSize: 26, color: 'var(--dc-ink, #221813)' }}>
                  ¡Pedido confirmado!
                </div>
                <p style={{ margin: 0, color: '#7a6a60', fontSize: 15, textAlign: 'center' }}>
                  Tu ticket está siendo descargado...
                </p>
              </div>
            ) : items.length === 0 ? (
              /* Empty state */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 28px', gap: 14, textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 16,
                  border: '1.5px solid rgba(34,24,19,0.15)',
                  background: 'rgba(34,24,19,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
                    stroke="rgba(34,24,19,0.35)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>
                  </svg>
                </div>
                <p style={{ margin: 0, color: 'rgba(34,24,19,0.5)', fontSize: 14, lineHeight: 1.5 }}>
                  El carrito está vacío.<br/>Agrega productos para comenzar.
                </p>
                <button
                  onClick={closeDrawer}
                  style={{
                    marginTop: 8, padding: '10px 24px',
                    background: 'var(--dc-orange, #D8482A)', color: 'var(--dc-cream, #FBF1E2)',
                    border: '1.5px solid var(--dc-ink, #221813)',
                    borderRadius: 10, fontFamily: 'inherit', fontWeight: 700, fontSize: 14,
                    boxShadow: '0 3px 0 var(--dc-ink, #221813)', cursor: 'pointer',
                  }}
                >
                  Explorar productos
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: '#FFFCF6',
                    border: '1.5px solid var(--dc-ink, #221813)',
                    borderRadius: 14,
                    boxShadow: '0 4px 0 var(--dc-ink, #221813)',
                    padding: '14px 15px 13px',
                    display: 'flex', flexDirection: 'column', gap: 12,
                  }}
                >
                  {/* Top row: name + unit price + line total */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2, color: 'var(--dc-ink, #221813)' }}>
                        {item.name}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 12.5, color: 'rgba(34,24,19,0.5)' }}>
                        <b style={{ color: 'var(--dc-orange, #D8482A)', fontWeight: 700 }}>
                          ${item.price.toLocaleString('es-CL')}
                        </b>{' '}c/u
                      </div>
                    </div>
                    <div style={{
                      flexShrink: 0, textAlign: 'right',
                      fontFamily: 'var(--font-alfa-slab-one, serif)', fontWeight: 400,
                      fontSize: 24, lineHeight: 1,
                      color: 'var(--dc-ink, #221813)',
                    }}>
                      ${(item.price * item.quantity).toLocaleString('es-CL')}
                    </div>
                  </div>

                  {/* Note input */}
                  <div style={{ position: 'relative' }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                      stroke="rgba(34,24,19,0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                    </svg>
                    <input
                      type="text"
                      value={item.detail || ''}
                      onChange={(e) => updateDetail(item.id, e.target.value)}
                      placeholder="Nota (ej: sin cebolla)"
                      maxLength={60}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        fontFamily: 'inherit', fontSize: 13.5,
                        color: 'var(--dc-ink, #221813)',
                        background: 'var(--dc-cream, #FBF1E2)',
                        border: '1.5px dashed rgba(34,24,19,0.2)',
                        borderRadius: 9,
                        padding: '9px 12px 9px 36px',
                        outline: 'none',
                        transition: 'border-color 130ms ease, box-shadow 130ms ease, background 130ms ease',
                      }}
                      onFocus={(e) => {
                        e.target.style.background = '#FFFCF6'
                        e.target.style.borderStyle = 'solid'
                        e.target.style.borderColor = 'var(--dc-orange, #D8482A)'
                        e.target.style.boxShadow = '0 0 0 3px rgba(216,72,42,0.16)'
                      }}
                      onBlur={(e) => {
                        e.target.style.background = 'var(--dc-cream, #FBF1E2)'
                        e.target.style.borderStyle = 'dashed'
                        e.target.style.borderColor = 'rgba(34,24,19,0.2)'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>

                  {/* Bottom row: stepper + delete */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    {/* Stepper pill */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: '#FCEEEA',
                      border: '1.5px solid var(--dc-orange, #D8482A)',
                      borderRadius: 999, padding: 3,
                    }}>
                      <button
                        onClick={() => removeOne(item.id)}
                        style={{
                          width: 32, height: 32, flexShrink: 0, borderRadius: 999, border: 'none',
                          background: 'var(--dc-orange, #D8482A)', color: 'var(--dc-cream, #FBF1E2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                        aria-label="Quitar uno"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                          <path d="M5 12h14"/>
                        </svg>
                      </button>
                      <span style={{ minWidth: 30, textAlign: 'center', fontWeight: 800, fontSize: 16, color: 'var(--dc-ink, #221813)' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => addItem({
                          id: item.id, name: item.name, price: item.price,
                          image_url: item.image_url, category: item.category,
                        })}
                        style={{
                          width: 32, height: 32, flexShrink: 0, borderRadius: 999, border: 'none',
                          background: 'var(--dc-orange, #D8482A)', color: 'var(--dc-cream, #FBF1E2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                        aria-label="Agregar uno"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                          <path d="M12 5v14M5 12h14"/>
                        </svg>
                      </button>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        background: 'none', border: '1.5px solid transparent', borderRadius: 9,
                        color: '#C23A2E', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                        padding: '7px 11px', cursor: 'pointer',
                        transition: 'background 130ms ease, border-color 130ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F7D9D5'
                        e.currentTarget.style.borderColor = '#C23A2E'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'none'
                        e.currentTarget.style.borderColor = 'transparent'
                      }}
                      aria-label="Eliminar producto"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                      </svg>
                      Quitar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Footer ── */}
          {!success && items.length > 0 && (
            <div style={{ flexShrink: 0, borderTop: '2px solid var(--dc-ink, #221813)', background: '#F7E8D0' }}>
              {/* Total row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '14px 20px 12px' }}>
                <button
                  onClick={clearCart}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    background: 'none', border: 'none',
                    color: 'var(--dc-orange, #D8482A)', fontFamily: 'inherit',
                    fontSize: 13.5, fontWeight: 700, padding: '4px 2px', cursor: 'pointer',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                  </svg>
                  Vaciar carrito
                </button>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(34,24,19,0.5)' }}>
                    Total a pagar
                  </span>
                  <span style={{ fontFamily: 'var(--font-alfa-slab-one, serif)', fontWeight: 400, fontSize: 34, lineHeight: 1, color: 'var(--dc-ink, #221813)' }}>
                    ${total.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>

              {/* Payment + confirm */}
              <div style={{ padding: '4px 20px 18px' }}>
                <p style={{ margin: '0 0 9px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(34,24,19,0.5)' }}>
                  Método de pago
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11, marginBottom: 13 }}>
                  {(['efectivo', 'tarjeta'] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPayment(method)}
                      style={{
                        height: 52, borderRadius: 11,
                        border: '1.5px solid var(--dc-ink, #221813)',
                        background: payment === method ? 'var(--dc-orange, #D8482A)' : '#FFFCF6',
                        color: payment === method ? 'var(--dc-cream, #FBF1E2)' : 'var(--dc-ink, #221813)',
                        fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                        boxShadow: '0 3px 0 var(--dc-ink, #221813)',
                        cursor: 'pointer',
                        transition: 'transform 120ms ease, box-shadow 120ms ease, background 120ms ease',
                      }}
                    >
                      {method === 'efectivo' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="6" width="20" height="12" rx="2"/>
                          <circle cx="12" cy="12" r="2.5"/>
                          <path d="M6 12h.01M18 12h.01"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="5" width="20" height="14" rx="2"/>
                          <path d="M2 10h20M6 15h4"/>
                        </svg>
                      )}
                      {method === 'efectivo' ? 'Efectivo' : 'Tarjeta'}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleConfirm}
                  disabled={disabled}
                  style={{
                    width: '100%', height: 56, borderRadius: 12,
                    border: `1.5px solid ${disabled ? '#D9B3A4' : 'var(--dc-ink, #221813)'}`,
                    background: disabled ? '#EBC3B5' : 'var(--dc-orange, #D8482A)',
                    color: 'var(--dc-cream, #FBF1E2)',
                    fontFamily: 'inherit', fontSize: 16, fontWeight: 800, letterSpacing: '0.01em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: `0 4px 0 ${disabled ? '#D9B3A4' : 'var(--dc-ink, #221813)'}`,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'transform 120ms ease, box-shadow 120ms ease',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5 9-9"/>
                  </svg>
                  {loading ? 'Procesando pedido...' : 'Confirmar pedido'}
                </button>

                {error && (
                  <p style={{ margin: '10px 0 0', color: '#C23A2E', fontSize: 13, textAlign: 'center' }}>
                    {error}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .cart-close-btn:hover {
          background: var(--dc-orange, #D8482A) !important;
          border-color: var(--dc-orange, #D8482A) !important;
          transform: rotate(90deg);
        }
      `}</style>
    </>
  )
}
