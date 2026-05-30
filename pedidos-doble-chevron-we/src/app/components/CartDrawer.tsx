'use client'
import { useEffect, useRef, useState } from 'react'
import { HiX, HiTrash, HiMinus, HiPlus } from 'react-icons/hi'
import { useRouter } from 'next/navigation'
import { useCart } from '../../context/CartContext'
import { useCartDrawer } from '../../context/CartDrawerContext'
import { fetchWithAuth, getApiUrl } from '@/utils/api'
import { generateSinglePDF, Order } from '@/utils/pdfUtils'
import { getUserIdFromToken } from '@/utils/auth'
import { format } from 'date-fns'

export default function CartDrawer() {
  const { items, addItem, removeItem, removeOne, clearCart } = useCart()
  const { isOpen, closeDrawer } = useCartDrawer()
  const router = useRouter()
  const modalRef = useRef<HTMLDivElement>(null)

  const [payment, setPayment] = useState<'efectivo' | 'tarjeta' | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0)

  // Close on Escape key or click outside
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

  // Reset state when modal closes
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
      const apiUrl = getApiUrl();
      const userId = getUserIdFromToken()
      if (!userId) {
        throw new Error('No hay sesión activa. Por favor inicia sesión nuevamente.')
      }
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

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-hidden={!isOpen}
      />

      {/* Modal Container */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Modal */}
        <div
          ref={modalRef}
          className={`bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300
            ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          aria-label="Carrito de compras"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b bg-gradient-to-r from-orange-50 to-yellow-50 rounded-t-3xl">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🛒</span>
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Carrito de compras</h2>
                <p className="text-sm text-gray-500">
                  {items.length === 0
                    ? 'Sin productos'
                    : `${items.reduce((acc, i) => acc + i.quantity, 0)} productos`}
                </p>
              </div>
            </div>
            <button
              onClick={closeDrawer}
              className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-full"
              aria-label="Cerrar carrito"
            >
              <HiX size={28} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {success ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <svg height={80} width={80} viewBox="0 0 24 24" fill="none">
                  <circle cx={12} cy={12} r={12} fill="#4ade80" />
                  <path
                    d="M8 12l2.5 2.5L16 9"
                    stroke="#fff"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h3 className="text-3xl font-bold text-gray-800">¡Pedido confirmado!</h3>
                <p className="text-gray-500 text-center text-lg">
                  Tu ticket está siendo descargado...
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <span className="text-8xl">🛒</span>
                <p className="text-xl font-semibold text-gray-500">Tu carrito está vacío</p>
                <p className="text-gray-400">Agrega productos para comenzar</p>
                <button
                  onClick={closeDrawer}
                  className="mt-4 px-8 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition text-lg"
                >
                  Explorar productos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex gap-4"
                  >
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-xl border border-orange-100"
                      />
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <p className="font-bold text-gray-900 truncate">{item.name}</p>
                        <p className="text-sm text-gray-400">
                          ${item.price.toLocaleString('es-CL')} c/u
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeOne(item.id)}
                            className="bg-orange-100 hover:bg-orange-200 text-orange-500 rounded-full p-2 transition"
                            aria-label="Quitar uno"
                          >
                            <HiMinus size={16} />
                          </button>
                          <span className="font-bold text-gray-900 min-w-[24px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              addItem({
                                id: item.id,
                                name: item.name,
                                price: item.price,
                                image_url: item.image_url,
                                category: item.category,
                              })
                            }
                            className="bg-orange-100 hover:bg-orange-200 text-orange-500 rounded-full p-2 transition"
                            aria-label="Agregar uno"
                          >
                            <HiPlus size={16} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-400 hover:text-red-600 transition p-2 hover:bg-red-50 rounded-full"
                          aria-label="Eliminar producto"
                        >
                          <HiTrash size={20} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-center">
                      <span className="font-extrabold text-gray-800 text-lg">
                        ${(item.price * item.quantity).toLocaleString('es-CL')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Checkout */}
          {!success && items.length > 0 && (
            <div className="border-t bg-gray-50 p-6 rounded-b-3xl space-y-4">
              {/* Total and clear */}
              <div className="flex items-center justify-between">
                <button
                  onClick={clearCart}
                  className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition"
                >
                  Vaciar carrito
                </button>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total a pagar</p>
                  <p className="text-3xl font-extrabold text-gray-900">
                    ${total.toLocaleString('es-CL')}
                  </p>
                </div>
              </div>

              {/* Payment methods */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPayment('efectivo')}
                  className={`py-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all duration-75
                    ${
                      payment === 'efectivo'
                        ? 'bg-orange-500 text-white border-orange-500 shadow-lg scale-[1.02]'
                        : 'bg-white text-orange-500 border-orange-200 hover:bg-orange-50'
                    }`}
                >
                  💵 Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setPayment('tarjeta')}
                  className={`py-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all duration-75
                    ${
                      payment === 'tarjeta'
                        ? 'bg-orange-500 text-white border-orange-500 shadow-lg scale-[1.02]'
                        : 'bg-white text-orange-500 border-orange-200 hover:bg-orange-50'
                    }`}
                >
                  💳 Tarjeta
                </button>
              </div>

              {/* Confirm button */}
              <button
                className={`w-full py-4 rounded-xl text-lg font-bold bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg hover:from-orange-500 hover:to-orange-600 transition
                  ${!payment || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!payment || loading}
                onClick={handleConfirm}
              >
                {loading ? 'Procesando pedido...' : 'Confirmar pedido'}
              </button>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
