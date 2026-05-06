'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HiArrowLeft, HiCheck } from 'react-icons/hi';
import { getUserRoleFromToken } from '@/utils/auth';
import {
  useProducts,
  useLocations,
  useEmployees,
  useStockByLocation,
  createEmployeeConsumption,
} from '@/hooks/useStock';
import { ProductSelect, LocationSelect, EmployeeSelect } from '@/app/components/stock';

export default function EmployeeConsumptionPage() {
  const router = useRouter();
  const { data: products, loading: loadingProducts } = useProducts();
  const { data: locations, loading: loadingLocations } = useLocations();
  const { data: employees, loading: loadingEmployees } = useEmployees();

  const [employeeId, setEmployeeId] = useState('');
  const [productId, setProductId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get stock from location to show available products
  const { data: locationStock } = useStockByLocation(locationId);

  useEffect(() => {
    const role = getUserRoleFromToken();
    if (role !== 'admin') {
      router.replace('/login');
    }
  }, [router]);

  // Auto-select maquina location
  useEffect(() => {
    if (locations && locations.length > 0 && !locationId) {
      const maquina = locations.find((loc) => loc.type === 'maquina');
      if (maquina) setLocationId(maquina.id);
    }
  }, [locations, locationId]);

  // Filter products with stock > 0 in the selected location
  const availableProducts = locationStock
    ? products?.filter((p) => {
        const stockItem = locationStock.find((s) => s.product_id === p.id);
        return stockItem && stockItem.quantity > 0;
      }) || []
    : products || [];

  const selectedProductStock = locationStock?.find((s) => s.product_id === productId);
  const availableStock = selectedProductStock?.quantity || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !productId || !locationId || !quantity) return;

    const quantityNum = parseInt(quantity);
    if (quantityNum > availableStock) {
      setError(`Solo hay ${availableStock} unidades disponibles`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createEmployeeConsumption({
        employee_id: employeeId,
        product_id: productId,
        location_id: locationId,
        quantity: quantityNum,
        notes: notes || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        // Reset for another entry
        setSuccess(false);
        setProductId('');
        setQuantity('1');
        setNotes('');
      }, 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setEmployeeId('');
    setProductId('');
    setQuantity('1');
    setNotes('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 mb-6">
          <Link href="/stock" className="p-2 rounded-lg hover:bg-white transition">
            <HiArrowLeft className="text-xl text-gray-600" />
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900">Consumo Empleado</h1>
        </header>

        {/* Success State */}
        {success ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 grid place-items-center mx-auto mb-4">
              <HiCheck className="text-orange-600 text-3xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Consumo Registrado</h2>
            <p className="text-gray-500">Puedes registrar otro consumo...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="font-semibold text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Empleado
              </label>
              <EmployeeSelect
                employees={employees || []}
                value={employeeId}
                onChange={setEmployeeId}
                disabled={loadingEmployees}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Ubicacion
              </label>
              <LocationSelect
                locations={locations || []}
                value={locationId}
                onChange={(val) => {
                  setLocationId(val);
                  setProductId(''); // Reset product when location changes
                }}
                disabled={loadingLocations}
                filterType="maquina"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Producto
              </label>
              <ProductSelect
                products={availableProducts}
                value={productId}
                onChange={setProductId}
                disabled={loadingProducts || !locationId}
                placeholder={!locationId ? 'Selecciona ubicacion primero' : 'Seleccionar producto'}
              />
              {productId && (
                <p className="mt-1 text-sm text-gray-500">
                  Stock disponible: <span className="font-bold">{availableStock}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Cantidad
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                max={availableStock || 99}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 font-semibold text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 font-semibold text-gray-900 resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="Ej: Turno mañana"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                Limpiar
              </button>
              <button
                type="submit"
                disabled={submitting || !employeeId || !productId || !locationId || !quantity}
                className="flex-1 py-3 rounded-xl bg-orange-500 font-bold text-white hover:bg-orange-600 disabled:opacity-50 transition"
              >
                {submitting ? 'Registrando...' : 'Registrar Consumo'}
              </button>
            </div>
          </form>
        )}

        {/* Quick link to report */}
        <div className="mt-4 text-center">
          <Link
            href="/stock/reports/employees"
            className="text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            Ver reporte de consumos
          </Link>
        </div>
      </div>
    </div>
  );
}
