'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  HiArrowLeft,
  HiArrowRight,
  HiCurrencyDollar,
  HiCreditCard,
  HiTruck,
  HiCheckCircle,
  HiExclamationCircle,
  HiCalendar,
  HiClock,
  HiDocumentText,
  HiRefresh,
  HiInformationCircle,
  HiX,
} from 'react-icons/hi'
import { fetchWithAuth, getApiUrl } from '@/utils/api'
import { getUserRoleFromToken } from '@/utils/auth'

const POR_PAGINA = 8

interface CierreCaja {
  id: string
  fecha: string
  total_efectivo: string
  total_maquinas: string
  salidas_efectivo: string
  ingresos_efectivo: string
  usuario_id: string
  observacion: string | null
  is_active: number
  created_at: string
  updated_at: string
  informe_id: string | null
  monto_declarado_efectivo: string | null
  monto_declarado_tarjeta: string | null
  monto_declarado_pedidos_ya: string | null
  informe_created_at: string | null
}

function formatCLP(value: string | null): string {
  if (value === null || value === undefined) return '—'
  const num = parseFloat(value)
  if (isNaN(num)) return '—'
  return '$' + Math.round(num).toLocaleString('es-CL')
}

function formatFecha(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Santiago' })
}

function formatHora(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago' })
}

function getMesAnio(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric', timeZone: 'America/Santiago' })
}

function getDiferencia(sistema: string | null, declarado: string | null): number | null {
  if (sistema === null || declarado === null) return null
  return parseFloat(declarado) - parseFloat(sistema)
}

function DiferenciaBadge({ sistema, declarado }: { sistema: string | null; declarado: string | null }) {
  const diff = getDiferencia(sistema, declarado)
  if (diff === null) return null

  const abs = Math.abs(diff)
  const isExact = abs < 1
  const isOver = diff > 0

  if (isExact) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
        <HiCheckCircle className="text-sm" /> Cuadra
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 border ${
      isOver ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-red-700 bg-red-50 border-red-200'
    }`}>
      <HiExclamationCircle className="text-sm" />
      {isOver ? '+' : ''}{Math.round(diff).toLocaleString('es-CL')}
    </span>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded w-40" />
          <div className="h-4 bg-gray-200 rounded w-28" />
        </div>
        <div className="h-6 bg-gray-200 rounded-full w-24" />
      </div>
      <div className="grid grid-cols-3 gap-3 mt-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-16" />
            <div className="h-5 bg-gray-200 rounded w-24" />
            <div className="h-3 bg-gray-200 rounded w-20" />
            <div className="h-5 bg-gray-200 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

function CierreCard({ cierre }: { cierre: CierreCaja }) {
  const tieneInforme = cierre.informe_id !== null

  const difEfectivo = getDiferencia(cierre.total_efectivo, cierre.monto_declarado_efectivo)
  const totalSistemaMaquinas = (parseFloat(cierre.total_maquinas || '0')).toString()
  const totalDeclaradoMaquinas =
    cierre.monto_declarado_tarjeta !== null && cierre.monto_declarado_pedidos_ya !== null
      ? (parseFloat(cierre.monto_declarado_tarjeta) + parseFloat(cierre.monto_declarado_pedidos_ya)).toString()
      : null

  const hayDiscrepancia =
    tieneInforme &&
    ((difEfectivo !== null && Math.abs(difEfectivo) >= 1) ||
      (getDiferencia(totalSistemaMaquinas, totalDeclaradoMaquinas) !== null &&
        Math.abs(getDiferencia(totalSistemaMaquinas, totalDeclaradoMaquinas)!) >= 1))

  return (
    <article className="bg-white rounded-2xl shadow hover:shadow-md transition-shadow p-6 flex flex-col gap-4">
      <div className="flex flex-wrap justify-between items-start gap-2">
        <div>
          <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
            <HiCalendar className="text-orange-400" />
            {formatFecha(cierre.fecha)}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 font-medium">
            <span className="flex items-center gap-1">
              <HiClock /> Realizado {formatHora(cierre.created_at)}
            </span>
            {tieneInforme && cierre.informe_created_at && (
              <span className="flex items-center gap-1">
                <HiDocumentText /> Informe {formatHora(cierre.informe_created_at)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hayDiscrepancia && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
              <HiExclamationCircle /> Diferencias
            </span>
          )}
          {tieneInforme ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
              <HiCheckCircle /> Con informe
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-1">
              <HiInformationCircle /> Sin informe
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-wide mb-2">
            <HiCurrencyDollar /> Efectivo
          </div>
          <div className="space-y-1.5">
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Sistema</p>
              <p className="text-base font-extrabold text-gray-800">{formatCLP(cierre.total_efectivo)}</p>
            </div>
            {cierre.ingresos_efectivo && parseFloat(cierre.ingresos_efectivo) > 0 && (
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Ingresos</p>
                <p className="text-sm font-bold text-emerald-600">+{formatCLP(cierre.ingresos_efectivo)}</p>
              </div>
            )}
            {cierre.salidas_efectivo && parseFloat(cierre.salidas_efectivo) > 0 && (
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Salidas</p>
                <p className="text-sm font-bold text-red-500">-{formatCLP(cierre.salidas_efectivo)}</p>
              </div>
            )}
            {tieneInforme && (
              <div className="pt-1 border-t border-orange-100">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Declarado</p>
                <p className="text-base font-extrabold text-gray-800">{formatCLP(cierre.monto_declarado_efectivo)}</p>
                <div className="mt-1">
                  <DiferenciaBadge sistema={cierre.total_efectivo} declarado={cierre.monto_declarado_efectivo} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">
            <HiCreditCard /> Tarjeta
          </div>
          <div className="space-y-1.5">
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Sistema</p>
              <p className="text-base font-extrabold text-gray-800">{formatCLP(cierre.total_maquinas)}</p>
            </div>
            {tieneInforme && (
              <div className="pt-1 border-t border-blue-100">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Declarado</p>
                <p className="text-base font-extrabold text-gray-800">{formatCLP(cierre.monto_declarado_tarjeta)}</p>
                <div className="mt-1">
                  <DiferenciaBadge sistema={cierre.total_maquinas} declarado={cierre.monto_declarado_tarjeta} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 uppercase tracking-wide mb-2">
            <HiTruck /> PedidosYa
          </div>
          <div className="space-y-1.5">
            {tieneInforme ? (
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Declarado</p>
                <p className="text-base font-extrabold text-gray-800">{formatCLP(cierre.monto_declarado_pedidos_ya)}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 font-medium">Sin informe</p>
            )}
          </div>
        </div>
      </div>

      {cierre.observacion && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 flex gap-2 items-start">
          <HiDocumentText className="text-gray-400 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-600 font-medium">{cierre.observacion}</p>
        </div>
      )}
    </article>
  )
}

function Paginador({
  pagina,
  total,
  porPagina,
  onChange,
}: {
  pagina: number
  total: number
  porPagina: number
  onChange: (p: number) => void
}) {
  const totalPaginas = Math.ceil(total / porPagina)
  if (totalPaginas <= 1) return null

  const desde = (pagina - 1) * porPagina + 1
  const hasta = Math.min(pagina * porPagina, total)

  return (
    <div className="flex items-center justify-between bg-white rounded-2xl shadow px-5 py-3">
      <p className="text-sm text-gray-500 font-medium">
        Mostrando <span className="font-bold text-gray-700">{desde}–{hasta}</span> de{' '}
        <span className="font-bold text-gray-700">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(pagina - 1)}
          disabled={pagina === 1}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <HiArrowLeft />
        </button>
        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-xl text-sm font-bold transition ${
              p === pagina
                ? 'bg-orange-500 text-white shadow'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onChange(pagina + 1)}
          disabled={pagina === totalPaginas}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <HiArrowRight />
        </button>
      </div>
    </div>
  )
}

export default function CierresCajaPage() {
  const router = useRouter()
  const [cierres, setCierres] = useState<CierreCaja[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mesSeleccionado, setMesSeleccionado] = useState<string>('')
  const [pagina, setPagina] = useState(1)

  useEffect(() => {
    const role = getUserRoleFromToken()
    if (role !== 'admin') router.replace('/login')
  }, [router])

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const apiUrl = getApiUrl()
      const res = await fetchWithAuth(`${apiUrl}/api/cierres-caja/con-informe`)
      if (!res.ok) throw new Error(await res.text())
      const data: CierreCaja[] = await res.json()
      data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      setCierres(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar los cierres')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // Opciones únicas de mes/año para el selector
  const opcionesMes = useMemo(() => {
    const vistas = new Set<string>()
    cierres.forEach(c => vistas.add(getMesAnio(c.fecha)))
    return Array.from(vistas)
  }, [cierres])

  // Filtrado por mes
  const cierresFiltrados = useMemo(() => {
    if (!mesSeleccionado) return cierres
    return cierres.filter(c => getMesAnio(c.fecha) === mesSeleccionado)
  }, [cierres, mesSeleccionado])

  // Reset de página al cambiar filtro
  useEffect(() => { setPagina(1) }, [mesSeleccionado])

  // Slice de la página actual
  const cierresVisibles = useMemo(() => {
    const inicio = (pagina - 1) * POR_PAGINA
    return cierresFiltrados.slice(inicio, inicio + POR_PAGINA)
  }, [cierresFiltrados, pagina])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 py-8 px-4">
      <div className="max-w-4xl mx-auto flex flex-col gap-5">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-white shadow hover:shadow-md transition text-gray-500 hover:text-gray-700"
            >
              <HiArrowLeft className="text-xl" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Historial de Cierres</h1>
              <p className="text-sm text-gray-500 mt-0.5">Cierres de caja realizados con su informe</p>
            </div>
          </div>
          <button
            onClick={cargar}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow text-sm font-semibold text-gray-600 hover:text-orange-600 hover:shadow-md transition disabled:opacity-50"
          >
            <HiRefresh className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </header>

        {/* Filtro por mes */}
        {!loading && cierres.length > 0 && (
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">
              Filtrar por mes:
            </label>
            <div className="relative flex items-center">
              <select
                value={mesSeleccionado}
                onChange={e => setMesSeleccionado(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-8 text-sm font-semibold text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition capitalize cursor-pointer"
              >
                <option value="">Todos los meses</option>
                {opcionesMes.map(mes => (
                  <option key={mes} value={mes} className="capitalize">{mes}</option>
                ))}
              </select>
              <HiCalendar className="pointer-events-none absolute right-2.5 text-gray-400 text-sm" />
            </div>
            {mesSeleccionado && (
              <button
                onClick={() => setMesSeleccionado('')}
                className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-gray-600 transition"
              >
                <HiX /> Limpiar
              </button>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 font-semibold text-sm flex items-center gap-2">
            <HiExclamationCircle className="text-xl shrink-0" />
            {error}
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Vacío */}
        {!loading && !error && cierresFiltrados.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
            <HiDocumentText className="text-4xl mx-auto mb-3 text-gray-300" />
            <p className="font-semibold">
              {mesSeleccionado ? `Sin cierres en ${mesSeleccionado}` : 'No hay cierres de caja registrados'}
            </p>
          </div>
        )}

        {/* Cards */}
        {!loading && cierresVisibles.length > 0 && (
          <div className="flex flex-col gap-4">
            {cierresVisibles.map(c => <CierreCard key={c.id} cierre={c} />)}
          </div>
        )}

        {/* Paginador */}
        {!loading && (
          <Paginador
            pagina={pagina}
            total={cierresFiltrados.length}
            porPagina={POR_PAGINA}
            onChange={setPagina}
          />
        )}
      </div>
    </div>
  )
}
