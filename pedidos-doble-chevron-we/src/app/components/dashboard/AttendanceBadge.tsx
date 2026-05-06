'use client';

import type { Trabajador } from '@/types/dashboard';

interface AttendanceBadgeProps {
  count: number;
  trabajadores?: Trabajador[];
  loading?: boolean;
}

function SkeletonWorker() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
      <div className="flex-1">
        <div className="h-4 w-24 rounded bg-gray-200 animate-pulse mb-1" />
        <div className="h-3 w-16 rounded bg-gray-200 animate-pulse" />
      </div>
    </div>
  );
}

export function AttendanceBadge({ count, trabajadores = [], loading = false }: AttendanceBadgeProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Summary Badge */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full grid place-items-center text-lg bg-purple-100 border border-purple-200 flex-shrink-0">
            👥
          </div>
          <div>
            <div className="font-bold text-gray-900">
              Trabajadores asistieron
            </div>
            <div className="text-xs font-semibold text-gray-400">
              Según tabla asistencias
            </div>
          </div>
        </div>
        {loading ? (
          <div className="h-8 w-12 rounded-full bg-gray-200 animate-pulse" />
        ) : (
          <span className="px-4 py-2 rounded-full font-bold bg-white border border-gray-200 text-gray-900">
            {count}
          </span>
        )}
      </div>

      {/* Workers List */}
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonWorker key={i} />)
        ) : trabajadores.length === 0 ? (
          <p className="text-center py-4 text-sm font-semibold text-gray-400">
            Sin registros de asistencia
          </p>
        ) : (
          trabajadores.map((trabajador) => (
            <div
              key={trabajador.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
            >
              <div className="w-8 h-8 rounded-full grid place-items-center text-sm bg-orange-100 border border-orange-200 text-orange-700 font-bold flex-shrink-0">
                {trabajador.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 text-sm truncate">
                  {trabajador.nombre}
                </div>
                <div className="text-xs font-semibold text-gray-400">
                  {trabajador.horario_entrada}
                  {trabajador.horario_salida ? ` - ${trabajador.horario_salida}` : ' (activo)'}
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                trabajador.horario_salida
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
              }`}>
                {trabajador.horario_salida ? 'Salió' : 'En turno'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
