'use client';

import type { StockEmployee } from '@/types/stock';

interface EmployeeSelectProps {
  employees: StockEmployee[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function EmployeeSelect({
  employees,
  value,
  onChange,
  disabled = false,
  placeholder = 'Seleccionar empleado',
}: EmployeeSelectProps) {
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
      {employees.map((employee) => (
        <option key={employee.id} value={employee.id}>
          {employee.name}
        </option>
      ))}
    </select>
  );
}
