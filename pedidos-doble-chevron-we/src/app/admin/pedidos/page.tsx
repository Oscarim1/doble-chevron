'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchWithAuth, getApiUrl } from '@/utils/api'
import { HiOutlinePrinter, HiCheckCircle, HiArrowLeft } from 'react-icons/hi'
import { format } from 'date-fns'
import { es } from 'date-fns/locale/es'
import { useLoading } from '../../../context/LoadingContext'
import { getUserRoleFromToken } from '@/utils/auth'

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

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const router = useRouter()
  const { setLoading } = useLoading()

  useEffect(() => {
    const role = getUserRoleFromToken()
    if (role !== 'admin') {
      router.replace('/login')
      return
    }

    setLoading(true)

    const apiUrl = getApiUrl()
    fetchWithAuth(`${apiUrl}/api/orders`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      })
      .then((data) => setOrders(data))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [router, setLoading])

  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const totalPages = Math.ceil(sortedOrders.length / PAGE_SIZE)
  const paginatedOrders = sortedOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 text-red-500 font-semibold">
        {error}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 rounded-lg hover:bg-white transition">
            <HiArrowLeft className="text-xl text-gray-600" />
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900">Administracion de Pedidos</h1>
        </header>

        {sortedOrders.length === 0 && (
          <div className="text-lg text-gray-600 text-center mt-16">
            No hay pedidos registrados.
          </div>
        )}

        <div className="flex flex-col gap-4">
          {paginatedOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-2xl shadow px-6 py-5 flex flex-col gap-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <div className="font-bold text-xl text-gray-900">Pedido #{order.order_number}</div>
                  <div className="text-gray-400 text-sm">
                    {format(new Date(order.created_at), "d 'de' MMMM 'de' yyyy, h:mm a", { locale: es })}
                  </div>
                </div>
                <div className="flex gap-2 items-center mt-3 sm:mt-0">
                  {order.status === 'complete' && (
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <HiCheckCircle className="text-green-400" size={16} /> Confirmado
                    </span>
                  )}
                  <button className="flex items-center gap-1 px-3 py-1 rounded-md border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-xs transition">
                    <HiOutlinePrinter className="mr-1" /> Imprimir
                  </button>
                </div>
              </div>
              <div className="flex gap-8 flex-wrap text-gray-700 text-sm">
                <div>Metodo de pago: <b className="capitalize">{order.metodo_pago}</b></div>
                <div>Status: <b>{order.status}</b></div>
              </div>
              <div className="font-extrabold text-xl text-gray-900 mt-2">
                Total: ${Number(order.total).toLocaleString('es-CL')}
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-10">
            <button
              className="px-3 py-1 rounded border font-semibold text-orange-600 border-orange-200 hover:bg-orange-50 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
            >
              Anterior
            </button>
            <span className="text-gray-600">Pagina {page} de {totalPages}</span>
            <button
              className="px-3 py-1 rounded border font-semibold text-orange-600 border-orange-200 hover:bg-orange-50 disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
