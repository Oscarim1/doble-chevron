export type Period = 'day' | 'week' | 'month';

export interface DashboardMeta {
  period: Period;
  from: string;
  to: string;
  timezone: string;
}

export interface KPIs {
  totalVentas: number;
  totalEfectivo: number;
  totalTarjeta: number;
  pedidos: number;
  ticketPromedio: number;
  mixPago: {
    pctEfectivo: number;
    pctTarjeta: number;
  };
}

export interface Series {
  labels: string[];
  ventas: number[];
  pedidos: number[];
}

export interface Categoria {
  category: string;
  unidades: number;
  total: number;
}

export interface TopProducto {
  name: string;
  category: string;
  sub_category: string;
  unidades: number;
  total: number;
}

export interface Pedido {
  order_number: number;
  fecha_hora: string;
  metodo_pago: 'efectivo' | 'tarjeta';
  total: number;
}

export interface Trabajador {
  id: string;
  nombre: string;
  fecha: string;
  horario_entrada: string;
  horario_salida: string | null;
}

export interface Asistencia {
  trabajadoresAsistieron: number;
  trabajadores?: Trabajador[];
}

export interface DashboardData {
  meta: DashboardMeta;
  kpis: KPIs;
  series: Series;
  categorias: Categoria[];
  topProductos: TopProducto[];
  ultimosPedidos: Pedido[];
  asistencia: Asistencia;
}

export interface DashboardState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}
