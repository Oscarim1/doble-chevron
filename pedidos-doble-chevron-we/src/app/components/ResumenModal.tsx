'use client'
import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useRouter } from 'next/navigation'

interface Props {
  isOpen: boolean
  onClose: () => void
  datos: {
    totalSistemaEfectivo: number
    totalSistemaMaquina: number
    declaradoEfectivo: number
    declaradoMaquina: number
    cuadrado: boolean
  }
}

const fmt = (n: number) => {
  const sign = n < 0 ? '-' : ''
  return sign + '$' + Math.abs(n).toLocaleString('es-CL')
}

interface DiffRow {
  label: string
  sistema: number
  declarado: number
  diff: number
  icon: React.ReactNode
}

function DiffCard({ row }: { row: DiffRow }) {
  const ok = row.diff === 0
  return (
    <div className={`diff-card${ok ? ' is-ok' : ' is-off'}`}>
      <div className="diff-card__head">
        <div className="diff-card__id">
          <span className="diff-ic">{row.icon}</span>
          <span className="diff-card__name">{row.label}</span>
        </div>
        <span className={`mini-badge${ok ? ' ok' : ' bad'}`}>
          {ok ? 'Cuadra' : row.diff < 0 ? 'Faltante' : 'Sobrante'}
        </span>
      </div>
      <div className="diff-grid">
        <div className="diff-cell">
          <label>Sistema</label>
          <div className="val">{fmt(row.sistema)}</div>
        </div>
        <div className="diff-cell">
          <label>Declarado</label>
          <div className="val">{fmt(row.declarado)}</div>
        </div>
      </div>
      <div className="diff-foot">
        <span className="lbl">Diferencia</span>
        <span className={`amt${ok ? ' pos' : row.diff < 0 ? ' neg' : ' pos'}`}>
          {ok ? '$0' : fmt(row.diff)}
        </span>
      </div>
    </div>
  )
}

export default function ResumenModal({ isOpen, onClose, datos }: Props) {
  const { totalSistemaEfectivo, totalSistemaMaquina, declaradoEfectivo, declaradoMaquina, cuadrado } = datos
  const router = useRouter()

  const handleClose = () => { onClose(); router.refresh() }

  const diffEfectivo = declaradoEfectivo - totalSistemaEfectivo
  const diffMaquina  = declaradoMaquina  - totalSistemaMaquina
  const diffTotal    = diffEfectivo + diffMaquina

  const rows: DiffRow[] = [
    {
      label: 'Efectivo', sistema: totalSistemaEfectivo, declarado: declaradoEfectivo, diff: diffEfectivo,
      icon: <svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>,
    },
    {
      label: 'Tarjeta', sistema: totalSistemaMaquina, declarado: declaradoMaquina, diff: diffMaquina,
      icon: <svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
    },
  ].filter(r => r.sistema !== 0 || r.declarado !== 0)

  const totalAmtClass = diffTotal === 0 ? 'zero' : diffTotal < 0 ? 'neg' : 'pos'
  const totalSub = diffTotal < 0 ? 'Faltante respecto al sistema'
                 : diffTotal > 0 ? 'Sobrante respecto al sistema'
                 : 'Todo coincide con el sistema'

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" style={{ position: 'relative', zIndex: 80 }} onClose={handleClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(34,24,19,0.6)' }} />
        </Transition.Child>

        <div style={{ position: 'fixed', inset: 0, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-100" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <Dialog.Panel className="dc-modal" style={{ maxWidth: 560 }}>

              {/* Head */}
              <div className="dc-modal__head" style={{ gap: 14 }}>
                <div className={`modal-head-ic${cuadrado ? ' is-ok' : ''}`}>
                  {cuadrado
                    ? <svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-9"/></svg>
                    : <svg viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <Dialog.Title as="h2">{cuadrado ? 'Caja cuadrada' : 'Caja descuadrada'}</Dialog.Title>
                  <span className="modal-head-sub">{cuadrado ? 'Lista para cerrar' : 'Antes de confirmar'}</span>
                </div>
                <button className="dc-modal__close" onClick={handleClose} aria-label="Cerrar">
                  <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>
                </button>
              </div>

              {/* Body */}
              <div className="dc-modal__body" style={{ gap: 14 }}>
                <p className="cuadre-intro">
                  {cuadrado
                    ? 'Los montos declarados coinciden con lo registrado por el sistema. Puedes confirmar el cierre del turno.'
                    : 'Los montos declarados no coinciden con lo registrado por el sistema. Revisa las diferencias antes de continuar.'}
                </p>

                {rows.map(row => <DiffCard key={row.label} row={row} />)}

                <div className="diff-total">
                  <div>
                    <div className="t-lbl">{diffTotal === 0 ? 'Resultado del cuadre' : 'Diferencia total'}</div>
                    <div className="t-sub">{totalSub}</div>
                  </div>
                  <div className={`t-amt ${totalAmtClass}`}>{fmt(diffTotal)}</div>
                </div>
              </div>

              {/* Footer */}
              <div className="dc-modal__foot">
                <button className="btn btn--primary btn--block" onClick={handleClose}>
                  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: 'currentColor', strokeWidth: 2, fill: 'none' }}><path d="M5 12l5 5 9-9"/></svg>
                  Continuar
                </button>
              </div>

            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
