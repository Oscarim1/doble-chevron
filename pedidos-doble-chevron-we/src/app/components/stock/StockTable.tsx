'use client';

import { HiPencil } from 'react-icons/hi';
import type { StockItem } from '@/types/stock';

interface StockTableProps {
  items: StockItem[];
  loading?: boolean;
  onConfigureMin?: (item: StockItem) => void;
}

function SkeletonRow() {
  return (
    <tr>
      <td className="py-3 px-4">
        <div className="h-5 w-32 rounded bg-gray-200 animate-pulse" />
      </td>
      <td className="py-3 px-4">
        <div className="h-5 w-20 rounded bg-gray-200 animate-pulse" />
      </td>
      <td className="py-3 px-4 text-right">
        <div className="h-5 w-12 rounded bg-gray-200 animate-pulse ml-auto" />
      </td>
      <td className="py-3 px-4 text-right">
        <div className="h-5 w-12 rounded bg-gray-200 animate-pulse ml-auto" />
      </td>
      <td className="py-3 px-4">
        <div className="h-5 w-16 rounded bg-gray-200 animate-pulse" />
      </td>
      <td className="py-3 px-4">
        <div className="h-5 w-8 rounded bg-gray-200 animate-pulse" />
      </td>
    </tr>
  );
}

function StatusBadge({ lowStock }: { lowStock: number }) {
  if (lowStock === 1) {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
        Bajo
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
      OK
    </span>
  );
}

export function StockTable({ items, loading = false, onConfigureMin }: StockTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="bg-gray-50">
            <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
              Producto
            </th>
            <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
              Categoria
            </th>
            <th className="py-3 px-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
              Cantidad
            </th>
            <th className="py-3 px-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
              Minimo
            </th>
            <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
              Estado
            </th>
            <th className="py-3 px-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
              Accion
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-8 text-center font-semibold text-gray-400">
                No hay productos en esta ubicacion
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr
                key={item.product_id}
                className="border-t border-gray-100 transition-colors hover:bg-orange-50"
              >
                <td className="py-3 px-4 font-bold text-gray-900">{item.product_name}</td>
                <td className="py-3 px-4 font-semibold text-gray-500">{item.category}</td>
                <td className="py-3 px-4 text-right font-bold text-gray-900">{item.quantity}</td>
                <td className="py-3 px-4 text-right font-semibold text-gray-500">
                  {item.min_quantity}
                </td>
                <td className="py-3 px-4">
                  <StatusBadge lowStock={item.low_stock} />
                </td>
                <td className="py-3 px-4 text-center">
                  {onConfigureMin && (
                    <button
                      onClick={() => onConfigureMin(item)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-orange-600 transition"
                      title="Configurar minimo"
                    >
                      <HiPencil />
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
