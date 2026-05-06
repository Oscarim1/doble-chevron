'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  HiCube,
  HiRefresh,
  HiUser,
  HiClipboardList,
  HiLocationMarker,
  HiDocumentReport,
} from 'react-icons/hi';
import { getUserRoleFromToken } from '@/utils/auth';
import { useStockSummary } from '@/hooks/useStock';
import { StockSummaryCard } from '@/app/components/stock';

const quickActions = [
  {
    href: '/stock/purchase',
    label: 'Registrar Compra',
    icon: HiCube,
    color: 'bg-green-500',
  },
  {
    href: '/stock/restock',
    label: 'Reposicion',
    icon: HiRefresh,
    color: 'bg-blue-500',
  },
  {
    href: '/stock/employee-consumption',
    label: 'Consumo Empleado',
    icon: HiUser,
    color: 'bg-orange-500',
  },
  {
    href: '/stock/movements',
    label: 'Historial',
    icon: HiClipboardList,
    color: 'bg-purple-500',
  },
  {
    href: '/stock/locations',
    label: 'Ubicaciones',
    icon: HiLocationMarker,
    color: 'bg-gray-500',
  },
  {
    href: '/stock/reports/employees',
    label: 'Reporte Empleados',
    icon: HiDocumentReport,
    color: 'bg-cyan-500',
  },
];

export default function StockDashboardPage() {
  const router = useRouter();
  const { data: summaries, loading, error, refetch } = useStockSummary();

  useEffect(() => {
    const role = getUserRoleFromToken();
    if (role !== 'admin') {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Control de Stock
          </h1>
          <p className="mt-1.5 font-semibold text-gray-500">
            Gestion de inventario por ubicacion
          </p>
        </header>

        {/* Error State */}
        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between gap-4">
            <p className="font-semibold text-red-600">{error}</p>
            <button
              onClick={refetch}
              className="px-4 py-2 rounded-lg font-bold text-white bg-red-500 hover:bg-red-600 transition"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <StockSummaryCard
                  key={i}
                  summary={{} as any}
                  loading
                />
              ))
            : summaries?.map((summary) => (
                <StockSummaryCard
                  key={summary.location_id}
                  summary={summary}
                  onClick={() => router.push(`/stock/location/${summary.location_id}`)}
                />
              ))}
        </section>

        {/* Quick Actions */}
        <section className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-extrabold text-gray-900 mb-4">Acciones Rapidas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow transition"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${action.color} grid place-items-center`}
                >
                  <action.icon className="text-white text-xl" />
                </div>
                <span className="text-sm font-bold text-gray-700 text-center">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
