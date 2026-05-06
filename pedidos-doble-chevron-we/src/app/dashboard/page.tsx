'use client';

import { useState } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { getToday, formatDateLong } from '@/utils/formatters';
import {
  KpiCard,
  PeriodSelector,
  DatePickerFilter,
  SalesChart,
  PaymentMixChart,
  TopProductsTable,
  CategoriesTable,
  RecentOrdersTable,
  AttendanceBadge,
} from '@/app/components/dashboard';
import type { Period } from '@/types/dashboard';

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('day');
  const [date, setDate] = useState(getToday());

  const { data, loading, error, refetch } = useDashboard({ period, date });

  const rangeLabel = data
    ? data.meta.from === data.meta.to
      ? data.meta.from
      : `${data.meta.from} → ${data.meta.to}`
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Panel de Control
            </h1>
            <p className="mt-1.5 font-semibold text-gray-500">
              Doble Chevron · America/Santiago
              {date && ` · ${formatDateLong(date)}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <DatePickerFilter
              value={date}
              onChange={setDate}
              disabled={loading}
            />
            <PeriodSelector
              value={period}
              onChange={setPeriod}
              disabled={loading}
            />
          </div>
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

        {/* KPIs Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard
            title="Ventas Totales"
            value={data?.kpis.totalVentas ?? 0}
            icon="💰"
            variant="ventas"
            loading={loading}
          />
          <KpiCard
            title="Efectivo"
            value={data?.kpis.totalEfectivo ?? 0}
            icon="💵"
            variant="efectivo"
            loading={loading}
          />
          <KpiCard
            title="Tarjeta"
            value={data?.kpis.totalTarjeta ?? 0}
            icon="💳"
            variant="tarjeta"
            loading={loading}
          />
          <KpiCard
            title="Pedidos"
            value={data?.kpis.pedidos ?? 0}
            icon="🧾"
            variant="pedidos"
            isCurrency={false}
            loading={loading}
          />
          <KpiCard
            title="Ticket Promedio"
            value={data?.kpis.ticketPromedio ?? 0}
            icon="🧮"
            variant="ticket"
            loading={loading}
          />
        </section>

        {/* Charts Row */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
          <div className="lg:col-span-8 bg-white rounded-2xl shadow p-5">
            <SalesChart
              labels={data?.series.labels ?? []}
              ventas={data?.series.ventas ?? []}
              pedidos={data?.series.pedidos ?? []}
              period={period}
              loading={loading}
            />
          </div>
          <div className="lg:col-span-4 bg-white rounded-2xl shadow p-5">
            <PaymentMixChart
              pctEfectivo={data?.kpis.mixPago?.pctEfectivo ?? 50}
              pctTarjeta={data?.kpis.mixPago?.pctTarjeta ?? 50}
              loading={loading}
            />
          </div>
        </section>

        {/* Tables Row */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
          <div className="lg:col-span-7 bg-white rounded-2xl shadow p-5">
            <TopProductsTable
              productos={data?.topProductos ?? []}
              loading={loading}
            />
          </div>
          <div className="lg:col-span-5 bg-white rounded-2xl shadow p-5">
            <CategoriesTable
              categorias={data?.categorias ?? []}
              loading={loading}
            />
          </div>
        </section>

        {/* Recent Orders + Attendance */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 bg-white rounded-2xl shadow p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-xl font-extrabold text-gray-900">
                Últimos pedidos
              </h3>
              {rangeLabel && (
                <span className="text-sm font-bold text-gray-400">
                  {rangeLabel}
                </span>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto pr-2">
              <RecentOrdersTable
                pedidos={data?.ultimosPedidos ?? []}
                loading={loading}
              />
            </div>
          </div>
          <div className="lg:col-span-4 bg-white rounded-2xl shadow p-5">
            <h3 className="text-xl font-extrabold text-gray-900 mb-4">
              Asistencia
            </h3>
            <AttendanceBadge
              count={data?.asistencia.trabajadoresAsistieron ?? 0}
              trabajadores={data?.asistencia.trabajadores ?? []}
              loading={loading}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
