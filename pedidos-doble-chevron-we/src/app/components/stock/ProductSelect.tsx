'use client';

import type { StockProduct } from '@/types/stock';

interface ProductSelectProps {
  products: StockProduct[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  showCategory?: boolean;
}

export function ProductSelect({
  products,
  value,
  onChange,
  disabled = false,
  placeholder = 'Seleccionar producto',
  showCategory = true,
}: ProductSelectProps) {
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
      {products.map((product) => (
        <option key={product.id} value={product.id}>
          {product.name}
          {showCategory && ` (${product.category})`}
        </option>
      ))}
    </select>
  );
}
