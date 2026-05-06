'use client';

import type { StockLocation, LocationType } from '@/types/stock';

interface LocationSelectProps {
  locations: StockLocation[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  filterType?: LocationType | 'all';
}

export function LocationSelect({
  locations,
  value,
  onChange,
  disabled = false,
  placeholder = 'Seleccionar ubicacion',
  filterType = 'all',
}: LocationSelectProps) {
  // Si hay filtro, mostrar las del tipo preferido primero, luego el resto
  const sortedLocations = filterType === 'all'
    ? locations
    : [...locations].sort((a, b) => {
        if (a.type === filterType && b.type !== filterType) return -1;
        if (a.type !== filterType && b.type === filterType) return 1;
        return 0;
      });

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`
        w-full px-4 py-3 rounded-xl border border-gray-200 bg-white
        font-semibold text-gray-900 outline-none
        focus:ring-2 focus:ring-orange-500 focus:border-transparent
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      `}
    >
      <option value="">{placeholder}</option>
      {sortedLocations.map((location) => (
        <option key={location.id} value={location.id}>
          {location.name} ({location.type})
        </option>
      ))}
    </select>
  );
}
