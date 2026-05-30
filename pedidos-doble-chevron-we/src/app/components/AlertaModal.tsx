'use client'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

interface AlertaModalProps {
  isOpen: boolean
  onClose: () => void
  mensaje: string
}

const AlertaModal: React.FC<AlertaModalProps> = ({ isOpen, onClose, mensaje }) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" style={{ position: 'relative', zIndex: 80 }} onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(34,24,19,0.6)' }} />
        </Transition.Child>

        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-100" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <Dialog.Panel className="dc-modal dc-modal--narrow">

              <div className="dc-modal__body" style={{ alignItems: 'center', textAlign: 'center', paddingBottom: 0 }}>
                <div style={{ width: 60, height: 60, borderRadius: 999, background: '#F7D9D5', border: '1.5px solid #D63B30', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <svg viewBox="0 0 24 24" style={{ width: 28, height: 28, stroke: '#C23A2E', strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>
                  </svg>
                </div>
                <Dialog.Title style={{ fontFamily: 'var(--font-alfa-slab-one), serif', fontWeight: 400, fontSize: 22, margin: '8px 0 0', color: '#221813' }}>
                  Atención
                </Dialog.Title>
                <p style={{ margin: '8px 0 0', color: '#4A3A30', fontSize: 14.5, lineHeight: 1.5 }}>{mensaje}</p>
              </div>

              <div className="dc-modal__foot" style={{ justifyContent: 'center' }}>
                <button className="btn btn--primary" onClick={onClose}>
                  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: 'currentColor', strokeWidth: 2, fill: 'none' }}><path d="M5 12l5 5 9-9"/></svg>
                  Entendido
                </button>
              </div>

            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}

export default AlertaModal
