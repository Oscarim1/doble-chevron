'use client';

import {
  HiCube,
  HiRefresh,
  HiCurrencyDollar,
  HiUser,
  HiCog,
  HiExclamation,
} from 'react-icons/hi';
import { getMovementTypeConfig } from './movementTypes';
import type { MovementType } from '@/types/stock';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  HiCube,
  HiRefresh,
  HiCurrencyDollar,
  HiUser,
  HiCog,
  HiExclamation,
};

interface MovementTypeBadgeProps {
  type: MovementType;
}

export function MovementTypeBadge({ type }: MovementTypeBadgeProps) {
  const config = getMovementTypeConfig(type);
  const Icon = iconMap[config.icon];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${config.bgColor} ${config.color} border ${config.borderColor}`}
    >
      {Icon && <Icon className="text-sm" />}
      {config.label}
    </span>
  );
}
