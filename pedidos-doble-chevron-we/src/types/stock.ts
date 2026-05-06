// Tipos de movimiento de stock
export type MovementType =
  | 'compra_proveedor'
  | 'reposicion'
  | 'venta'
  | 'consumo_empleado'
  | 'ajuste'
  | 'merma';

// Tipos de ubicación
export type LocationType = 'bodega' | 'vitrina' | 'maquina' | 'local';

// Ubicación de stock
export interface StockLocation {
  id: string;
  name: string;
  type: LocationType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Producto (para selects)
export interface StockProduct {
  id: string;
  name: string;
  category: string;
  price: number;
}

// Empleado (para selects)
export interface StockEmployee {
  id: string;
  name: string;
  email: string;
}

// Item de stock en una ubicación
export interface StockItem {
  product_id: string;
  product_name: string;
  category: string;
  quantity: number;
  min_quantity: number;
  low_stock: number; // 1 si está bajo, 0 si no
  location_name: string;
}

// Resumen de stock por ubicación (para dashboard)
export interface StockSummary {
  location_id: string;
  location_name: string;
  location_type: LocationType;
  total_products: number;
  total_units: number;
  low_stock_count: number;
}

// Movimiento de stock
export interface StockMovement {
  id: string;
  product_name: string;
  from_location_name: string | null;
  to_location_name: string | null;
  quantity: number;
  type: MovementType;
  user_name: string;
  employee_id: string | null;
  employee_name: string | null;
  notes: string | null;
  created_at: string;
}

// Reporte de consumo de empleado
export interface EmployeeConsumptionReport {
  employee_id: string;
  employee_name: string;
  product_id: string;
  product_name: string;
  category: string;
  total_consumed: number;
  times_consumed: number;
}

// Payloads para crear movimientos
export interface PurchasePayload {
  product_id: string;
  location_id: string;
  quantity: number;
  notes?: string;
}

export interface RestockPayload {
  product_id: string;
  from_location_id: string;
  to_location_id: string;
  quantity: number;
  notes?: string;
}

export interface EmployeeConsumptionPayload {
  product_id: string;
  location_id: string;
  quantity: number;
  employee_id: string;
  notes?: string;
}

// Payload para crear/actualizar ubicación
export interface LocationPayload {
  name: string;
  type: LocationType;
}

// Filtros para historial de movimientos
export interface MovementFilters {
  type?: MovementType | '';
  product_id?: string;
  location_id?: string;
  employee_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

// Configuración visual de tipo de movimiento
export interface MovementTypeConfig {
  type: MovementType;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}
