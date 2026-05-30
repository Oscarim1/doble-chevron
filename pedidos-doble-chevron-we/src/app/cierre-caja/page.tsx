'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithAuth, getApiUrl } from '@/utils/api'
import ResumenModal from '../components/ResumenModal'
import AlertaModal from '../components/AlertaModal'
import { getUserIdFromToken, getUserRoleFromToken } from '@/utils/auth'
import DCTopbar from '@/app/components/DCTopbar'

interface TotalPorDia {
  fecha: string
  metodo_pago: string
  total_por_dia: string
}

function CurrencyField({
  label, value, onChange, inputRef, icon,
}: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef?: React.Ref<HTMLInputElement>; icon: React.ReactNode;
}) {
  return (
    <div className="field">
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}{label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4A3A30', fontWeight: 700, fontSize: 15 }}>$</span>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={onChange}
          placeholder="0"
          className="dc-input"
          style={{ paddingLeft: 28, fontSize: 17, fontWeight: 700 }}
        />
      </div>
    </div>
  )
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
    if (step === 'datos' && efectivoRef.current) efectivoRef.current.focus()
  }, [step])

  const obtenerTotales = async () => {
    if (!fecha) return
    setTotales([])
    const apiUrl = getApiUrl()
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

  const totalEfectivoApi = parseCLPAmount(totales.find(t => t.metodo_pago === 'efectivo')?.total_por_dia)
  const totalMaquinaApi  = parseCLPAmount(totales.find(t => t.metodo_pago === 'tarjeta')?.total_por_dia)

  const parseInputValue = (val: string): number => {
    if (!val || val.trim() === '') return 0
    const cleaned = val.replace(/\./g, '').replace(/[^0-9]/g, '')
    if (!cleaned) return 0
    const num = parseInt(cleaned, 10)
    return isNaN(num) ? 0 : num
  }

  const efectivoNum  = parseInputValue(efectivo)
  const maquinaNum   = parseInputValue(maquina)
  const pedidosYaNum = parseInputValue(pedidosYa)
  const salidasNum   = parseInputValue(salidasEfectivo)
  const ingresosNum  = parseInputValue(ingresosEfectivo)

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
    const apiUrl = getApiUrl()
    setEnviando(true); setMensaje(null)
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

  const cuadrado = efectivoNum === totalEfectivoApi && maquinaNum === totalMaquinaApi

  const handleCloseResumen = () => {
    setShowResumen(false)
    setTimeout(() => {
      setStep('seleccion'); setTotales([]); setEfectivo(''); setMaquina('')
      setPedidosYa(''); setSalidasEfectivo(''); setIngresosEfectivo('')
      setObservacion(''); setMensaje(null); setFecha('')
    }, 100)
  }

  const formatWithDots = (value: string): string => {
    const num = value.replace(/[^0-9]/g, '')
    if (!num) return ''
    return Number(num).toLocaleString('es-CL')
  }

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setter(formatWithDots(e.target.value))

  return (
    <div style={{ minHeight: '100dvh', background: '#FBF1E2', color: '#221813' }}>
      <DCTopbar active="admin" />

      <main className="dc-page dc-page--narrow">
        <div className="dc-head" style={{ marginBottom: 28 }}>
          <div className="dc-head__left">
            <div>
              <div className="dc-kicker">· Caja ·</div>
              <h1 className="dc-title">Cierre de Caja</h1>
              <p className="dc-sub">Registra los montos declarados al cerrar la caja.</p>
            </div>
          </div>
        </div>

        {step === 'seleccion' && (
          <div className="card" style={{ padding: '28px 26px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="field">
              <label>Selecciona la fecha del cierre</label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="dc-input"
              />
            </div>
            <button className="btn btn--primary btn--block" onClick={obtenerTotales} disabled={!fecha}>
              <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: 'currentColor', strokeWidth: 2, fill: 'none' }}><path d="M5 12l5 5 9-9"/></svg>
              Continuar
            </button>
          </div>
        )}

        {step === 'datos' && totales.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: '26px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A3A30' }}>Montos declarados</div>

              <CurrencyField
                label="Total efectivo"
                value={efectivo}
                onChange={handleInputChange(setEfectivo)}
                inputRef={efectivoRef}
                icon={<svg viewBox="0 0 24 24" style={{ width: 15, height: 15, stroke: '#4A3A30', strokeWidth: 2, fill: 'none' }}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>}
              />

              <CurrencyField
                label="Total tarjeta"
                value={maquina}
                onChange={handleInputChange(setMaquina)}
                icon={<svg viewBox="0 0 24 24" style={{ width: 15, height: 15, stroke: '#4A3A30', strokeWidth: 2, fill: 'none' }}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>}
              />

              <CurrencyField
                label="PedidosYa"
                value={pedidosYa}
                onChange={handleInputChange(setPedidosYa)}
                icon={<svg viewBox="0 0 24 24" style={{ width: 15, height: 15, stroke: '#4A3A30', strokeWidth: 2, fill: 'none' }}><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg>}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <CurrencyField
                  label="Salidas efectivo"
                  value={salidasEfectivo}
                  onChange={handleInputChange(setSalidasEfectivo)}
                  icon={<svg viewBox="0 0 24 24" style={{ width: 15, height: 15, stroke: '#C23A2E', strokeWidth: 2, fill: 'none' }}><path d="M12 19V5M19 12l-7 7-7-7"/></svg>}
                />
                <CurrencyField
                  label="Ingresos efectivo"
                  value={ingresosEfectivo}
                  onChange={handleInputChange(setIngresosEfectivo)}
                  icon={<svg viewBox="0 0 24 24" style={{ width: 15, height: 15, stroke: '#2C7A45', strokeWidth: 2, fill: 'none' }}><path d="M12 5v14M5 12l7-7 7 7"/></svg>}
                />
              </div>

              <div className="field">
                <label>Observación (opcional)</label>
                <textarea
                  className="dc-textarea"
                  rows={2}
                  value={observacion}
                  onChange={e => setObservacion(e.target.value)}
                  placeholder="Notas adicionales..."
                />
              </div>

              {mensaje && (
                <div style={{ background: '#F7D9D5', border: '1px solid #D63B30', borderRadius: 8, padding: '10px 14px' }}>
                  <p style={{ color: '#C23A2E', fontWeight: 600, fontSize: 13, margin: 0 }}>{mensaje}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button
                  className="btn btn--ghost"
                  style={{ flex: 1 }}
                  onClick={() => { setStep('seleccion'); setTotales([]) }}
                >
                  Volver
                </button>
                <button
                  className="btn btn--primary"
                  style={{ flex: 1 }}
                  onClick={generarCierre}
                  disabled={enviando}
                >
                  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: 'currentColor', strokeWidth: 2, fill: 'none' }}><path d="M5 12l5 5 9-9"/></svg>
                  {enviando ? 'Guardando…' : 'Confirmar cierre'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

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
