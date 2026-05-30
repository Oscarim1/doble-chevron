'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchWithAuth, getApiUrl } from '@/utils/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale/es'
import { useLoading } from '../../../context/LoadingContext'
import { getUserRoleFromToken } from '@/utils/auth'
import DCTopbar from '@/app/components/DCTopbar'

interface Order {
  id: string
  user_id: string
  guest_name: string | null
  total: string
  status: string
  created_at: string
  order_number: number
  metodo_pago: string
}

const PAGE_SIZE = 20

const PAGO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  pedidos_ya: 'PedidosYa',
}

function statusBadge(status: string) {
  if (status === 'complete') return <span className="badge badge--ok">Completo</span>
  if (status === 'pending')  return <span className="badge badge--warn">Pendiente</span>
  return <span className="badge badge--off">{status}</span>
}

export default function AdminPedidosPage() {
  const [orders, setOrders]   = useState<Order[]>([])
  const [error, setError]     = useState<string | null>(null)
  const [page, setPage]       = useState(1)
  const router = useRouter()
  const { setLoading } = useLoading()

  useEffect(() => {
    const role = getUserRoleFromToken()
    if (role !== 'admin') { router.replace('/login'); return }

    setLoading(true)
    const apiUrl = getApiUrl()
    fetchWithAuth(`${apiUrl}/api/orders`)
      .then(async res => { if (!res.ok) throw new Error(await res.text()); return res.json() })
      .then(data => setOrders(data))
      .catch(err  => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [router, setLoading])

  const sorted = [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div style={{ minHeight: '100dvh', background: '#FBF1E2', color: '#221813' }}>
      <DCTopbar active="admin" />

      <main className="dc-page">
        {/* ── Page header ── */}
        <div className="dc-head">
          <div className="dc-head__left">
            <Link href="/admin" className="dc-back" aria-label="Volver">
              <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </Link>
            <div>
              <div className="dc-kicker">· Operación ·</div>
              <h1 className="dc-title">Administración de Pedidos</h1>
              <p className="dc-sub">Todos los pedidos realizados en el local y delivery.</p>
            </div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="card" style={{ padding: '16px 20px', marginBottom: 20, background: '#F7D9D5', borderColor: '#D63B30' }}>
            <p style={{ color: '#C23A2E', fontWeight: 600, margin: 0 }}>{error}</p>
          </div>
        )}

        {/* ── Empty ── */}
        {!error && sorted.length === 0 && (
          <div className="dc-empty">
            <div className="ic">
              <svg viewBox="0 0 24 24"><path d="M6 2h9l3 3v17l-2.2-1.5L13.6 22 12 20.5 10.4 22 8.2 20.5 6 22V2z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>
            </div>
            <h3>No hay pedidos registrados</h3>
            <p>Cuando se generen pedidos aparecerán aquí con su detalle y estado.</p>
          </div>
        )}

        {/* ── Table ── */}
        {paginated.length > 0 && (
          <div className="panel" style={{ padding: 0 }}>
            <table className="dc-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Método de pago</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(order => (
                  <tr key={order.id}>
                    <td className="strong mono">#{order.order_number}</td>
                    <td className="muted">{format(new Date(order.created_at), "d MMM yyyy, h:mm a", { locale: es })}</td>
                    <td>{PAGO_LABEL[order.metodo_pago] ?? order.metodo_pago}</td>
                    <td>{statusBadge(order.status)}</td>
                    <td className="strong" style={{ textAlign: 'right' }}>
                      ${Number(order.total).toLocaleString('es-CL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
            <button className="btn btn--ghost btn--sm" onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>← Anterior</button>
            <span style={{ fontSize: 13, color: '#4A3A30' }}>Página {page} de {totalPages}</span>
            <button className="btn btn--ghost btn--sm" onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}>Siguiente →</button>
          </div>
        )}
      </main>
    </div>
  )
}
