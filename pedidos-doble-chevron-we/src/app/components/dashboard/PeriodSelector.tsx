'use client';

import type { Period } from '@/types/dashboard';

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
  disabled?: boolean;
}

const periods: { value: Period; label: string }[] = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
];

export function PeriodSelector({ value, onChange, disabled = false }: PeriodSelectorProps) {
  return (
    <div
      className="flex gap-1.5 p-1.5 rounded-full bg-white border border-gray-200 shadow"
      role="tablist"
      aria-label="Periodo"
    >
      {periods.map((period) => {
        const isActive = value === period.value;
        return (
          <button
            key={period.value}
            onClick={() => onChange(period.value)}
            disabled={disabled}
            role="tab"
            aria-selected={isActive}
            className={`
              px-4 py-2 rounded-full font-semibold text-sm transition-all duration-150
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              ${isActive
                ? 'bg-black text-white shadow'
                : 'bg-transparent text-gray-600 hover:bg-orange-50'
              }
            `}
          >
            {period.label}
          </button>
        );
      })}
    </div>
  );
}
