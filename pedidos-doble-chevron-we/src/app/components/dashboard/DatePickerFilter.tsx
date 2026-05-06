'use client';

interface DatePickerFilterProps {
  value: string;
  onChange: (date: string) => void;
  disabled?: boolean;
}

export function DatePickerFilter({ value, onChange, disabled = false }: DatePickerFilterProps) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-gray-200 shadow">
      <span className="text-sm font-semibold text-gray-500">
        Fecha
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          border-0 outline-none bg-transparent font-semibold text-sm text-gray-900
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        `}
      />
    </div>
  );
}
