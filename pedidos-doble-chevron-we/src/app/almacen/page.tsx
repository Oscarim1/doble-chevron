'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { HiPlus, HiMinus, HiSearch, HiX, HiTrash, HiArrowLeft } from 'react-icons/hi'
import { MdQrCodeScanner } from 'react-icons/md'
import { useCart } from '../../context/CartContext'
import { fetchWithAuth, getApiUrl } from '@/utils/api'
import { useLoading } from '../../context/LoadingContext'
import { useCategorias } from '@/hooks/useCategorias'
import { getUserIdFromToken } from '@/utils/auth'
import { generateSinglePDF, Order } from '@/utils/pdfUtils'
import { format } from 'date-fns'

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

export default function AlmacenPage() {
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
  const { data: categorias } = useCategorias()

  const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0)
  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.replace('/login')
      return
    }

    setLoading(true)
    const apiUrl = getApiUrl()
    fetchWithAuth(`${apiUrl}/api/products`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text() || 'Error cargando productos')
        return res.json()
      })
      .then((data) => setProducts(data))
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false))
  }, [router, setLoading])

  // Focus search on mount so scanner can type directly
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const now = Date.now()
    const diff = now - lastKeystrokeTime.current
    lastKeystrokeTime.current = now

    if (diff < SCANNER_THRESHOLD_MS) {
      fastKeystrokeCount.current += 1
      if (fastKeystrokeCount.current >= SCANNER_MIN_CHARS) {
        setEsEscaneo(true)
      }
    } else {
      fastKeystrokeCount.current = 0
      setEsEscaneo(false)
    }
    setBusqueda(e.target.value)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && busqueda.trim()) {
      if (filteredProducts.length === 1) {
        const p = filteredProducts[0]
        addItem({ id: p.id, name: p.name, price: parseInt(p.price), image_url: p.image_url, category: p.category })
        setBusqueda('')
        setEsEscaneo(false)
        fastKeystrokeCount.current = 0
        searchInputRef.current?.focus()
      }
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
      const termino = busqueda.toLowerCase()
      return products.filter(
        (p) =>
          p.name.toLowerCase().includes(termino) ||
          (p.barcode && p.barcode.toLowerCase().includes(termino))
      )
    }
    if (!activeCategory) return products
    const activeCat = categorias.find((c) => c.id === activeCategory)
    return products.filter((p) => {
      if (p.category_id) return p.category_id === activeCategory
      return activeCat
        ? (p.category || '').trim().toLowerCase() === activeCat.slug
        : false
    })
  }, [products, busqueda, activeCategory, categorias])

  function downloadTicket(order: Order, metodoPago: 'efectivo' | 'tarjeta') {
    const now = format(new Date(), 'yyyyMMdd_HHmm')
    const doc = generateSinglePDF(order, 'Doble Chevron', metodoPago)
    doc.save(`pedido_${order.order_number}_${now}.pdf`)
  }

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
            if (!res.ok) throw new Error(await res.text() || 'Error creando item')
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

      setSuccess(true)
      downloadTicket(order, payment!)

      setTimeout(() => {
        setSuccess(false)
        setPayment(null)
        clearCart()
        searchInputRef.current?.focus()
      }, 2000)
    } catch (err) {
      setOrderError((err as Error).message || 'Error procesando pedido')
    } finally {
      setLoadingOrder(false)
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-red-500 font-semibold">
        {error}
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={() => router.push('/select-mode')}
          className="text-gray-500 hover:text-gray-800 transition p-1 rounded-lg hover:bg-gray-100"
          aria-label="Volver a selección"
        >
          <HiArrowLeft size={22} />
        </button>
        <span className="text-xl">🏪</span>
        <h1 className="text-xl font-extrabold text-gray-800">Tienda</h1>
        <span className="ml-auto text-sm text-gray-400">{products.length} productos cargados</span>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Product list */}
        <div className="flex flex-col flex-1 min-h-0 p-4 gap-3">
          {/* Scanner / search input */}
          <div className="relative">
            {esEscaneo ? (
              <MdQrCodeScanner className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 text-xl" />
            ) : (
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            )}
            <input
              ref={searchInputRef}
              type="text"
              value={busqueda}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              placeholder="Escanear código de barras o buscar producto..."
              className={`w-full pl-10 pr-10 py-3 rounded-xl border bg-white shadow-sm font-medium text-gray-900 outline-none transition-all text-base ${
                esEscaneo
                  ? 'border-green-400 ring-2 ring-green-300'
                  : 'border-gray-200 focus:ring-2 focus:ring-gray-400 focus:border-transparent'
              }`}
            />
            {esEscaneo && busqueda && (
              <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                {filteredProducts.length === 1 ? 'Presiona Enter' : 'Escaneando...'}
              </span>
            )}
            {busqueda && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <HiX className="text-lg" />
              </button>
            )}
          </div>

          {/* Category filters */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveCategory('')}
              className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all
                ${activeCategory === ''
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all
                  ${activeCategory === cat.id
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((p) => {
                const qty = items.find((i) => i.id === p.id)?.quantity ?? 0
                return (
                  <div
                    key={p.id}
                    className={`bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md ${
                      qty > 0 ? 'border-orange-300 ring-1 ring-orange-200' : 'border-gray-200'
                    }`}
                  >
                    {p.image_url && (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-28 object-cover"
                      />
                    )}
                    <div className="p-3 flex flex-col flex-1">
                      <p className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{p.name}</p>
                      <p className="text-orange-500 font-extrabold text-base mt-1">
                        ${parseInt(p.price).toLocaleString('es-CL')}
                      </p>
                      <div className="mt-auto pt-2">
                        {qty > 0 ? (
                          <div className="flex items-center justify-between bg-orange-50 rounded-lg px-2 py-1">
                            <button
                              onClick={() => removeOne(p.id)}
                              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full p-1 transition active:scale-90"
                            >
                              <HiMinus size={14} />
                            </button>
                            <span className="font-bold text-gray-900 text-sm">{qty}</span>
                            <button
                              onClick={() => addItem({ id: p.id, name: p.name, price: parseInt(p.price), image_url: p.image_url, category: p.category })}
                              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full p-1 transition active:scale-90"
                            >
                              <HiPlus size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addItem({ id: p.id, name: p.name, price: parseInt(p.price), image_url: p.image_url, category: p.category })}
                            className="w-full bg-gray-800 hover:bg-gray-700 text-white rounded-lg py-1.5 text-sm font-bold transition active:scale-95"
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
                <div className="col-span-full text-center text-gray-400 py-16 text-base">
                  {busqueda ? `Sin resultados para "${busqueda}"` : 'Sin productos en esta categoría'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Inline cart */}
        <div className="w-80 xl:w-96 bg-white border-l border-gray-200 flex flex-col shrink-0 min-h-0">
          {/* Cart header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-gray-800 text-base">Carrito</h2>
              <p className="text-xs text-gray-500">
                {totalItems === 0 ? 'Vacío' : `${totalItems} ${totalItems === 1 ? 'producto' : 'productos'}`}
              </p>
            </div>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-400 hover:text-red-600 font-semibold transition"
              >
                Vaciar
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {success ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
                <svg height={64} width={64} viewBox="0 0 24 24" fill="none">
                  <circle cx={12} cy={12} r={12} fill="#4ade80" />
                  <path d="M8 12l2.5 2.5L16 9" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-xl font-bold text-gray-800 text-center">¡Pedido confirmado!</p>
                <p className="text-gray-400 text-sm text-center">Descargando ticket...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 py-12 text-center">
                <span className="text-5xl">📦</span>
                <p className="text-gray-400 text-sm font-medium">Escanea o agrega productos</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-xl p-3 flex gap-2 border border-gray-100">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg border border-orange-100 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-xs leading-tight line-clamp-2">{item.name}</p>
                    <p className="text-orange-500 font-bold text-sm mt-0.5">
                      ${(item.price * item.quantity).toLocaleString('es-CL')}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => removeOne(item.id)}
                        className="bg-orange-100 hover:bg-orange-200 text-orange-500 rounded-full p-1 transition"
                      >
                        <HiMinus size={12} />
                      </button>
                      <span className="font-bold text-gray-900 text-xs min-w-[18px] text-center">{item.quantity}</span>
                      <button
                        onClick={() => addItem({ id: item.id, name: item.name, price: item.price, image_url: item.image_url, category: item.category })}
                        className="bg-orange-100 hover:bg-orange-200 text-orange-500 rounded-full p-1 transition"
                      >
                        <HiPlus size={12} />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto text-red-300 hover:text-red-500 transition p-1 rounded-full hover:bg-red-50"
                      >
                        <HiTrash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout footer */}
          {!success && items.length > 0 && (
            <div className="border-t border-gray-200 p-4 space-y-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 font-medium">Total</span>
                <span className="text-2xl font-extrabold text-gray-900">
                  ${total.toLocaleString('es-CL')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPayment('efectivo')}
                  className={`py-2.5 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-1 transition-all
                    ${payment === 'efectivo'
                      ? 'bg-orange-500 text-white border-orange-500 shadow'
                      : 'bg-white text-orange-500 border-orange-200 hover:bg-orange-50'
                    }`}
                >
                  💵 Efectivo
                </button>
                <button
                  onClick={() => setPayment('tarjeta')}
                  className={`py-2.5 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-1 transition-all
                    ${payment === 'tarjeta'
                      ? 'bg-orange-500 text-white border-orange-500 shadow'
                      : 'bg-white text-orange-500 border-orange-200 hover:bg-orange-50'
                    }`}
                >
                  💳 Tarjeta
                </button>
              </div>

              <button
                onClick={handleConfirm}
                disabled={!payment || loadingOrder}
                className={`w-full py-3 rounded-xl font-bold text-base bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg hover:from-gray-800 hover:to-black transition
                  ${!payment || loadingOrder ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loadingOrder ? 'Procesando...' : 'Confirmar pedido'}
              </button>

              {orderError && (
                <p className="text-red-500 text-xs text-center">{orderError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
