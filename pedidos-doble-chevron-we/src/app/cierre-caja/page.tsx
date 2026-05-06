'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithAuth, getApiUrl } from '@/utils/api'
import ResumenModal from '../components/ResumenModal'
import AlertaModal from '../components/AlertaModal'
import { getUserIdFromToken, getUserRoleFromToken } from '@/utils/auth'
import { HiCurrencyDollar, HiCreditCard, HiTruck, HiArrowDown, HiArrowUp } from 'react-icons/hi'

interface TotalPorDia {
  fecha: string
  metodo_pago: string
  total_por_dia: string
}

const formatCLP = (value: number) => {
  return value.toLocaleString('es-CL')
}

export default function CierreCajaPage() {
  const [fecha, setFecha] = useState('')
  const [totales, setTotales] = useState<TotalPorDia[]>([])

  const [efectivo, setEfectivo] = useState('')
  const [maquina, setMaquina] = useState('')
  const [pedidosYa, setPedidosYa] = useState('')
  const [salidasEfectivo, setSalidasEfectivo] = useState('')
  const [ingresosEfectivo, setIngresosEfectivo] = useState('')
  const [observacion, setObservacion] = useState('')

  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [showResumen, setShowResumen] = useState(false)
  const [step, setStep] = useState<'seleccion' | 'datos'>('seleccion')

  const [alertaAbierta, setAlertaAbierta] = useState(false)
  const [mensajeAlerta, setMensajeAlerta] = useState('')

  const router = useRouter()
  const efectivoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const role = getUserRoleFromToken()
    if (role !== 'admin') router.replace('/login')
  }, [router])

  useEffect(() => {
    if (step === 'datos' && efectivoRef.current) {
      efectivoRef.current.focus()
    }
  }, [step])

  const obtenerTotales = async () => {
    if (!fecha) return
    setTotales([])
    const apiUrl = getApiUrl();
    try {
      const res = await fetchWithAuth(`${apiUrl}/api/orders/total-por-dia?fecha=${fecha}`)

      if (res.status === 409) {
        setMensajeAlerta('Ya existe un cierre de caja para esta fecha.')
        setAlertaAbierta(true)
        return
      }

      if (!res.ok) throw new Error(await res.text())

      const data = await res.json()

      if (Array.isArray(data) && data.length === 0) {
        setMensajeAlerta('No hay datos de ventas para esta fecha.')
        setAlertaAbierta(true)
        return
      }

      setTotales(data)
      setStep('datos')
    } catch (err) {
      setMensajeAlerta((err as Error).message || 'Error obteniendo totales')
      setAlertaAbierta(true)
    }
  }

  const parseCLPAmount = (val: string | undefined) => {
    if (!val) return 0
    return Number(val.replace(/,/g, '').trim())
  }

  const totalEfectivoApi = parseCLPAmount(
    totales.find(t => t.metodo_pago === 'efectivo')?.total_por_dia,
  )
  const totalMaquinaApi = parseCLPAmount(
    totales.find(t => t.metodo_pago === 'tarjeta')?.total_por_dia,
  )

  const parseInputValue = (val: string): number => {
    if (!val || val.trim() === '') return 0
    // Remover puntos (separador de miles en CLP) y cualquier otro caracter no numerico
    const cleaned = val.replace(/\./g, '').replace(/[^0-9]/g, '')
    if (!cleaned) return 0
    const num = parseInt(cleaned, 10)
    return isNaN(num) ? 0 : num
  }

  const efectivoNum = parseInputValue(efectivo)
  const maquinaNum = parseInputValue(maquina)
  const pedidosYaNum = parseInputValue(pedidosYa)
  const salidasNum = parseInputValue(salidasEfectivo)
  const ingresosNum = parseInputValue(ingresosEfectivo)

  const validarDatos = () => {
    if (efectivoNum < 0 || maquinaNum < 0 || pedidosYaNum < 0 || salidasNum < 0 || ingresosNum < 0) {
      setMensajeAlerta('Los montos deben ser mayores o iguales a 0.')
      setAlertaAbierta(true)
      return false
    }
    return true
  }

  const generarCierre = async () => {
    const userId = getUserIdFromToken()
    if (!fecha || !userId) return

    if (!validarDatos()) return

    const apiUrl = getApiUrl();
    setEnviando(true)
    setMensaje(null)
    try {
      const res = await fetchWithAuth(`${apiUrl}/api/cierres-caja/generar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha,
          monto_declarado_efectivo: efectivoNum,
          monto_declarado_tarjeta: maquinaNum,
          monto_declarado_pedidos_ya: pedidosYaNum,
          salidas_efectivo: salidasNum,
          ingresos_efectivo: ingresosNum,
          usuario_id: userId,
          observacion,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setShowResumen(true)
    } catch (err) {
      setMensaje((err as Error).message || 'Error generando cierre')
    } finally {
      setEnviando(false)
    }
  }

  const cuadrado =
    efectivoNum === totalEfectivoApi &&
    maquinaNum === totalMaquinaApi

  const handleCloseResumen = () => {
    setShowResumen(false)
    setTimeout(() => {
      setStep('seleccion')
      setTotales([])
      setEfectivo('')
      setMaquina('')
      setPedidosYa('')
      setSalidasEfectivo('')
      setIngresosEfectivo('')
      setObservacion('')
      setMensaje(null)
      setFecha('')
    }, 100)
  }

  const formatWithDots = (value: string): string => {
    const num = value.replace(/[^0-9]/g, '')
    if (!num) return ''
    return Number(num).toLocaleString('es-CL')
  }

  const handleInputChange = (
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWithDots(e.target.value)
    setter(formatted)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 py-6 px-4">
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Cierre de caja</h1>

        {step === 'seleccion' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-4">
            <label className="text-sm font-bold text-gray-700">Selecciona la fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 font-semibold focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
            <button
              onClick={obtenerTotales}
              disabled={!fecha}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 transition"
            >
              Continuar
            </button>
          </div>
        )}

        {step === 'datos' && totales.length > 0 && (
          <div className="flex flex-col gap-4">
            {/* Formulario de declaracion */}
            <div className="bg-white rounded-2xl shadow-lg p-5 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                Montos declarados
              </h2>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <HiCurrencyDollar className="text-gray-400" />
                  Total efectivo
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                  <input
                    ref={efectivoRef}
                    type="text"
                    inputMode="numeric"
                    value={efectivo}
                    onChange={handleInputChange(setEfectivo)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 font-semibold text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <HiCreditCard className="text-gray-400" />
                  Total tarjeta
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={maquina}
                    onChange={handleInputChange(setMaquina)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 font-semibold text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <HiTruck className="text-gray-400" />
                  Pedidos Ya
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={pedidosYa}
                    onChange={handleInputChange(setPedidosYa)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 font-semibold text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <HiArrowUp className="text-gray-400" />
                    Salidas
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={salidasEfectivo}
                      onChange={handleInputChange(setSalidasEfectivo)}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 font-semibold text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <HiArrowDown className="text-gray-400" />
                    Ingresos
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={ingresosEfectivo}
                      onChange={handleInputChange(setIngresosEfectivo)}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 font-semibold text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Observacion (opcional)
                </label>
                <textarea
                  value={observacion}
                  onChange={e => setObservacion(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 font-medium resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  placeholder="Notas adicionales..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setStep('seleccion')
                    setTotales([])
                  }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Volver
                </button>
                <button
                  onClick={generarCierre}
                  disabled={enviando}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50 transition"
                >
                  {enviando ? 'Guardando...' : 'Confirmar cierre'}
                </button>
              </div>
            </div>

            {mensaje && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 font-semibold text-sm">{mensaje}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <ResumenModal
        isOpen={showResumen}
        onClose={handleCloseResumen}
        datos={{
          totalSistemaEfectivo: totalEfectivoApi,
          totalSistemaMaquina: totalMaquinaApi,
          declaradoEfectivo: efectivoNum,
          declaradoMaquina: maquinaNum,
          cuadrado,
        }}
      />

      <AlertaModal
        isOpen={alertaAbierta}
        mensaje={mensajeAlerta}
        onClose={() => setAlertaAbierta(false)}
      />
    </div>
  )
}
