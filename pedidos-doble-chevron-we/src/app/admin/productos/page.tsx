'use client'

import { useEffect, useState, useMemo, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Dialog, Transition } from '@headlessui/react'
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
import DCTopbar from '@/app/components/DCTopbar'

function formatCLP(value: number): string {
  return '$' + Math.round(value).toLocaleString('es-CL')
}

interface FormState {
  name: string; price: string; points: string; image_url: string; description: string
  precio_puntos: string; category_id: string; sub_category: string; barcode: string; is_active: boolean
}
const initialForm: FormState = {
  name: '', price: '', points: '0', image_url: '', description: '',
  precio_puntos: '0', category_id: '', sub_category: '', barcode: '', is_active: true,
}

export default function AdminProductosPage() {
  const router = useRouter()
  const { data: productos, loading, error, refetch } = useProductos(true)
  const { data: categorias } = useCategorias()
  const [busqueda, setBusqueda] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Producto | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<Producto | null>(null)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    if (getUserRoleFromToken() !== 'admin') router.replace('/login')
  }, [router])

  const filtrados = useMemo(() => {
    if (!productos) return []
    if (!busqueda.trim()) return productos
    const t = busqueda.toLowerCase()
    return productos.filter(p =>
      p.name.toLowerCase().includes(t) ||
      p.category_info?.name.toLowerCase().includes(t) ||
      p.category?.toLowerCase().includes(t) ||
      p.sub_category?.toLowerCase().includes(t) ||
      p.barcode?.toLowerCase().includes(t)
    )
  }, [productos, busqueda])

  const openNew = () => { setEditando(null); setForm(initialForm); setErrorForm(null); setModalOpen(true) }
  const openEdit = (p: Producto) => {
    setEditando(p)
    setForm({ name: p.name, price: String(p.price), points: String(p.points || 0), image_url: p.image_url || '', description: p.description || '', precio_puntos: String(p.precio_puntos || 0), category_id: p.category_id || '', sub_category: p.sub_category || '', barcode: p.barcode || '', is_active: Boolean(p.is_active) })
    setErrorForm(null); setModalOpen(true)
  }

  const handleGuardar = async () => {
    if (!form.name.trim()) { setErrorForm('El nombre es requerido'); return }
    if (!form.price || Number(form.price) <= 0) { setErrorForm('El precio debe ser mayor a 0'); return }
    const payload: ProductoPayload = {
      name: form.name.trim(), price: Number(form.price), points: Number(form.points) || 0,
      image_url: form.image_url.trim() || null, description: form.description.trim() || null,
      precio_puntos: Number(form.precio_puntos) || 0, category_id: form.category_id || null,
      sub_category: form.sub_category.trim() || null, barcode: form.barcode.trim() || null,
      is_active: form.is_active,
    }
    setGuardando(true); setErrorForm(null)
    try {
      if (editando) await actualizarProducto(editando.id, payload)
      else await crearProducto(payload)
      setModalOpen(false); refetch()
    } catch (err) { setErrorForm((err as Error).message) }
    finally { setGuardando(false) }
  }

  const handleEliminar = async () => {
    if (!confirmDel) return
    setEliminando(true)
    try { await eliminarProducto(confirmDel.id); setConfirmDel(null); refetch() }
    catch (err) { alert((err as Error).message) }
    finally { setEliminando(false) }
  }

  const getCatLabel = (p: Producto) => p.category_info?.name ?? p.category ?? null

  return (
    <div style={{ minHeight: '100dvh', background: '#FBF1E2', color: '#221813' }}>
      <DCTopbar active="admin" />

      <main className="dc-page">
        {/* ── Header ── */}
        <div className="dc-head">
          <div className="dc-head__left">
            <Link href="/admin" className="dc-back" aria-label="Volver">
              <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </Link>
            <div>
              <div className="dc-kicker">· Catálogo ·</div>
              <h1 className="dc-title">Gestión de Productos</h1>
              <p className="dc-sub">{productos?.length ?? 0} productos · toca una tarjeta para editar.</p>
            </div>
          </div>
          <div className="dc-head__actions">
            <button className="btn btn--primary" onClick={openNew}>
              <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Nuevo
            </button>
          </div>
        </div>

        {/* ── Search ── */}
        <div className="dc-search">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre, categoría o barcode…" />
        </div>

        {/* ── Error ── */}
        {error && <div className="card" style={{ padding: '14px 18px', marginBottom: 16, background: '#F7D9D5', borderColor: '#D63B30' }}><p style={{ color: '#C23A2E', fontWeight: 600, margin: 0 }}>{error}</p></div>}

        {/* ── Loading skeletons ── */}
        {loading && (
          <div className="prod-grid">
            {[1,2,3,4].map(i => <div key={i} className="prod-card skeleton" style={{ height: 124 }} />)}
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && filtrados.length === 0 && (
          <div className="dc-empty">
            <div className="ic"><svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>
            <h3>{busqueda ? 'No se encontraron productos' : 'No hay productos registrados'}</h3>
            <p>{busqueda ? 'Prueba con otro término de búsqueda.' : 'Crea el primer producto usando el botón Nuevo.'}</p>
          </div>
        )}

        {/* ── Product grid ── */}
        {!loading && filtrados.length > 0 && (
          <div className="prod-grid">
            {filtrados.map(p => (
              <article key={p.id} className="prod-card">
                <div className="prod-thumb">
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} />
                    : <span style={{ color: '#4A3A30', fontSize: 11 }}>foto</span>
                  }
                </div>
                <div className="prod-info">
                  <div className="prod-top">
                    <div>
                      <div className="prod-name">{p.name}</div>
                      <div className="prod-price">{formatCLP(p.price)}</div>
                      {getCatLabel(p) && <div className="prod-cat">{getCatLabel(p)}{p.sub_category && ` › ${p.sub_category}`}</div>}
                    </div>
                    <span className={`badge ${p.is_active ? 'badge--ok' : 'badge--off'}`}>{p.is_active ? 'Activo' : 'Inactivo'}</span>
                  </div>
                  <div className="prod-actions">
                    <button className="btn btn--ghost btn--sm" onClick={() => openEdit(p)}>
                      <svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>Editar
                    </button>
                    <button className="btn btn--ghost btn--sm" onClick={() => setConfirmDel(p)} style={{ color: '#C23A2E', borderColor: '#C23A2E' }}>
                      <svg viewBox="0 0 24 24" style={{ stroke: '#C23A2E' }}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>Eliminar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {productos && productos.length > 0 && (
          <p style={{ textAlign: 'center', fontSize: 13, color: '#4A3A30', marginTop: 20 }}>
            Mostrando {filtrados.length} de {productos.length} productos
          </p>
        )}
      </main>

      {/* ── Modal Crear/Editar ── */}
      <Transition appear show={modalOpen} as={Fragment}>
        <Dialog as="div" style={{ position: 'relative', zIndex: 80 }} onClose={() => setModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(34,24,19,0.55)' }} />
          </Transition.Child>
          <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 20px' }}>
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-2" enterTo="opacity-100 translate-y-0" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
              <Dialog.Panel className="dc-modal">
                <div className="dc-modal__head">
                  <Dialog.Title as="h2">{editando ? 'Editar Producto' : 'Nuevo Producto'}</Dialog.Title>
                  <button className="dc-modal__close" onClick={() => setModalOpen(false)}>
                    <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>
                  </button>
                </div>
                <div className="dc-modal__body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                  <div className="field">
                    <label>Nombre <span className="req">*</span></label>
                    <input className="dc-input" type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ej: Coca Cola 500ml" />
                  </div>
                  <div className="field-row">
                    <div className="field">
                      <label>Precio <span className="req">*</span></label>
                      <input className="dc-input" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="1200" min="0" />
                    </div>
                    <div className="field">
                      <label>Puntos</label>
                      <input className="dc-input" type="number" value={form.points} onChange={e => setForm({...form, points: e.target.value})} placeholder="10" min="0" />
                    </div>
                  </div>
                  <div className="field">
                    <label>Categoría</label>
                    <select className="dc-select" value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
                      <option value="">Sin categoría</option>
                      {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.parent_name ? `${cat.parent_name} › ${cat.name}` : cat.name}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Subcategoría</label>
                    <input className="dc-input" type="text" value={form.sub_category} onChange={e => setForm({...form, sub_category: e.target.value})} placeholder="Ej: gaseosas" />
                  </div>
                  <div className="field">
                    <label>URL de imagen</label>
                    <input className="dc-input" type="text" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="https://ejemplo.com/imagen.jpg" />
                  </div>
                  <div className="field">
                    <label>Descripción</label>
                    <textarea className="dc-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Descripción del producto…" />
                  </div>
                  <div className="field">
                    <label>Código de barras</label>
                    <input className="dc-input" type="text" value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} placeholder="Ej: 7501055300522" style={{ fontFamily: 'ui-monospace, monospace' }} />
                  </div>
                  <div className="field">
                    <label>Precio en puntos (canje)</label>
                    <input className="dc-input" type="number" value={form.precio_puntos} onChange={e => setForm({...form, precio_puntos: e.target.value})} placeholder="100" min="0" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button type="button" onClick={() => setForm({...form, is_active: !form.is_active})}
                      style={{ width: 48, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative', background: form.is_active ? '#2FA35A' : '#C5AE9E', transition: 'background 150ms' }}>
                      <span style={{ position: 'absolute', top: 3, width: 20, height: 20, borderRadius: 999, background: '#fff', transition: 'left 150ms', left: form.is_active ? 24 : 4 }} />
                    </button>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{form.is_active ? 'Activo' : 'Inactivo'}</span>
                  </div>
                  {errorForm && <div style={{ background: '#F7D9D5', borderRadius: 8, padding: '10px 14px' }}><p style={{ color: '#C23A2E', fontWeight: 600, fontSize: 13, margin: 0 }}>{errorForm}</p></div>}
                </div>
                <div className="dc-modal__foot">
                  <button className="btn btn--ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
                  <button className="btn btn--primary" onClick={handleGuardar} disabled={guardando}>
                    <svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-9"/></svg>{guardando ? 'Guardando…' : 'Guardar'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* ── Modal Eliminar ── */}
      <Transition appear show={!!confirmDel} as={Fragment}>
        <Dialog as="div" style={{ position: 'relative', zIndex: 80 }} onClose={() => setConfirmDel(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(34,24,19,0.55)' }} />
          </Transition.Child>
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="dc-modal dc-modal--narrow">
                <div className="dc-modal__body" style={{ alignItems: 'center', textAlign: 'center', paddingBottom: 0 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 999, background: '#F7D9D5', border: '1.5px solid #D63B30', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                    <svg viewBox="0 0 24 24" style={{ width: 30, height: 30, stroke: '#C23A2E', strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>
                  </div>
                  <Dialog.Title style={{ fontFamily: 'var(--font-alfa-slab-one), serif', fontWeight: 400, fontSize: 24, margin: '4px 0 0', color: '#221813' }}>Eliminar producto</Dialog.Title>
                  <p style={{ margin: 0, color: '#4A3A30', fontSize: 14.5, lineHeight: 1.5 }}>¿Estás seguro de eliminar <strong>{confirmDel?.name}</strong>?<br/>Esta acción no se puede deshacer.</p>
                </div>
                <div className="dc-modal__foot">
                  <button className="btn btn--ghost" onClick={() => setConfirmDel(null)}>Cancelar</button>
                  <button className="btn btn--danger" onClick={handleEliminar} disabled={eliminando}>{eliminando ? 'Eliminando…' : 'Eliminar'}</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}
