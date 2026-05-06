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
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Fondo con difuminado */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        {/* Contenedor del modal */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-xl bg-white p-6 text-center align-middle shadow-xl transition-all">
              <Dialog.Title
                as="h3"
                className="text-lg font-bold leading-6 text-red-600 mb-4"
              >
                ⚠️ Atención
              </Dialog.Title>
              <p className="text-gray-700">{mensaje}</p>
              <div className="mt-6">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-orange-500 text-white font-semibold rounded hover:bg-orange-600 transition"
                >
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
