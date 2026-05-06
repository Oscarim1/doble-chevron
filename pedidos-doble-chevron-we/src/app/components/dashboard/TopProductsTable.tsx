'use client';

import { formatCLP } from '@/utils/formatters';
import type { TopProducto } from '@/types/dashboard';

interface TopProductsTableProps {
  productos: TopProducto[];
  loading?: boolean;
}

function SkeletonRow() {
  return (
    <tr>
      <td className="py-3 px-4">
        <div className="h-5 w-6 rounded bg-gray-200 animate-pulse" />
      </td>
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
        <div className="h-5 w-20 rounded bg-gray-200 animate-pulse ml-auto" />
      </td>
    </tr>
  );
}

export function TopProductsTable({ productos, loading = false }: TopProductsTableProps) {
  return (
    <div>
      <h3 className="text-xl font-extrabold text-gray-900 mb-4">
        Top 10 Productos
      </h3>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                #
              </th>
              <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Producto
              </th>
              <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Categoría
              </th>
              <th className="py-3 px-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                Uds
              </th>
              <th className="py-3 px-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : productos.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-8 text-center font-semibold text-gray-400"
                >
                  No hay productos para este período
                </td>
              </tr>
            ) : (
              productos.slice(0, 10).map((producto, index) => (
                <tr
                  key={index}
                  className="border-t border-gray-100 transition-colors hover:bg-orange-50"
                >
                  <td className="py-3 px-4 font-bold text-orange-600">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-gray-900">
                      {producto.name}
                    </div>
                    {producto.sub_category && (
                      <div className="text-xs font-semibold text-gray-400">
                        {producto.sub_category}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-500">
                    {producto.category}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">
                    {producto.unidades}
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-orange-600">
                    {formatCLP(producto.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
