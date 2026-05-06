'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HiArrowLeft, HiUser } from 'react-icons/hi';
import { getUserRoleFromToken } from '@/utils/auth';
import { useEmployeeConsumptionReport } from '@/hooks/useStock';

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getMonthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function EmployeeConsumptionReportPage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState(getMonthStart());
  const [endDate, setEndDate] = useState(getToday());

  const { data, loading, error, refetch } = useEmployeeConsumptionReport(startDate, endDate);

  useEffect(() => {
    const role = getUserRoleFromToken();
    if (role !== 'admin') {
      router.replace('/login');
    }
  }, [router]);

  // Group by employee
  const groupedByEmployee = useMemo(() => {
    if (!data) return [];
    const grouped = new Map<string, { name: string; items: typeof data; total: number }>();

    data.forEach((item) => {
      const existing = grouped.get(item.employee_id);
      if (existing) {
        existing.items.push(item);
        existing.total += item.total_consumed;
      } else {
        grouped.set(item.employee_id, {
          name: item.employee_name,
          items: [item],
          total: item.total_consumed,
        });
      }
    });

    return Array.from(grouped.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [data]);

  const totalConsumed = useMemo(() => {
    return groupedByEmployee.reduce((acc, emp) => acc + emp.total, 0);
  }, [groupedByEmployee]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 mb-6">
          <Link href="/stock" className="p-2 rounded-lg hover:bg-white transition">
            <HiArrowLeft className="text-xl text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              Reporte Consumo Empleados
            </h1>
            <p className="font-semibold text-gray-500">
              Bebidas consumidas por empleados
            </p>
          </div>
        </header>

        {/* Date Filters */}
        <div className="bg-white rounded-2xl shadow p-5 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Desde</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 font-semibold text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Hasta</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 font-semibold text-sm"
              />
            </div>
            <button
              onClick={refetch}
              className="px-4 py-2 rounded-lg bg-orange-500 text-white font-bold hover:bg-orange-600 transition"
            >
              Actualizar
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="font-semibold text-red-600">{error}</p>
          </div>
        )}

        {/* Summary Card */}
        {!loading && groupedByEmployee.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-5 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 border border-orange-200 grid place-items-center">
                <HiUser className="text-orange-600 text-xl" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-gray-900">{totalConsumed}</div>
                <div className="text-sm font-semibold text-gray-500">
                  Total consumido por {groupedByEmployee.length} empleados
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report by Employee */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-5 w-32 rounded bg-gray-200 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-gray-200 animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-gray-200 animate-pulse" />
                </div>
              </div>
            ))
          ) : groupedByEmployee.length > 0 ? (
            groupedByEmployee.map((employee) => (
              <div key={employee.id} className="bg-white rounded-2xl shadow overflow-hidden">
                {/* Employee Header */}
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 border border-orange-200 grid place-items-center">
                      <HiUser className="text-orange-600" />
                    </div>
                    <span className="font-bold text-gray-900">{employee.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-orange-600">{employee.total}</span>
                    <span className="text-sm font-semibold text-gray-500 ml-1">unidades</span>
                  </div>
                </div>

                {/* Products Table */}
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="py-2 px-5 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                        Producto
                      </th>
                      <th className="py-2 px-5 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                        Categoria
                      </th>
                      <th className="py-2 px-5 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                        Veces
                      </th>
                      <th className="py-2 px-5 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {employee.items.map((item) => (
                      <tr
                        key={`${employee.id}-${item.product_id}`}
                        className="border-t border-gray-100 hover:bg-orange-50 transition-colors"
                      >
                        <td className="py-3 px-5 font-semibold text-gray-900">
                          {item.product_name}
                        </td>
                        <td className="py-3 px-5 text-sm text-gray-500">{item.category}</td>
                        <td className="py-3 px-5 text-right font-semibold text-gray-600">
                          {item.times_consumed}
                        </td>
                        <td className="py-3 px-5 text-right font-bold text-gray-900">
                          {item.total_consumed}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl shadow p-12 text-center">
              <HiUser className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="font-semibold text-gray-400">No hay consumos registrados</p>
              <p className="text-sm text-gray-400 mt-1">
                Ajusta el rango de fechas o registra consumos de empleados
              </p>
              <Link
                href="/stock/employee-consumption"
                className="inline-block mt-4 px-6 py-2 rounded-lg bg-orange-500 text-white font-bold hover:bg-orange-600 transition"
              >
                Registrar consumo
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
