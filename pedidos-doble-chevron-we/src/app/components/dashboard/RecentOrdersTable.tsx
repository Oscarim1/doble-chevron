'use client';

import { formatCLP, formatDateTime } from '@/utils/formatters';
import type { Pedido } from '@/types/dashboard';

interface RecentOrdersTableProps {
  pedidos: Pedido[];
  loading?: boolean;
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
        <div>
          <div className="h-5 w-20 rounded bg-gray-200 animate-pulse mb-1" />
          <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
        </div>
      </div>
      <div className="h-8 w-20 rounded-full bg-gray-200 animate-pulse" />
    </div>
  );
}

export function RecentOrdersTable({ pedidos, loading = false }: RecentOrdersTableProps) {
  return (
    <div className="flex flex-col gap-3">
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
      ) : pedidos.length === 0 ? (
        <p className="text-center py-8 font-semibold text-gray-400">
          No hay pedidos para este período
        </p>
      ) : (
        pedidos.map((pedido, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full grid place-items-center font-bold text-sm bg-orange-100 border border-orange-200 text-orange-700 flex-shrink-0">
                #{pedido.order_number}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-gray-900 truncate">
                  {formatCLP(pedido.total)}
                </div>
                <div className="text-xs font-semibold text-gray-400 truncate">
                  {formatDateTime(pedido.fecha_hora)}
                </div>
              </div>
            </div>
            <span
              className={`
                px-3 py-2 rounded-full text-sm font-bold whitespace-nowrap border capitalize
                ${pedido.metodo_pago === 'efectivo'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-orange-50 border-orange-200 text-orange-700'
                }
              `}
            >
              {pedido.metodo_pago}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
