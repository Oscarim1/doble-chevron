'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { HiPlus, HiMinus, HiShoppingCart, HiSearch, HiX, HiArrowLeft } from 'react-icons/hi'
import { MdQrCodeScanner } from 'react-icons/md'
import { useCart } from '../../context/CartContext'
import { useCartDrawer } from '../../context/CartDrawerContext'
import { fetchWithAuth, getApiUrl } from '@/utils/api'
import { useLoading } from '../../context/LoadingContext'
import { useCategorias } from '@/hooks/useCategorias'

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

export default function ProductsPage() {
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
    if (!token) {
      router.replace('/login')
      return
    }

    setLoading(true)

    const apiUrl = getApiUrl();
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

  // Set first category as active once categories load
  useEffect(() => {
    if (categorias.length > 0 && !activeCategory) {
      setActiveCategory(categorias[0].id)
    }
  }, [categorias, activeCategory])

  // Scanner detection: pistola emula teclado muy rápido (< 50ms entre teclas) + Enter al final
  const SCANNER_THRESHOLD_MS = 50
  const SCANNER_MIN_CHARS = 3

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
    if (e.key === 'Enter' && esEscaneo && busqueda.trim()) {
      if (filteredProducts.length === 1) {
        const p = filteredProducts[0]
        addItem({ id: p.id, name: p.name, price: parseInt(p.price), image_url: p.image_url, category: p.category })
        setBusqueda('')
        setEsEscaneo(false)
        fastKeystrokeCount.current = 0
      }
    }
  }

  const handleClearSearch = () => {
    setBusqueda('')
    setEsEscaneo(false)
    fastKeystrokeCount.current = 0
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
    const activeCat = categorias.find((c) => c.id === activeCategory)
    return products.filter((p) => {
      if (p.category_id) return p.category_id === activeCategory
      // Legacy fallback: compare by slug
      return activeCat
        ? (p.category || '').trim().toLowerCase() === activeCat.slug
        : false
    })
  }, [products, busqueda, activeCategory, categorias])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 text-red-500 font-semibold">
        {error}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push('/select-mode')}
          className="text-gray-500 hover:text-gray-800 transition p-1 rounded-lg hover:bg-gray-100"
          aria-label="Volver a selección"
        >
          <HiArrowLeft size={22} />
        </button>
        <span className="text-xl">🍔</span>
        <h1 className="text-xl font-extrabold text-gray-800">Restaurant</h1>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Buscador */}
        <div className="relative mb-6">
          {esEscaneo ? (
            <MdQrCodeScanner className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 text-xl" />
          ) : (
            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          )}
          <input
            type="text"
            value={busqueda}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="Buscar producto o escanear codigo de barras..."
            className={`w-full pl-11 pr-10 py-3 rounded-2xl border bg-white shadow-sm font-medium text-gray-900 outline-none transition-all ${
              esEscaneo
                ? 'border-green-400 ring-2 ring-green-300'
                : 'border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent'
            }`}
          />
          {esEscaneo && busqueda && (
            <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              {filteredProducts.length === 1 ? 'Presiona Enter para agregar' : 'Escaner activo'}
            </span>
          )}
          {busqueda && (
            <button
              onClick={handleClearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <HiX className="text-lg" />
            </button>
          )}
        </div>

        {/* Tabs de categorias */}
        {categorias.length > 0 && (
          <div className="flex gap-3 mb-8 flex-wrap">
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2 rounded-full border font-medium transition-all duration-150
                  ${
                    activeCategory === cat.id
                      ? 'bg-black text-white border-black shadow'
                      : 'bg-white text-black border-gray-300 hover:bg-orange-50'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Grid de productos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredProducts.map((p) => {
            const quantity = getQuantity ? getQuantity(p.id) : 0
            return (
              <div
                key={p.id}
                className="rounded-2xl bg-white shadow-md overflow-hidden flex flex-col border hover:shadow-xl transition-shadow group"
              >
                <div className="relative">
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                    style={{ background: '#eee' }}
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div>
                    <h2 className="text-lg font-bold mb-1 text-gray-900">{p.name}</h2>
                    <p className="text-gray-600 text-sm mb-4">{p.description}</p>
                  </div>
                  <div className="flex items-end justify-between mt-auto">
                    <span className="text-xl font-extrabold text-gray-900">
                      ${parseInt(p.price).toLocaleString('es-CL')}
                    </span>
                    {/* Sección de agregar/quitar */}
                    <div className="flex items-center gap-2">
                      {quantity > 0 ? (
                        <div className="flex items-center gap-2 bg-orange-50 px-2 py-1 rounded-full shadow border border-orange-100">
                          <button
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full p-2 transition active:scale-90"
                            onClick={() => removeOne(p.id)}
                            aria-label="Quitar uno"
                          >
                            <HiMinus size={18} />
                          </button>
                          <span className="font-bold text-lg min-w-[24px] text-center select-none text-gray-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.5)]">{quantity}</span>
                          <button
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full p-2 transition active:scale-90"
                            onClick={() =>
                              addItem({
                                id: p.id,
                                name: p.name,
                                price: parseInt(p.price),
                                image_url: p.image_url,
                                category: p.category,
                              })
                            }
                            aria-label="Agregar uno más"
                          >
                            <HiPlus size={18} />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="bg-orange-500 hover:bg-orange-600 text-white rounded-full p-3 shadow transition active:scale-95"
                          onClick={() =>
                            addItem({
                              id: p.id,
                              name: p.name,
                              price: parseInt(p.price),
                              image_url: p.image_url,
                              category: p.category,
                            })
                          }
                          aria-label={`Agregar ${p.name} al carrito`}
                        >
                          <HiPlus size={22} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {!filteredProducts.length && (
            <div className="col-span-full text-center text-gray-400 p-10 text-lg">
              {busqueda ? `No se encontraron productos para "${busqueda}".` : 'No hay productos en esta categoria.'}
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <button
          onClick={openDrawer}
          className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-4 shadow-2xl transition-all active:scale-95 flex items-center gap-3 z-30"
        >
          <HiShoppingCart size={28} />
          <span className="font-bold text-lg pr-1">
            {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
          </span>
        </button>
      )}
    </div>
  )
}
