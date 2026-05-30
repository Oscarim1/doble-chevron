'use client'

import { useEffect, useState, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Dialog, Transition } from '@headlessui/react'
import { getUserRoleFromToken } from '@/utils/auth'
import {
  useCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  type Categoria,
} from '@/hooks/useCategorias'
import DCTopbar from '@/app/components/DCTopbar'

interface FormState { name: string; parent_id: string }
const initialForm: FormState = { name: '', parent_id: '' }

export default function AdminCategoriasPage() {
  const router = useRouter()
  const { data: categorias, loading, error, refetch } = useCategorias()
  const [modalOpen, setModalOpen]   = useState(false)
  const [editando, setEditando]     = useState<Categoria | null>(null)
  const [form, setForm]             = useState<FormState>(initialForm)
  const [guardando, setGuardando]   = useState(false)
  const [errorForm, setErrorForm]   = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<Categoria | null>(null)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    if (getUserRoleFromToken() !== 'admin') router.replace('/login')
  }, [router])

  const raices = categorias.filter(c => !c.parent_id)
  const subcats = categorias.filter(c =>  c.parent_id)
  const posiblesPadres = raices

  const openNew = () => { setEditando(null); setForm(initialForm); setErrorForm(null); setModalOpen(true) }
  const openEdit = (c: Categoria) => { setEditando(c); setForm({ name: c.name, parent_id: c.parent_id || '' }); setErrorForm(null); setModalOpen(true) }

  const handleGuardar = async () => {
    if (!form.name.trim()) { setErrorForm('El nombre es requerido'); return }
    setGuardando(true); setErrorForm(null)
    try {
      const payload = { name: form.name.trim(), parent_id: form.parent_id || null }
      if (editando) await actualizarCategoria(editando.id, payload)
      else await crearCategoria(payload)
      setModalOpen(false); refetch()
    } catch (err) { setErrorForm((err as Error).message) }
    finally { setGuardando(false) }
  }

  const handleEliminar = async () => {
    if (!confirmDel) return
    setEliminando(true)
    try { await eliminarCategoria(confirmDel.id); setConfirmDel(null); refetch() }
    catch (err) { alert((err as Error).message) }
    finally { setEliminando(false) }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#FBF1E2', color: '#221813' }}>
      <DCTopbar active="admin" />

      <main className="dc-page dc-page--narrow">
        {/* ── Header ── */}
        <div className="dc-head">
          <div className="dc-head__left">
            <Link href="/admin" className="dc-back" aria-label="Volver">
              <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </Link>
            <div>
              <div className="dc-kicker">· Catálogo ·</div>
              <h1 className="dc-title">Categorías</h1>
              <p className="dc-sub">Organiza el catálogo en categorías y subcategorías.</p>
            </div>
          </div>
          <div className="dc-head__actions">
            <button className="btn btn--primary" onClick={openNew}>
              <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Nueva
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && <div className="card" style={{ padding: '14px 18px', marginBottom: 16, background: '#F7D9D5', borderColor: '#D63B30' }}><p style={{ color: '#C23A2E', fontWeight: 600, margin: 0 }}>{error}</p></div>}

        {/* ── Loading ── */}
        {loading && (
          <div className="cat-list">
            {[1,2,3].map(i => <div key={i} className="cat-row skeleton" style={{ height: 58 }} />)}
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && categorias.length === 0 && (
          <div className="dc-empty">
            <div className="ic"><svg viewBox="0 0 24 24"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg></div>
            <h3>No hay categorías creadas</h3>
            <p>Crea la primera categoría usando el botón Nueva.</p>
          </div>
        )}

        {/* ── List ── */}
        {!loading && categorias.length > 0 && (
          <div className="cat-list">
            {raices.map(raiz => {
              const hijos = subcats.filter(s => s.parent_id === raiz.id)
              return (
                <div key={raiz.id} style={{ background: '#FFFCF6', border: '1.5px solid #221813', borderRadius: 12, boxShadow: '0 3px 0 #221813', overflow: 'hidden' }}>
                  <div className="cat-row" style={{ borderRadius: 0, boxShadow: 'none', border: 'none', margin: 0 }}>
                    <span className="cat-dot" />
                    <span>
                      <span className="cat-name">{raiz.name}</span>
                      <span className="cat-slug">/{raiz.slug}</span>
                    </span>
                    <span style={{ flex: 1 }} />
                    <span style={{ display: 'flex', gap: 8 }}>
                      <button className="icon-btn icon-btn--edit" onClick={() => openEdit(raiz)} title="Editar">
                        <svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
                      </button>
                      <button className="icon-btn icon-btn--del" onClick={() => setConfirmDel(raiz)} title="Eliminar">
                        <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                      </button>
                    </span>
                  </div>
                  {hijos.map(hijo => (
                    <div key={hijo.id} className="cat-sub-row">
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: '#C5AE9E', flexShrink: 0 }} />
                      <span>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>{hijo.name}</span>
                        <span className="cat-slug">/{hijo.slug}</span>
                      </span>
                      <span style={{ flex: 1 }} />
                      <span style={{ display: 'flex', gap: 8 }}>
                        <button className="icon-btn icon-btn--edit" onClick={() => openEdit(hijo)} title="Editar">
                          <svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
                        </button>
                        <button className="icon-btn icon-btn--del" onClick={() => setConfirmDel(hijo)} title="Eliminar">
                          <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )
            })}
            {/* Huérfanas */}
            {subcats.filter(s => !raices.find(r => r.id === s.parent_id)).map(h => (
              <div key={h.id} className="cat-row">
                <span style={{ width: 8, height: 8, borderRadius: 999, background: '#C5AE9E', flexShrink: 0 }} />
                <span><span className="cat-name">{h.name}</span><span className="cat-slug">/{h.slug}</span></span>
                <span style={{ flex: 1 }} />
                <span style={{ display: 'flex', gap: 8 }}>
                  <button className="icon-btn icon-btn--edit" onClick={() => openEdit(h)}><svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button>
                  <button className="icon-btn icon-btn--del" onClick={() => setConfirmDel(h)}><svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg></button>
                </span>
              </div>
            ))}
          </div>
        )}

        {categorias.length > 0 && (
          <p style={{ textAlign: 'center', fontSize: 13, color: '#4A3A30', marginTop: 20 }}>
            {raices.length} categoría{raices.length !== 1 ? 's' : ''} · {subcats.length} subcategoría{subcats.length !== 1 ? 's' : ''}
          </p>
        )}
      </main>

      {/* ── Modal Crear/Editar ── */}
      <Transition appear show={modalOpen} as={Fragment}>
        <Dialog as="div" style={{ position: 'relative', zIndex: 80 }} onClose={() => setModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(34,24,19,0.55)' }} />
          </Transition.Child>
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="dc-modal">
                <div className="dc-modal__head">
                  <Dialog.Title as="h2">{editando ? 'Editar Categoría' : 'Nueva Categoría'}</Dialog.Title>
                  <button className="dc-modal__close" onClick={() => setModalOpen(false)}>
                    <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>
                  </button>
                </div>
                <div className="dc-modal__body">
                  <div className="field">
                    <label>Nombre <span className="req">*</span></label>
                    <input className="dc-input" type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ej: Bebidas" autoFocus />
                  </div>
                  <div className="field">
                    <label>Categoría padre</label>
                    <select className="dc-select" value={form.parent_id} onChange={e => setForm({...form, parent_id: e.target.value})}>
                      <option value="">Ninguna (categoría raíz)</option>
                      {posiblesPadres.filter(p => p.id !== editando?.id).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <span className="hint">Si seleccionas una categoría padre, esta será una subcategoría.</span>
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
                  <Dialog.Title style={{ fontFamily: 'var(--font-alfa-slab-one), serif', fontWeight: 400, fontSize: 24, margin: '4px 0 0', color: '#221813' }}>Eliminar categoría</Dialog.Title>
                  <p style={{ margin: 0, color: '#4A3A30', fontSize: 14.5, lineHeight: 1.5 }}>¿Eliminar <strong>{confirmDel?.name}</strong>? Los productos asignados quedarán sin categoría.</p>
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
