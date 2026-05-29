'use client'

import { useEffect, useState, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Dialog, Transition } from '@headlessui/react'
import {
  HiArrowLeft,
  HiPlus,
  HiPencil,
  HiTrash,
  HiX,
  HiCheck,
  HiExclamation,
  HiTag,
} from 'react-icons/hi'
import { getUserRoleFromToken } from '@/utils/auth'
import {
  useCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  type Categoria,
} from '@/hooks/useCategorias'

interface FormState {
  name: string
  parent_id: string
}

const initialFormState: FormState = {
  name: '',
  parent_id: '',
}

export default function AdminCategoriasPage() {
  const router = useRouter()
  const { data: categorias, loading, error, refetch } = useCategorias()

  const [modalAbierto, setModalAbierto] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null)
  const [form, setForm] = useState<FormState>(initialFormState)
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)

  const [confirmandoEliminar, setConfirmandoEliminar] = useState<Categoria | null>(null)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    const role = getUserRoleFromToken()
    if (role !== 'admin') {
      router.replace('/login')
    }
  }, [router])

  const handleNueva = () => {
    setCategoriaEditando(null)
    setForm(initialFormState)
    setErrorForm(null)
    setModalAbierto(true)
  }

  const handleEditar = (categoria: Categoria) => {
    setCategoriaEditando(categoria)
    setForm({
      name: categoria.name,
      parent_id: categoria.parent_id || '',
    })
    setErrorForm(null)
    setModalAbierto(true)
  }

  const handleGuardar = async () => {
    if (!form.name.trim()) {
      setErrorForm('El nombre es requerido')
      return
    }

    setGuardando(true)
    setErrorForm(null)

    try {
      const payload = {
        name: form.name.trim(),
        parent_id: form.parent_id || null,
      }
      if (categoriaEditando) {
        await actualizarCategoria(categoriaEditando.id, payload)
      } else {
        await crearCategoria(payload)
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
      await eliminarCategoria(confirmandoEliminar.id)
      setConfirmandoEliminar(null)
      refetch()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setEliminando(false)
    }
  }

  // Separar categorías raíz y subcategorías para mostrar jerarquía
  const raices = categorias.filter((c) => !c.parent_id)
  const subcategorias = categorias.filter((c) => c.parent_id)
  // Categorías elegibles como padre (solo raíces, para no anidar más de 1 nivel)
  const posiblesPadres = raices

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-lg hover:bg-white transition">
              <HiArrowLeft className="text-xl text-gray-600" />
            </Link>
            <h1 className="text-2xl font-extrabold text-gray-900">Categorías</h1>
          </div>
          <button
            onClick={handleNueva}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition"
          >
            <HiPlus className="text-lg" />
            Nueva
          </button>
        </header>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow p-4 h-16 animate-pulse" />
            ))}
          </div>
        ) : categorias.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <HiTag className="text-4xl text-gray-300 mx-auto mb-2" />
            <p className="font-semibold text-gray-400">No hay categorías creadas</p>
            <button
              onClick={handleNueva}
              className="mt-4 px-4 py-2 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition text-sm"
            >
              Crear primera categoría
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Categorías raíz con sus subcategorías anidadas */}
            {raices.map((raiz) => {
              const hijos = subcategorias.filter((s) => s.parent_id === raiz.id)
              return (
                <div key={raiz.id} className="bg-white rounded-2xl shadow overflow-hidden">
                  {/* Categoría padre */}
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                      <span className="font-bold text-gray-900">{raiz.name}</span>
                      <span className="text-xs text-gray-400 font-mono">/{raiz.slug}</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditar(raiz)}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                        title="Editar"
                      >
                        <HiPencil className="text-sm" />
                      </button>
                      <button
                        onClick={() => setConfirmandoEliminar(raiz)}
                        className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                        title="Eliminar"
                      >
                        <HiTrash className="text-sm" />
                      </button>
                    </div>
                  </div>

                  {/* Subcategorías */}
                  {hijos.map((hijo) => (
                    <div
                      key={hijo.id}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-gray-50 bg-gray-50/60 pl-8"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                        <span className="font-semibold text-gray-700 text-sm">{hijo.name}</span>
                        <span className="text-xs text-gray-400 font-mono">/{hijo.slug}</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditar(hijo)}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                          title="Editar"
                        >
                          <HiPencil className="text-sm" />
                        </button>
                        <button
                          onClick={() => setConfirmandoEliminar(hijo)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                          title="Eliminar"
                        >
                          <HiTrash className="text-sm" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}

            {/* Subcategorías huérfanas (padre eliminado) */}
            {subcategorias
              .filter((s) => !raices.find((r) => r.id === s.parent_id))
              .map((huerfana) => (
                <div key={huerfana.id} className="bg-white rounded-2xl shadow px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                    <span className="font-semibold text-gray-700">{huerfana.name}</span>
                    <span className="text-xs text-gray-400 font-mono">/{huerfana.slug}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditar(huerfana)}
                      className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                    >
                      <HiPencil className="text-sm" />
                    </button>
                    <button
                      onClick={() => setConfirmandoEliminar(huerfana)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                    >
                      <HiTrash className="text-sm" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Contador */}
        {categorias.length > 0 && (
          <p className="text-center text-sm text-gray-400 mt-6">
            {raices.length} categoría{raices.length !== 1 ? 's' : ''} · {subcategorias.length} subcategoría{subcategorias.length !== 1 ? 's' : ''}
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
                <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <Dialog.Title className="text-lg font-bold text-gray-900">
                      {categoriaEditando ? 'Editar Categoría' : 'Nueva Categoría'}
                    </Dialog.Title>
                    <button
                      onClick={() => setModalAbierto(false)}
                      className="p-1 rounded-lg hover:bg-gray-100 transition"
                    >
                      <HiX className="text-xl text-gray-400" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
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
                        placeholder="Ej: Bebidas"
                        autoFocus
                      />
                    </div>

                    {/* Categoría padre */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Categoría padre
                      </label>
                      <select
                        value={form.parent_id}
                        onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 font-semibold text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      >
                        <option value="">Ninguna (categoría raíz)</option>
                        {posiblesPadres
                          .filter((p) => p.id !== categoriaEditando?.id)
                          .map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-gray-400 mt-1">
                        Si seleccionas una categoría padre, esta será una subcategoría.
                      </p>
                    </div>

                    {errorForm && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-red-600 font-semibold text-sm">{errorForm}</p>
                      </div>
                    )}
                  </div>

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
                      {guardando ? 'Guardando...' : <><HiCheck /> Guardar</>}
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
                    Eliminar categoría
                  </Dialog.Title>
                  <p className="text-gray-500 mb-6">
                    ¿Eliminar <b>{confirmandoEliminar?.name}</b>? Los productos asignados a esta categoría quedarán sin categoría.
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
