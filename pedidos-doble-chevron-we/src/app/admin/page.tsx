'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HiShoppingBag, HiCube, HiClipboardList, HiUserGroup, HiShieldCheck, HiCurrencyDollar } from 'react-icons/hi'
import { getUserRoleFromToken } from '@/utils/auth'

interface ModuloCard {
  titulo: string
  descripcion: string
  href: string
  icon: React.ReactNode
  color: string
}

const modulos: ModuloCard[] = [
  {
    titulo: 'Productos',
    descripcion: 'Crear, editar y eliminar productos del catalogo',
    href: '/admin/productos',
    icon: <HiCube className="text-3xl" />,
    color: 'bg-blue-500',
  },
  {
    titulo: 'Pedidos',
    descripcion: 'Ver y administrar todos los pedidos realizados',
    href: '/admin/pedidos',
    icon: <HiShoppingBag className="text-3xl" />,
    color: 'bg-green-500',
  },
  {
    titulo: 'Asistencias',
    descripcion: 'Control de asistencia de empleados',
    href: '/admin/asistencias',
    icon: <HiUserGroup className="text-3xl" />,
    color: 'bg-purple-500',
  },
  {
    titulo: 'Stock',
    descripcion: 'Gestion de inventario y movimientos',
    href: '/stock',
    icon: <HiClipboardList className="text-3xl" />,
    color: 'bg-orange-500',
  },
  {
    titulo: 'Registro de Accesos',
    descripcion: 'Monitoreo de autenticacion y seguridad',
    href: '/admin/auth-logs',
    icon: <HiShieldCheck className="text-3xl" />,
    color: 'bg-cyan-500',
  },
  {
    titulo: 'Historial de Cierres',
    descripcion: 'Ver todos los cierres de caja con sus informes',
    href: '/admin/cierres-caja',
    icon: <HiCurrencyDollar className="text-3xl" />,
    color: 'bg-amber-500',
  },
]

export default function AdminHubPage() {
  const router = useRouter()

  useEffect(() => {
    const role = getUserRoleFromToken()
    if (role !== 'admin') {
      router.replace('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Panel de Administracion</h1>
          <p className="text-gray-500 mt-1">Selecciona un modulo para comenzar</p>
        </header>

        {/* Grid de modulos */}
        <div className="grid gap-4 sm:grid-cols-2">
          {modulos.map((modulo) => (
            <Link
              key={modulo.href}
              href={modulo.href}
              className="bg-white rounded-2xl shadow hover:shadow-lg transition-shadow p-6 flex items-start gap-4 group"
            >
              <div className={`${modulo.color} text-white p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                {modulo.icon}
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors">
                  {modulo.titulo}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{modulo.descripcion}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Accesos rapidos */}
        <div className="mt-8 bg-white rounded-2xl shadow p-6">
          <h3 className="font-bold text-gray-900 mb-4">Accesos rapidos</h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition text-sm"
            >
              Dashboard
            </Link>
            <Link
              href="/cierre-caja"
              className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition text-sm"
            >
              Cierre de caja
            </Link>
            <Link
              href="/stock/movements"
              className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition text-sm"
            >
              Historial de stock
            </Link>
            <Link
              href="/stock/reports/employees"
              className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition text-sm"
            >
              Reporte consumos
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
