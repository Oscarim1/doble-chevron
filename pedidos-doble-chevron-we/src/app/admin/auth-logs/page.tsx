'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  HiShieldCheck,
  HiShieldExclamation,
  HiUserGroup,
  HiGlobe,
  HiDesktopComputer,
  HiDeviceMobile,
  HiRefresh,
  HiArrowLeft,
} from 'react-icons/hi'
import Link from 'next/link'
import { getUserRoleFromToken } from '@/utils/auth'
import {
  useAuthLogsDashboard,
  AuthEventType,
  AuthLog,
  DeviceInfo,
  TopIp,
  DailyActivity,
} from '@/hooks/useAuthLogs'

// Configuracion visual por tipo de evento
const EVENT_CONFIG: Record<AuthEventType, { label: string; color: string; bgColor: string }> = {
  login_success: { label: 'Login OK', color: 'text-green-700', bgColor: 'bg-green-100' },
  login_failed: { label: 'Fallido', color: 'text-red-700', bgColor: 'bg-red-100' },
  logout: { label: 'Logout', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  register: { label: 'Registro', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  refresh_token: { label: 'Refresh', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
}

function EventBadge({ type }: { type: AuthEventType }) {
  const config = EVENT_CONFIG[type] || EVENT_CONFIG.login_success
  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${config.bgColor} ${config.color}`}>
      {config.label}
    </span>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: 'green' | 'red' | 'blue' | 'purple' | 'orange' | 'gray'
}) {
  const colors = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    gray: 'bg-gray-500',
  }
  return (
    <div className="bg-white rounded-2xl shadow p-5 flex items-center gap-4">
      <div className={`${colors[color]} text-white p-3 rounded-xl`}>
        <Icon className="text-2xl" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-900">{value.toLocaleString('es-CL')}</p>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
  })
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gray-200 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-16 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  )
}

function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden animate-pulse">
      <div className="h-12 bg-gray-100" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-t border-gray-100">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-40 bg-gray-200 rounded flex-1" />
          <div className="h-4 w-28 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  )
}

export default function AuthLogsPage() {
  const router = useRouter()
  const [days, setDays] = useState(7)
  const { data, loading, error, refetch } = useAuthLogsDashboard(days)

  useEffect(() => {
    const role = getUserRoleFromToken()
    if (role !== 'admin') {
      router.replace('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="text-gray-500 hover:text-orange-600 transition"
              >
                <HiArrowLeft size={24} />
              </Link>
              <h1 className="text-3xl font-extrabold text-gray-900">
                Registro de Accesos
              </h1>
            </div>
            <p className="text-gray-500 mt-1 ml-9">Monitoreo de autenticacion y seguridad</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white font-semibold text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            >
              <option value={7}>Ultimos 7 dias</option>
              <option value={14}>Ultimos 14 dias</option>
              <option value={30}>Ultimos 30 dias</option>
            </select>

            <button
              onClick={refetch}
              disabled={loading}
              className="p-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition disabled:opacity-50"
            >
              <HiRefresh className={`text-xl ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Error State */}
        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between gap-4">
            <p className="font-semibold text-red-600">{error}</p>
            <button
              onClick={refetch}
              className="px-4 py-2 rounded-lg font-bold text-white bg-red-500 hover:bg-red-600 transition"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <StatCard
                title="Logins Exitosos"
                value={data?.stats.successful_logins ?? 0}
                icon={HiShieldCheck}
                color="green"
              />
              <StatCard
                title="Logins Fallidos"
                value={data?.stats.failed_logins ?? 0}
                icon={HiShieldExclamation}
                color="red"
              />
              <StatCard
                title="IPs Unicas"
                value={data?.stats.unique_ips ?? 0}
                icon={HiGlobe}
                color="blue"
              />
              <StatCard
                title="Usuarios Activos"
                value={data?.stats.unique_users ?? 0}
                icon={HiUserGroup}
                color="purple"
              />
            </>
          )}
        </section>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Daily Activity Chart (simple bars) */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-extrabold text-gray-900 mb-4">Actividad Diaria</h2>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-12 h-4 bg-gray-200 rounded" />
                    <div className="flex-1 h-6 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {data?.dailyActivity.slice(-7).map((day: DailyActivity) => {
                  const maxTotal = Math.max(...(data?.dailyActivity.map((d) => d.total) ?? [1]))
                  const successWidth = maxTotal > 0 ? (day.successful / maxTotal) * 100 : 0
                  const failedWidth = maxTotal > 0 ? (day.failed / maxTotal) * 100 : 0

                  return (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="w-12 text-xs font-medium text-gray-500 shrink-0">
                        {formatShortDate(day.date)}
                      </span>
                      <div className="flex-1 flex h-6 bg-gray-100 rounded-lg overflow-hidden">
                        {successWidth > 0 && (
                          <div
                            className="bg-green-500 flex items-center justify-center"
                            style={{ width: `${successWidth}%` }}
                          >
                            <span className="text-xs text-white font-bold">
                              {day.successful > 0 ? day.successful : ''}
                            </span>
                          </div>
                        )}
                        {failedWidth > 0 && (
                          <div
                            className="bg-red-500 flex items-center justify-center"
                            style={{ width: `${failedWidth}%` }}
                          >
                            <span className="text-xs text-white font-bold">
                              {day.failed > 0 ? day.failed : ''}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="w-8 text-xs font-bold text-gray-700 text-right">
                        {day.total}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="flex gap-4 mt-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-500" /> Exitosos
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-500" /> Fallidos
              </span>
            </div>
          </div>

          {/* Devices */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-extrabold text-gray-900 mb-4">Dispositivos</h2>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-32 bg-gray-200 rounded" />
                      <div className="h-3 w-24 bg-gray-200 rounded" />
                    </div>
                    <div className="h-5 w-8 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {data?.devices.slice(0, 5).map((device: DeviceInfo, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      {device.device_type === 'mobile' ? (
                        <HiDeviceMobile className="text-blue-600 text-xl" />
                      ) : (
                        <HiDesktopComputer className="text-blue-600 text-xl" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {device.os || 'Desconocido'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {device.browser || 'Navegador desconocido'}
                      </p>
                    </div>
                    <span className="font-bold text-gray-700 bg-gray-200 px-2 py-1 rounded-lg text-sm">
                      {device.count}
                    </span>
                  </div>
                ))}
                {(!data?.devices || data.devices.length === 0) && (
                  <p className="text-gray-400 text-center py-4">Sin datos de dispositivos</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Top IPs */}
        <section className="bg-white rounded-2xl shadow overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-extrabold text-gray-900">IPs mas Frecuentes</h2>
          </div>
          {loading ? (
            <SkeletonTable rows={3} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Accesos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Usuarios
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Ultimo acceso
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.topIps.map((ip: TopIp) => (
                    <tr key={ip.ip_address} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-sm text-gray-900">
                        {ip.ip_address}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900">{ip.access_count}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-700">{ip.users_count}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(ip.last_access)}
                      </td>
                    </tr>
                  ))}
                  {(!data?.topIps || data.topIps.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                        Sin datos de IPs
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent Logins */}
        <section className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-extrabold text-gray-900">Ultimos Accesos</h2>
          </div>
          {loading ? (
            <SkeletonTable rows={10} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Evento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Dispositivo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.recentLogins.map((log: AuthLog) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {log.username || 'Sin nombre'}
                          </p>
                          <p className="text-xs text-gray-500">{log.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <EventBadge type={log.event_type} />
                        {log.failure_reason && (
                          <p className="text-xs text-red-500 mt-1">{log.failure_reason}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-gray-600">
                        {log.ip_address}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <p>{log.sistema_operativo || 'Desconocido'}</p>
                        <p className="text-xs text-gray-400">{log.navegador || '-'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                    </tr>
                  ))}
                  {(!data?.recentLogins || data.recentLogins.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        Sin registros de acceso
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
