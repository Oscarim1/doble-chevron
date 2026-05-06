'use client';

import { formatCLP } from '@/utils/formatters';
import type { Categoria } from '@/types/dashboard';

interface CategoriesTableProps {
  categorias: Categoria[];
  loading?: boolean;
}

function SkeletonRow() {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="h-5 w-24 rounded bg-gray-200 animate-pulse" />
        <div className="h-5 w-12 rounded bg-gray-200 animate-pulse" />
      </div>
      <div className="h-3 w-full rounded-full bg-gray-200 animate-pulse" />
    </div>
  );
}

export function CategoriesTable({ categorias, loading = false }: CategoriesTableProps) {
  const maxTotal = Math.max(1, ...categorias.map((c) => c.total));

  return (
    <div>
      <h3 className="text-xl font-extrabold text-gray-900 mb-4">
        Categorías más vendidas
      </h3>
      <div className="flex flex-col gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
        ) : categorias.length === 0 ? (
          <p className="text-center py-8 font-semibold text-gray-400">
            No hay categorías para este período
          </p>
        ) : (
          categorias.map((categoria, index) => {
            const pct = Math.round((categoria.total / maxTotal) * 100);
            return (
              <div key={index} className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">
                      {categoria.category}
                    </span>
                    <span className="text-sm font-semibold text-gray-400">
                      · {categoria.unidades} u · {formatCLP(categoria.total)}
                    </span>
                  </div>
                  <span className="font-extrabold text-orange-600">
                    {pct}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-orange-400 to-orange-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
