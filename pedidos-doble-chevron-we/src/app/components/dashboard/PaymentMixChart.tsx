'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { formatPct } from '@/utils/formatters';

interface PaymentMixChartProps {
  pctEfectivo: number;
  pctTarjeta: number;
  loading?: boolean;
}

const COLORS = {
  efectivo: '#10b981',
  tarjeta: '#f97316',
};

function renderCustomLabel(props: PieLabelRenderProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;

  if (
    typeof cx !== 'number' ||
    typeof cy !== 'number' ||
    typeof midAngle !== 'number' ||
    typeof innerRadius !== 'number' ||
    typeof outerRadius !== 'number' ||
    typeof percent !== 'number'
  ) {
    return null;
  }

  if (percent < 0.05) return null;

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-sm font-bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function PaymentMixChart({ pctEfectivo, pctTarjeta, loading = false }: PaymentMixChartProps) {
  if (loading) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="w-32 h-32 rounded-full bg-gray-200 animate-pulse" />
      </div>
    );
  }

  const data = [
    { name: 'Efectivo', value: pctEfectivo, color: COLORS.efectivo },
    { name: 'Tarjeta', value: pctTarjeta, color: COLORS.tarjeta },
  ];

  return (
    <div>
      <h3 className="text-xl font-extrabold text-gray-900 mb-4">
        Mix de Pago
      </h3>
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              labelLine={false}
              label={renderCustomLabel}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [formatPct(Number(value)), '']}
              contentStyle={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ background: COLORS.efectivo }}
          />
          <span className="text-sm font-semibold text-gray-500">
            Efectivo {formatPct(pctEfectivo)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ background: COLORS.tarjeta }}
          />
          <span className="text-sm font-semibold text-gray-500">
            Tarjeta {formatPct(pctTarjeta)}
          </span>
        </div>
      </div>
    </div>
  );
}
