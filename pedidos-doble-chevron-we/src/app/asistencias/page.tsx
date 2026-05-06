'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithAuth, getApiUrl } from '@/utils/api'
import { getUserIdFromToken, getUserRoleFromToken } from '@/utils/auth'
import { HiClock, HiCheckCircle } from 'react-icons/hi'

function getTodayLocal(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatHora(value: string | null): string {
  if (!value) return '--:--'

  // Si es solo hora (HH:mm:ss o HH:mm), mostrar directamente
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(value)) {
    const parts = value.split(':')
    return `${parts[0].padStart(2, '0')}:${parts[1]}`
  }

  // Si es timestamp ISO, parsear
  const date = new Date(value)
  if (isNaN(date.getTime())) return '--:--'
  return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

interface Asistencia {
  id: string
  usuario_id: string
  fecha: string
  horario_entrada: string | null
  horario_salida: string | null
  horario_inicio_colacion: string | null
  horario_fin_colacion: string | null
  created_at: string
  updated_at: string
}

export default function AsistenciasPage() {
  const [asistencia, setAsistencia] = useState<Asistencia | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const role = getUserRoleFromToken()

    // Admin va a la pagina de control de asistencias
    if (role === 'admin') {
      router.replace('/admin/asistencias')
      return
    }

    // Trabajadores ven su asistencia del dia (solo lectura)
    if (role !== 'trabajador') {
      router.replace('/login')
      return
    }

    const userId = getUserIdFromToken()
    if (!userId) {
      router.replace('/login')
      return
    }

    const today = getTodayLocal()
    const apiUrl = getApiUrl()

    fetchWithAuth(`${apiUrl}/api/asistencias/${today}/${userId}`)
      .then(async (res) => {
        if (res.status === 404) return null
        if (!res.ok) return null
        const data = await res.json()
        if ('message' in data) return null
        return data as Asistencia
      })
      .then((data) => setAsistencia(data))
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 py-8 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow p-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mx-auto mb-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const tieneAsistencia = asistencia?.horario_entrada

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow p-6 flex flex-col gap-5">
        <h1 className="text-2xl font-extrabold text-center text-gray-900">Mi Asistencia</h1>

        {/* Info: solo lectura */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
          <p className="text-sm font-semibold text-orange-700">
            El administrador es quien registra tu asistencia
          </p>
        </div>

        {/* Estado del dia */}
        {!tieneAsistencia ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-16 h-16 rounded-full bg-gray-100 grid place-items-center">
              <HiClock className="text-3xl text-gray-400" />
            </div>
            <p className="font-semibold text-gray-500">Sin registro de asistencia hoy</p>
            <p className="text-sm text-gray-400">
              Tu entrada sera marcada por el administrador
            </p>
          </div>
        ) : (
          <>
            {/* Indicador de estado */}
            <div className="flex items-center justify-center gap-3 py-2">
              {asistencia?.horario_salida ? (
                <span className="px-4 py-2 rounded-full bg-gray-100 text-gray-600 font-bold text-sm flex items-center gap-2">
                  <HiCheckCircle className="text-gray-500" />
                  Jornada finalizada
                </span>
              ) : (
                <span className="px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold text-sm animate-pulse">
                  En turno
                </span>
              )}
            </div>

            {/* Horarios */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-4 rounded-xl text-center ${asistencia?.horario_entrada ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-100'}`}>
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Entrada</div>
                <div className={`text-xl font-bold ${asistencia?.horario_entrada ? 'text-green-700' : 'text-gray-300'}`}>
                  {formatHora(asistencia?.horario_entrada ?? null)}
                </div>
              </div>
              <div className={`p-4 rounded-xl text-center ${asistencia?.horario_salida ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-100'}`}>
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Salida</div>
                <div className={`text-xl font-bold ${asistencia?.horario_salida ? 'text-red-700' : 'text-gray-300'}`}>
                  {formatHora(asistencia?.horario_salida ?? null)}
                </div>
              </div>
              <div className={`p-4 rounded-xl text-center ${asistencia?.horario_inicio_colacion ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-100'}`}>
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Inicio Colacion</div>
                <div className={`text-xl font-bold ${asistencia?.horario_inicio_colacion ? 'text-yellow-700' : 'text-gray-300'}`}>
                  {formatHora(asistencia?.horario_inicio_colacion ?? null)}
                </div>
              </div>
              <div className={`p-4 rounded-xl text-center ${asistencia?.horario_fin_colacion ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-100'}`}>
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Fin Colacion</div>
                <div className={`text-xl font-bold ${asistencia?.horario_fin_colacion ? 'text-blue-700' : 'text-gray-300'}`}>
                  {formatHora(asistencia?.horario_fin_colacion ?? null)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
