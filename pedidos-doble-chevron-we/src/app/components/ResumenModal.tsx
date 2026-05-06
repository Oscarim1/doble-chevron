'use client'
import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useRouter } from 'next/navigation'
import { HiCheckCircle, HiXCircle, HiCurrencyDollar, HiCreditCard } from 'react-icons/hi'

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

export default function ResumenModal({ isOpen, onClose, datos }: Props) {
  const {
    totalSistemaEfectivo,
    totalSistemaMaquina,
    declaradoEfectivo,
    declaradoMaquina,
    cuadrado,
  } = datos

  const router = useRouter()

  const handleClose = () => {
    onClose()
    router.refresh()
  }

  const formatCLP = (value: number) => {
    return '$' + value.toLocaleString('es-CL')
  }

  const diffEfectivo = declaradoEfectivo - totalSistemaEfectivo
  const diffMaquina = declaradoMaquina - totalSistemaMaquina

  const ComparisonCard = ({
    title,
    icon: Icon,
    sistema,
    declarado,
    diff,
  }: {
    title: string
    icon: React.ComponentType<{ className?: string }>
    sistema: number
    declarado: number
    diff: number
  }) => {
    const isMatch = diff === 0
    const isPositive = diff > 0

    return (
      <div className={`rounded-xl p-4 border-2 ${isMatch ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <div className="flex items-center gap-2 mb-3">
          <Icon className={`text-xl ${isMatch ? 'text-green-600' : 'text-red-600'}`} />
          <span className="font-bold text-gray-800">{title}</span>
          {isMatch ? (
            <HiCheckCircle className="ml-auto text-green-500 text-xl" />
          ) : (
            <HiXCircle className="ml-auto text-red-500 text-xl" />
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-500 text-xs">Sistema</p>
            <p className="font-bold text-gray-900">{formatCLP(sistema)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Declarado</p>
            <p className="font-bold text-gray-900">{formatCLP(declarado)}</p>
          </div>
        </div>

        {!isMatch && (
          <div className={`mt-3 pt-3 border-t ${isMatch ? 'border-green-200' : 'border-red-200'}`}>
            <p className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              Diferencia: {isPositive ? '+' : ''}{formatCLP(diff)}
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center px-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className={`px-6 py-5 ${cuadrado ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`}>
                <div className="flex items-center justify-center gap-3">
                  {cuadrado ? (
                    <HiCheckCircle className="text-white text-4xl" />
                  ) : (
                    <HiXCircle className="text-white text-4xl" />
                  )}
                  <div className="text-center">
                    <Dialog.Title className="text-xl font-bold text-white">
                      {cuadrado ? 'Caja cuadrada' : 'Caja descuadrada'}
                    </Dialog.Title>
                    <p className="text-white/80 text-sm">
                      Cierre de caja registrado
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <ComparisonCard
                  title="Efectivo"
                  icon={HiCurrencyDollar}
                  sistema={totalSistemaEfectivo}
                  declarado={declaradoEfectivo}
                  diff={diffEfectivo}
                />

                <ComparisonCard
                  title="Tarjeta"
                  icon={HiCreditCard}
                  sistema={totalSistemaMaquina}
                  declarado={declaradoMaquina}
                  diff={diffMaquina}
                />

                {/* Totales */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-semibold">Diferencia total</span>
                    <span className={`text-xl font-extrabold ${
                      diffEfectivo + diffMaquina === 0
                        ? 'text-green-600'
                        : diffEfectivo + diffMaquina > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                    }`}>
                      {diffEfectivo + diffMaquina > 0 ? '+' : ''}
                      {formatCLP(diffEfectivo + diffMaquina)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6">
                <button
                  onClick={handleClose}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition"
                >
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
