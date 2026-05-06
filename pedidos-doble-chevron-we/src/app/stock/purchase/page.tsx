'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HiArrowLeft, HiCheck } from 'react-icons/hi';
import { getUserRoleFromToken } from '@/utils/auth';
import { useProducts, useLocations, createPurchase } from '@/hooks/useStock';
import { ProductSelect, LocationSelect } from '@/app/components/stock';

export default function PurchasePage() {
  const router = useRouter();
  const { data: products, loading: loadingProducts } = useProducts();
  const { data: locations, loading: loadingLocations } = useLocations();

  const [productId, setProductId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const role = getUserRoleFromToken();
    if (role !== 'admin') {
      router.replace('/login');
    }
  }, [router]);

  // Auto-select bodega if there's one
  useEffect(() => {
    if (locations && locations.length > 0 && !locationId) {
      const bodega = locations.find((loc) => loc.type === 'bodega');
      if (bodega) {
        setLocationId(bodega.id);
      }
    }
  }, [locations, locationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !locationId || !quantity) return;

    setSubmitting(true);
    setError(null);
    try {
      await createPurchase({
        product_id: productId,
        location_id: locationId,
        quantity: parseInt(quantity),
        notes: notes || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/stock');
      }, 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setProductId('');
    setQuantity('');
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
          <h1 className="text-3xl font-extrabold text-gray-900">Registrar Compra</h1>
        </header>

        {/* Success State */}
        {success ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 grid place-items-center mx-auto mb-4">
              <HiCheck className="text-green-600 text-3xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Compra Registrada</h2>
            <p className="text-gray-500">Redirigiendo al dashboard...</p>
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
                Producto
              </label>
              <ProductSelect
                products={products || []}
                value={productId}
                onChange={setProductId}
                disabled={loadingProducts}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Ubicacion destino
              </label>
              <LocationSelect
                locations={locations || []}
                value={locationId}
                onChange={setLocationId}
                disabled={loadingLocations}
                filterType="bodega"
              />
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
                className="w-full px-4 py-3 rounded-xl border border-gray-200 font-semibold text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="Ej: 24"
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
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 font-semibold text-gray-900 resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="Ej: Compra proveedor X"
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
                disabled={submitting || !productId || !locationId || !quantity}
                className="flex-1 py-3 rounded-xl bg-green-500 font-bold text-white hover:bg-green-600 disabled:opacity-50 transition"
              >
                {submitting ? 'Registrando...' : 'Registrar Compra'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
