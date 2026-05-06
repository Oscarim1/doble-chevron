'use client';

import { formatCLP } from '@/utils/formatters';

export type KpiVariant = 'ventas' | 'efectivo' | 'tarjeta' | 'pedidos' | 'ticket';

interface KpiCardProps {
  title: string;
  value: number;
  icon: string;
  variant: KpiVariant;
  isCurrency?: boolean;
  loading?: boolean;
}

const variantStyles: Record<KpiVariant, { iconBg: string; iconBorder: string }> = {
  ventas: {
    iconBg: 'bg-orange-100',
    iconBorder: 'border-orange-200',
  },
  efectivo: {
    iconBg: 'bg-emerald-100',
    iconBorder: 'border-emerald-200',
  },
  tarjeta: {
    iconBg: 'bg-blue-100',
    iconBorder: 'border-blue-200',
  },
  pedidos: {
    iconBg: 'bg-purple-100',
    iconBorder: 'border-purple-200',
  },
  ticket: {
    iconBg: 'bg-cyan-100',
    iconBorder: 'border-cyan-200',
  },
};

export function KpiCard({
  title,
  value,
  icon,
  variant,
  isCurrency = true,
  loading = false,
}: KpiCardProps) {
  const styles = variantStyles[variant];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
          <div className="h-10 w-10 rounded-xl bg-gray-200 animate-pulse" />
        </div>
        <div className="h-11 w-32 rounded bg-gray-200 animate-pulse mt-3" />
        <div className="h-4 w-20 rounded bg-gray-200 animate-pulse mt-2" />
      </div>
    );
  }

  const formattedValue = isCurrency ? formatCLP(value) : value.toLocaleString('es-CL');

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
          {title}
        </span>
        <div
          className={`w-10 h-10 rounded-xl grid place-items-center border ${styles.iconBg} ${styles.iconBorder}`}
        >
          <span className="text-lg">{icon}</span>
        </div>
      </div>
      <div className="text-3xl font-extrabold mt-3 tracking-tight text-gray-900">
        {formattedValue}
      </div>
      <div className="text-sm font-semibold mt-2 text-gray-400">
        {isCurrency ? 'Total período' : 'Cantidad total'}
      </div>
    </div>
  );
}
