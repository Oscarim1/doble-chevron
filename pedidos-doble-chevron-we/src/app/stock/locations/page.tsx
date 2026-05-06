'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  HiArrowLeft,
  HiPlus,
  HiPencil,
  HiOfficeBuilding,
  HiDesktopComputer,
  HiLocationMarker,
  HiHome,
} from 'react-icons/hi';
import { getUserRoleFromToken } from '@/utils/auth';
import { useLocations, createLocation, updateLocation } from '@/hooks/useStock';
import type { StockLocation, LocationType, LocationPayload } from '@/types/stock';

const LOCATION_TYPES: { value: LocationType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'bodega', label: 'Bodega', icon: HiOfficeBuilding },
  { value: 'maquina', label: 'Maquina', icon: HiDesktopComputer },
  { value: 'vitrina', label: 'Vitrina', icon: HiLocationMarker },
  { value: 'local', label: 'Local', icon: HiHome },
];

function getLocationIcon(type: LocationType) {
  const found = LOCATION_TYPES.find((t) => t.value === type);
  return found?.icon || HiLocationMarker;
}

export default function LocationsPage() {
  const router = useRouter();
  const { data: locations, loading, error, refetch } = useLocations();

  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StockLocation | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<LocationType>('bodega');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const role = getUserRoleFromToken();
    if (role !== 'admin') {
      router.replace('/login');
    }
  }, [router]);

  const handleOpenCreate = () => {
    setEditingLocation(null);
    setFormName('');
    setFormType('bodega');
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (location: StockLocation) => {
    setEditingLocation(location);
    setFormName(location.name);
    setFormType(location.type);
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLocation(null);
    setFormName('');
    setFormType('bodega');
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('El nombre es requerido');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload: LocationPayload = {
      name: formName.trim(),
      type: formType,
    };

    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, payload);
      } else {
        await createLocation(payload);
      }
      handleCloseModal();
      refetch();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/stock" className="p-2 rounded-lg hover:bg-white transition">
              <HiArrowLeft className="text-xl text-gray-600" />
            </Link>
            <h1 className="text-3xl font-extrabold text-gray-900">Ubicaciones</h1>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition"
          >
            <HiPlus />
            Nueva
          </button>
        </header>

        {/* Error State */}
        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="font-semibold text-red-600">{error}</p>
          </div>
        )}

        {/* Locations List */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {loading ? (
            <div className="p-5 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-5 w-32 rounded bg-gray-200 animate-pulse mb-2" />
                    <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : locations && locations.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {locations.map((location) => {
                const Icon = getLocationIcon(location.type);
                return (
                  <li
                    key={location.id}
                    className="p-5 flex items-center justify-between hover:bg-orange-50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-100 border border-orange-200 grid place-items-center">
                        <Icon className="text-orange-600 text-xl" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{location.name}</div>
                        <div className="text-sm text-gray-500 capitalize">{location.type}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          location.is_active
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}
                      >
                        {location.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                      <button
                        onClick={() => handleOpenEdit(location)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-orange-600 transition"
                      >
                        <HiPencil />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-12 text-center">
              <HiLocationMarker className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="font-semibold text-gray-400">No hay ubicaciones</p>
              <p className="text-sm text-gray-400 mt-1">Crea una ubicacion para empezar</p>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-extrabold text-gray-900 mb-4">
                {editingLocation ? 'Editar Ubicacion' : 'Nueva Ubicacion'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm font-semibold text-red-600">{formError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nombre</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-semibold focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    placeholder="Ej: Bodega Principal"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tipo</label>
                  <div className="grid grid-cols-2 gap-3">
                    {LOCATION_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormType(type.value)}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 font-semibold transition ${
                          formType === type.value
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <type.icon className="text-lg" />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 rounded-xl bg-orange-500 font-bold text-white hover:bg-orange-600 disabled:opacity-50 transition"
                  >
                    {submitting ? 'Guardando...' : editingLocation ? 'Guardar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
