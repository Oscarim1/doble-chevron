'use client'
import { useCart } from '../../context/CartContext'
import { HiTrash, HiMinus, HiPlus } from 'react-icons/hi'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithAuth, getApiUrl } from '@/utils/api'
import { generatePDF, Order } from '@/utils/pdfUtils'
import { getUserIdFromToken } from '@/utils/auth'
import { format } from 'date-fns'

export default function CartPage() {
  const { items, addItem, removeItem, removeOne, clearCart } = useCart()
  const router = useRouter()
  const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0)
  const [payment, setPayment] = useState<'efectivo' | 'tarjeta' | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // --- Nueva función para generar y descargar ambos PDFs en el front ---
  function generatePDFs(order: Order) {
    const now = format(new Date(), 'yyyyMMdd_HHmm');
    const dobleChevron = order.order_items.filter((i) =>
      i.products.category.toLowerCase().includes('dobleChevron'),
    );
    const others = order.order_items.filter(
      (i) => !i.products.category.toLowerCase().includes('dobleChevron'),
    );

    if (dobleChevron.length) {
      const doc = generatePDF(order, dobleChevron, 'Doble Chevron');
      doc.save(`pedido_${order.order_number}_dobleChevron_${now}.pdf`);
    }

    if (others.length) {
      const doc = generatePDF(order, others, 'Doble Chevron');
      doc.save(`pedido_${order.order_number}_otros_${now}.pdf`);
    }
  }

  // Lógica de confirmación de pedido
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

      clearCart()
      setSuccess(true)
      // Genera los PDFs y los descarga
      generatePDFs(order)

      setTimeout(() => {
        setSuccess(false)
        router.push('/products')
      }, 2000)
    } catch (err) {
      setError((err as Error).message || 'Error procesando pedido')
    } finally {
      setLoading(false)
    }
  }

  // Renderiza carrito si no hay items
  if (!items.length && !success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100">
        <p className="text-lg text-gray-700">Tu carrito está vacío.</p>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 py-6 px-1 sm:px-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {/* Encabezado */}
          <div className="mt-2 mb-1 px-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-black text-center">Carrito de compras</h1>
          </div>

          {/* Lista de productos */}
          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="bg-white/95 border border-orange-100 rounded-2xl shadow px-3 py-3 flex flex-col sm:flex-row items-center gap-3"
              >
                <div className="flex flex-row items-center gap-3 w-full">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg border border-orange-50 shadow"
                    />
                  )}
                  <div className="flex flex-col w-full">
                    <span className="font-bold text-base sm:text-lg text-gray-900">{item.name}</span>
                    <span className="text-xs text-gray-400">
                      Precio unitario: ${item.price.toLocaleString('es-CL')}
                    </span>
                    <div className="flex items-center gap-3 mt-2 justify-center sm:justify-start">
                      <button
                        onClick={() => removeOne(item.id)}
                        className="bg-orange-100 hover:bg-orange-200 text-orange-500 rounded-full p-2 transition"
                        aria-label="Quitar uno"
                      >
                        <HiMinus size={20} />
                      </button>
                      <span className="font-bold text-lg text-gray-900 min-w-[28px] text-center">
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
                        <HiPlus size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-auto sm:ml-0 mt-2 sm:mt-0">
                    <span className="font-bold text-lg sm:text-xl text-gray-800">
                      ${(item.price * item.quantity).toLocaleString('es-CL')}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-red-50 text-red-500 font-bold hover:bg-red-100 border border-red-200 transition"
                    >
                      <HiTrash className="text-red-400" size={16} />
                      Quitar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Vaciar carrito */}
          <button
            onClick={clearCart}
            className="text-base font-semibold text-orange-600 hover:text-white hover:bg-orange-500 px-4 py-2 rounded-lg border border-orange-200 transition w-fit mx-auto mt-3"
          >
            Vaciar carrito
          </button>

          {/* Resumen y pago */}
          <div className="bg-white/95 border border-orange-100 rounded-2xl shadow px-3 py-5 flex flex-col gap-4 mt-4">
            <span className="text-lg sm:text-2xl font-extrabold text-gray-900 text-center">
              Total: ${total.toLocaleString('es-CL')}
            </span>

            {/* Métodos de pago en dos columnas */}
            <div className="w-full flex flex-col gap-4 mt-1">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPayment('efectivo')}
                  className={`py-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition
                    ${payment === 'efectivo'
                      ? 'bg-orange-500 text-white border-orange-500 shadow'
                      : 'bg-white text-orange-500 border-orange-200 hover:bg-orange-50'
                    }`}
                >
                  💵 Efectivo
                </button>

                <button
                  type="button"
                  onClick={() => setPayment('tarjeta')}
                  className={`py-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition
                    ${payment === 'tarjeta'
                      ? 'bg-orange-500 text-white border-orange-500 shadow'
                      : 'bg-white text-orange-500 border-orange-200 hover:bg-orange-50'
                    }`}
                >
                  💳 Tarjeta
                </button>
              </div>

              <button
                className={`w-full py-4 rounded-xl text-base font-bold bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg hover:from-orange-500 hover:to-orange-600 transition
                  ${!payment || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!payment || loading}
                onClick={handleConfirm}
              >
                {loading ? 'Procesando pedido...' : 'Confirmar pedido'}
              </button>

              {error && (
                <p className="text-red-500 text-sm text-center mt-2">{error}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL DE PEDIDO CONFIRMADO --- */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md animate-fade-in">
          <div
            className="bg-white rounded-2xl p-8 w-80 max-w-xs flex flex-col items-center shadow-2xl outline-none"
            ref={modalRef}
            tabIndex={-1}
          >
            <svg
              className="mb-2"
              height={60}
              width={60}
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle cx={12} cy={12} r={12} fill="#4ade80" />
              <path
                d="M8 12l2.5 2.5L16 9"
                stroke="#fff"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">¡Pedido confirmado!</h2>
            <p className="text-center text-gray-500 mb-4">
              Tus comprobantes están siendo descargados...
            </p>
            <button
              className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white py-2 rounded-xl font-bold shadow active:scale-95 transition"
              onClick={() => {
                setSuccess(false)
                router.push('/products')
                clearCart()
              }}
            >
              Volver a productos
            </button>
          </div>
        </div>
      )}
    </>
  )
}
