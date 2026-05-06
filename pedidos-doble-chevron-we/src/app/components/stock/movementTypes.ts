import type { MovementType, MovementTypeConfig } from '@/types/stock';

export const MOVEMENT_TYPES: MovementTypeConfig[] = [
  {
    type: 'compra_proveedor',
    label: 'Compra',
    icon: 'HiCube',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
  },
  {
    type: 'reposicion',
    label: 'Reposicion',
    icon: 'HiRefresh',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
  },
  {
    type: 'venta',
    label: 'Venta',
    icon: 'HiCurrencyDollar',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
  },
  {
    type: 'consumo_empleado',
    label: 'Consumo Empleado',
    icon: 'HiUser',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
  },
  {
    type: 'ajuste',
    label: 'Ajuste',
    icon: 'HiCog',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
  },
  {
    type: 'merma',
    label: 'Merma',
    icon: 'HiExclamation',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
  },
];

export function getMovementTypeConfig(type: MovementType): MovementTypeConfig {
  return MOVEMENT_TYPES.find((m) => m.type === type) || MOVEMENT_TYPES[4]; // default: ajuste
}

export function getMovementTypeLabel(type: MovementType): string {
  return getMovementTypeConfig(type).label;
}
