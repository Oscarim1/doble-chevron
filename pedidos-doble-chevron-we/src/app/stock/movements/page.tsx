'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HiArrowLeft, HiFilter, HiX } from 'react-icons/hi';
import { format } from 'date-fns';
import { getUserRoleFromToken } from '@/utils/auth';
import { useMovements, useProducts, useLocations, useEmployees } from '@/hooks/useStock';
import { MovementTypeBadge, MOVEMENT_TYPES } from '@/app/components/stock';
import type { MovementFilters, MovementType } from '@/types/stock';

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getMonthAgo(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function MovementsPage() {
  const router = useRouter();
  const { data: products } = useProducts();
  const { data: locations } = useLocations();
  const { data: employees } = useEmployees();

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MovementFilters>({
    type: '',
    product_id: '',
    location_id: '',
    employee_id: '',
    start_date: getMonthAgo(),
    end_date: getTomorrow(),
    limit: 100,
  });

  const { data: movements, loading, error, refetch } = useMovements(filters);

  useEffect(() => {
    const role = getUserRoleFromToken();
    if (role !== 'admin') {
      router.replace('/login');
    }
  }, [router]);

  const handleFilterChange = (key: keyof MovementFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      product_id: '',
      location_id: '',
      employee_id: '',
      start_date: getMonthAgo(),
      end_date: getTomorrow(),
      limit: 100,
    });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.type) count++;
    if (filters.product_id) count++;
    if (filters.location_id) count++;
    if (filters.employee_id) count++;
    return count;
  }, [filters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/stock" className="p-2 rounded-lg hover:bg-white transition">
              <HiArrowLeft className="text-xl text-gray-600" />
            </Link>
            <h1 className="text-3xl font-extrabold text-gray-900">Historial de Movimientos</h1>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${
              showFilters || activeFiltersCount > 0
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-orange-50'
            }`}
          >
            <HiFilter />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white text-orange-500 text-xs font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </header>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Filtros</h3>
              <button
                onClick={clearFilters}
                className="text-sm font-semibold text-orange-600 hover:text-orange-700"
              >
                Limpiar filtros
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Desde</label>
                <input
                  type="date"
                  value={filters.start_date || ''}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 font-semibold text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Hasta</label>
                <input
                  type="date"
                  value={filters.end_date || ''}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 font-semibold text-sm"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tipo</label>
                <select
                  value={filters.type || ''}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 font-semibold text-sm"
                >
                  <option value="">Todos los tipos</option>
                  {MOVEMENT_TYPES.map((mt) => (
                    <option key={mt.type} value={mt.type}>
                      {mt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Producto</label>
                <select
                  value={filters.product_id || ''}
                  onChange={(e) => handleFilterChange('product_id', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 font-semibold text-sm"
                >
                  <option value="">Todos los productos</option>
                  {products?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Ubicacion</label>
                <select
                  value={filters.location_id || ''}
                  onChange={(e) => handleFilterChange('location_id', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 font-semibold text-sm"
                >
                  <option value="">Todas las ubicaciones</option>
                  {locations?.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employee */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Empleado</label>
                <select
                  value={filters.employee_id || ''}
                  onChange={(e) => handleFilterChange('employee_id', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 font-semibold text-sm"
                >
                  <option value="">Todos los empleados</option>
                  {employees?.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

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

        {/* Movements Table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Fecha
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Tipo
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Producto
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                    Cantidad
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Origen / Destino
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Usuario
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Notas
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-3 px-4">
                        <div className="h-5 w-28 rounded bg-gray-200 animate-pulse" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-5 w-24 rounded bg-gray-200 animate-pulse" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-5 w-32 rounded bg-gray-200 animate-pulse" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-5 w-12 rounded bg-gray-200 animate-pulse mx-auto" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-5 w-24 rounded bg-gray-200 animate-pulse" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-5 w-20 rounded bg-gray-200 animate-pulse" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-5 w-16 rounded bg-gray-200 animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : movements && movements.length > 0 ? (
                  movements.map((mov) => (
                    <tr
                      key={mov.id}
                      className="border-t border-gray-100 transition-colors hover:bg-orange-50"
                    >
                      <td className="py-3 px-4 font-semibold text-gray-600 text-sm">
                        {format(new Date(mov.created_at), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="py-3 px-4">
                        <MovementTypeBadge type={mov.type} />
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">{mov.product_name}</td>
                      <td className="py-3 px-4 text-center font-bold text-gray-900">
                        {mov.quantity}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {mov.from_location_name && mov.to_location_name ? (
                          <>
                            {mov.from_location_name} → {mov.to_location_name}
                          </>
                        ) : mov.from_location_name ? (
                          <>De: {mov.from_location_name}</>
                        ) : mov.to_location_name ? (
                          <>A: {mov.to_location_name}</>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="font-semibold text-gray-700">{mov.user_name}</div>
                        {mov.employee_name && (
                          <div className="text-xs text-gray-500">
                            Empleado: {mov.employee_name}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 max-w-[150px] truncate">
                        {mov.notes || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <p className="font-semibold text-gray-400">No hay movimientos</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Ajusta los filtros o registra nuevos movimientos
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Results count */}
          {movements && movements.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">
              Mostrando {movements.length} movimientos
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
