'use client';

import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { formatCLP } from '@/utils/formatters';
import type { Period } from '@/types/dashboard';

interface SalesChartProps {
  labels: string[];
  ventas: number[];
  pedidos: number[];
  period: Period;
  loading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-lg">
      <p className="text-sm font-bold text-gray-900 mb-2">
        {label}
      </p>
      {payload.map((entry, index) => (
        <p
          key={index}
          className="text-sm font-semibold"
          style={{ color: entry.color }}
        >
          {entry.name}: {entry.dataKey === 'ventas' ? formatCLP(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

export function SalesChart({ labels, ventas, pedidos, period, loading = false }: SalesChartProps) {
  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="w-full h-full rounded-xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  const data = labels.map((label, i) => ({
    name: label,
    ventas: ventas[i] || 0,
    pedidos: pedidos[i] || 0,
  }));

  const chartTitle = period === 'day' ? 'Ventas por hora' : 'Ventas por día';

  return (
    <div>
      <h3 className="text-xl font-extrabold text-gray-900 mb-4">
        {chartTitle}
      </h3>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#ea580c" stopOpacity={0.92} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="0"
              stroke="rgba(0, 0, 0, 0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(0, 0, 0, 0.06)' }}
              interval={data.length > 14 ? 2 : data.length > 10 ? 1 : 0}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
              hide
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              yAxisId="left"
              dataKey="ventas"
              name="Ventas"
              fill="url(#barGradient)"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="pedidos"
              name="Pedidos"
              stroke="rgba(0, 0, 0, 0.25)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#111827' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" />
          <span className="text-sm font-semibold text-gray-500">
            Ventas
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-gray-400" />
          <span className="text-sm font-semibold text-gray-500">
            Pedidos
          </span>
        </div>
      </div>
    </div>
  );
}
