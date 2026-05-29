'use client'

import { useEffect, useState, useMemo, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Dialog, Transition } from '@headlessui/react'
import {
  HiArrowLeft,
  HiPlus,
  HiPencil,
  HiTrash,
  HiSearch,
  HiX,
  HiCheck,
  HiExclamation,
} from 'react-icons/hi'
import { getUserRoleFromToken } from '@/utils/auth'
import {
  useProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  type Producto,
  type ProductoPayload,
} from '@/hooks/useProductos'
import { useCategorias } from '@/hooks/useCategorias'

function formatCLP(value: number): string {
  return '$' + Math.round(value).toLocaleString('es-CL')
}

interface FormState {
  name: string
  price: string
  points: string
  image_url: string
  description: string
  precio_puntos: string
  category_id: string
  sub_category: string
  barcode: string
  is_active: boolean
}

const initialFormState: FormState = {
  name: '',
  price: '',
  points: '0',
  image_url: '',
  description: '',
  precio_puntos: '0',
  category_id: '',
  sub_category: '',
  barcode: '',
  is_active: true,
}

export default function AdminProductosPage() {
  const router = useRouter()
  const { data: productos, loading, error, refetch } = useProductos(true)
  const { data: categorias } = useCategorias()
  const [busqueda, setBusqueda] = useState('')

  // Modal state
  const [modalAbierto, setModalAbierto] = useState(false)
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null)
  const [form, setForm] = useState<FormState>(initialFormState)
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)

  // Confirmacion eliminar
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<Producto | null>(null)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    const role = getUserRoleFromToken()
    if (role !== 'admin') {
      router.replace('/login')
    }
  }, [router])

  const productosFiltrados = useMemo(() => {
    if (!productos) return []
    if (!busqueda.trim()) return productos
    const termino = busqueda.toLowerCase()
    return productos.filter(
      (p) =>
        p.name.toLowerCase().includes(termino) ||
        p.category_info?.name.toLowerCase().includes(termino) ||
        p.category?.toLowerCase().includes(termino) ||
        p.sub_category?.toLowerCase().includes(termino) ||
        p.barcode?.toLowerCase().includes(termino)
    )
  }, [productos, busqueda])

  const handleNuevo = () => {
    setProductoEditando(null)
    setForm(initialFormState)
    setErrorForm(null)
    setModalAbierto(true)
  }

  const handleEditar = (producto: Producto) => {
    setProductoEditando(producto)
    setForm({
      name: producto.name,
      price: String(producto.price),
      points: String(producto.points || 0),
      image_url: producto.image_url || '',
      description: producto.description || '',
      precio_puntos: String(producto.precio_puntos || 0),
      category_id: producto.category_id || '',
      sub_category: producto.sub_category || '',
      barcode: producto.barcode || '',
      is_active: Boolean(producto.is_active),
    })
    setErrorForm(null)
    setModalAbierto(true)
  }

  const handleGuardar = async () => {
    if (!form.name.trim()) {
      setErrorForm('El nombre es requerido')
      return
    }
    if (!form.price || Number(form.price) <= 0) {
      setErrorForm('El precio debe ser mayor a 0')
      return
    }

    const payload: ProductoPayload = {
      name: form.name.trim(),
      price: Number(form.price),
      points: Number(form.points) || 0,
      image_url: form.image_url.trim() || null,
      description: form.description.trim() || null,
      precio_puntos: Number(form.precio_puntos) || 0,
      category_id: form.category_id || null,
      sub_category: form.sub_category.trim() || null,
      barcode: form.barcode.trim() || null,
      is_active: form.is_active,
    }

    setGuardando(true)
    setErrorForm(null)

    try {
      if (productoEditando) {
        await actualizarProducto(productoEditando.id, payload)
      } else {
        await crearProducto(payload)
      }
      setModalAbierto(false)
      refetch()
    } catch (err) {
      setErrorForm((err as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async () => {
    if (!confirmandoEliminar) return
    setEliminando(true)
    try {
      await eliminarProducto(confirmandoEliminar.id)
      setConfirmandoEliminar(null)
      refetch()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setEliminando(false)
    }
  }

  const getCategoryLabel = (producto: Producto) => {
    if (producto.category_info?.name) return producto.category_info.name
    return producto.category || null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-lg hover:bg-white transition">
              <HiArrowLeft className="text-xl text-gray-600" />
            </Link>
            <h1 className="text-2xl font-extrabold text-gray-900">Gestion de Productos</h1>
          </div>
          <button
            onClick={handleNuevo}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition"
          >
            <HiPlus className="text-lg" />
            Nuevo
          </button>
        </header>

        {/* Buscador */}
        <div className="bg-white rounded-2xl shadow p-4 mb-6">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, categoria o barcode..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 font-semibold text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <HiX />
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        )}

        {/* Lista de productos */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow p-4 h-32 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-24 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="font-semibold text-gray-400">
              {busqueda ? 'No se encontraron productos' : 'No hay productos registrados'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {productosFiltrados.map((producto) => (
              <div
                key={producto.id}
                className="bg-white rounded-2xl shadow p-4 flex gap-4"
              >
                {/* Imagen */}
                <div className="w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                  {producto.image_url ? (
                    <img
                      src={producto.image_url}
                      alt={producto.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-2xl text-gray-300">
                      📦
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-gray-900 truncate">{producto.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${
                        producto.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {producto.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-orange-600">{formatCLP(producto.price)}</p>
                  {getCategoryLabel(producto) && (
                    <p className="text-xs text-gray-400 mt-1">
                      {getCategoryLabel(producto)}
                      {producto.sub_category && ` > ${producto.sub_category}`}
                    </p>
                  )}
                  {producto.barcode && (
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      {producto.barcode}
                    </p>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEditar(producto)}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition text-sm"
                    >
                      <HiPencil /> Editar
                    </button>
                    <button
                      onClick={() => setConfirmandoEliminar(producto)}
                      className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition text-sm"
                    >
                      <HiTrash /> Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contador */}
        {productos && productos.length > 0 && (
          <p className="text-center text-sm text-gray-400 mt-6">
            Mostrando {productosFiltrados.length} de {productos.length} productos
          </p>
        )}
      </div>

      {/* Modal Crear/Editar */}
      <Transition appear show={modalAbierto} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setModalAbierto(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <Dialog.Title className="text-lg font-bold text-gray-900">
                      {productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
                    </Dialog.Title>
                    <button
                      onClick={() => setModalAbierto(false)}
                      className="p-1 rounded-lg hover:bg-gray-100 transition"
                    >
                      <HiX className="text-xl text-gray-400" />
                    </button>
                  </div>

                  {/* Formulario */}
                  <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {/* Nombre */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 font-semibold text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        placeholder="Ej: Coca Cola 500ml"
                      />
                    </div>

                    {/* Precio y Puntos */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          Precio *
                        </label>
                        <input
                          type="number"
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 font-semibold text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                          placeholder="1200"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          Puntos
                        </label>
                        <input
                          type="number"
                          value={form.points}
                          onChange={(e) => setForm({ ...form, points: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 font-semibold text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                          placeholder="10"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Categoria */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Categoria
                      </label>
                      <select
                        value={form.category_id}
                        onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 font-semibold text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      >
                        <option value="">Sin categoria</option>
                        {categorias.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.parent_name ? `${cat.parent_name} > ${cat.name}` : cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Subcategoria */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Subcategoria
                      </label>
                      <input
                        type="text"
                        value={form.sub_category}
                        onChange={(e) => setForm({ ...form, sub_category: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 font-semibold text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        placeholder="Ej: gaseosas"
                      />
                    </div>

                    {/* URL Imagen */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        URL de imagen
                      </label>
                      <input
                        type="text"
                        value={form.image_url}
                        onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 font-semibold text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        placeholder="https://ejemplo.com/imagen.jpg"
                      />
                    </div>

                    {/* Descripcion */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Descripcion
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 font-semibold text-gray-900 resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        placeholder="Descripcion del producto..."
                      />
                    </div>

                    {/* Barcode */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Codigo de barras
                      </label>
                      <input
                        type="text"
                        value={form.barcode}
                        onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 font-mono text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        placeholder="Ej: 7501055300522"
                      />
                    </div>

                    {/* Precio en puntos */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Precio en puntos (canje)
                      </label>
                      <input
                        type="number"
                        value={form.precio_puntos}
                        onChange={(e) => setForm({ ...form, precio_puntos: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 font-semibold text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        placeholder="100"
                        min="0"
                      />
                    </div>

                    {/* Activo */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, is_active: !form.is_active })}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          form.is_active ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            form.is_active ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                      <span className="text-sm font-semibold text-gray-700">
                        {form.is_active ? 'Producto activo' : 'Producto inactivo'}
                      </span>
                    </div>

                    {/* Error */}
                    {errorForm && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-red-600 font-semibold text-sm">{errorForm}</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                    <button
                      onClick={() => setModalAbierto(false)}
                      className="flex-1 py-2 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleGuardar}
                      disabled={guardando}
                      className="flex-1 py-2 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition flex items-center justify-center gap-2"
                    >
                      {guardando ? (
                        'Guardando...'
                      ) : (
                        <>
                          <HiCheck /> Guardar
                        </>
                      )}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Modal Confirmar Eliminar */}
      <Transition appear show={!!confirmandoEliminar} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setConfirmandoEliminar(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-red-100 grid place-items-center mx-auto mb-4">
                    <HiExclamation className="text-3xl text-red-500" />
                  </div>
                  <Dialog.Title className="text-lg font-bold text-gray-900 mb-2">
                    Eliminar producto
                  </Dialog.Title>
                  <p className="text-gray-500 mb-6">
                    ¿Estas seguro de eliminar <b>{confirmandoEliminar?.name}</b>? Esta accion no se
                    puede deshacer.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmandoEliminar(null)}
                      className="flex-1 py-2 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleEliminar}
                      disabled={eliminando}
                      className="flex-1 py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 disabled:opacity-50 transition"
                    >
                      {eliminando ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}
