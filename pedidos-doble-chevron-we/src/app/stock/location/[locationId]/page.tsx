'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { HiArrowLeft } from 'react-icons/hi';
import { getUserRoleFromToken } from '@/utils/auth';
import { useStockByLocation, updateMinQuantity } from '@/hooks/useStock';
import { StockTable } from '@/app/components/stock';
import type { StockItem } from '@/types/stock';

const CATEGORIES = [
  { label: 'Todos', value: '' },
  { label: 'Doble Chevron', value: 'dobleChevron' },
  { label: 'Bebidas', value: 'bebidas' },
  { label: 'Papas', value: 'papas' },
  { label: 'Otros', value: 'otros' },
];

export default function StockByLocationPage() {
  const router = useRouter();
  const params = useParams();
  const locationId = params.locationId as string;

  const [category, setCategory] = useState('');
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [newMinQuantity, setNewMinQuantity] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, loading, error, refetch } = useStockByLocation(locationId);

  useEffect(() => {
    const role = getUserRoleFromToken();
    if (role !== 'admin') {
      router.replace('/login');
    }
  }, [router]);

  const filteredItems =
    data?.filter(
      (item) => !category || item.category.toLowerCase().includes(category.toLowerCase())
    ) || [];

  const locationName = data?.[0]?.location_name || 'Cargando...';

  const handleOpenEditModal = (item: StockItem) => {
    setEditingItem(item);
    setNewMinQuantity(String(item.min_quantity));
    setSaveError(null);
  };

  const handleCloseEditModal = () => {
    setEditingItem(null);
    setNewMinQuantity('');
    setSaveError(null);
  };

  const handleSaveMinQuantity = async () => {
    if (!editingItem) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateMinQuantity(locationId, editingItem.product_id, parseInt(newMinQuantity));
      handleCloseEditModal();
      refetch();
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 mb-6">
          <Link href="/stock" className="p-2 rounded-lg hover:bg-white transition">
            <HiArrowLeft className="text-xl text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Stock por Ubicacion</h1>
            <p className="font-semibold text-gray-500">{locationName}</p>
          </div>
        </header>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-4 py-2 rounded-full font-semibold text-sm transition ${
                category === cat.value
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-orange-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="font-semibold text-red-600">{error}</p>
          </div>
        )}

        {/* Stock Table */}
        <div className="bg-white rounded-2xl shadow p-5">
          <StockTable
            items={filteredItems}
            loading={loading}
            onConfigureMin={handleOpenEditModal}
          />
        </div>

        {/* Edit Min Quantity Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                Configurar Minimo
              </h3>
              <p className="text-gray-600 mb-4">{editingItem.product_name}</p>

              {saveError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm font-semibold text-red-600">{saveError}</p>
                </div>
              )}

              <label className="block text-sm font-bold text-gray-700 mb-2">
                Cantidad minima
              </label>
              <input
                type="number"
                value={newMinQuantity}
                onChange={(e) => setNewMinQuantity(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 font-semibold mb-4 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                min="0"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleCloseEditModal}
                  className="flex-1 py-2 rounded-lg border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveMinQuantity}
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg bg-orange-500 font-bold text-white hover:bg-orange-600 disabled:opacity-50 transition"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
