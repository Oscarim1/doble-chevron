'use client';

import { HiOfficeBuilding, HiDesktopComputer, HiExclamationCircle } from 'react-icons/hi';
import type { StockSummary } from '@/types/stock';

interface StockSummaryCardProps {
  summary: StockSummary;
  onClick?: () => void;
  loading?: boolean;
}

export function StockSummaryCard({ summary, onClick, loading = false }: StockSummaryCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
          <div className="h-5 w-28 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="h-8 w-16 rounded bg-gray-200 animate-pulse mb-1" />
        <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
      </div>
    );
  }

  const Icon = summary.location_type === 'bodega' ? HiOfficeBuilding : HiDesktopComputer;
  const hasWarning = summary.low_stock_count > 0;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow p-5 cursor-pointer transition hover:shadow-lg ${
        hasWarning ? 'border-l-4 border-orange-500' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 grid place-items-center">
            <Icon className="text-orange-600 text-lg" />
          </div>
          <span className="font-bold text-gray-900">{summary.location_name}</span>
        </div>
        {hasWarning && <HiExclamationCircle className="text-orange-500 text-xl" />}
      </div>
      <div className="text-3xl font-extrabold text-gray-900">{summary.total_products}</div>
      <div className="text-sm font-semibold text-gray-400">
        Productos ({summary.total_units} unidades)
      </div>
      {hasWarning && (
        <div className="mt-2">
          <span className="px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
            {summary.low_stock_count} bajo stock
          </span>
        </div>
      )}
    </div>
  );
}
