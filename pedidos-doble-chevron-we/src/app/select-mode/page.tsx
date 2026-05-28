'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LogoLogin from '../components/LogoLogin'

export default function SelectModePage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col">
      <nav className="py-8">
        <div className="flex justify-center">
          <LogoLogin className="h-20 w-auto drop-shadow-xl" />
        </div>
      </nav>

      <main className="flex flex-col items-center justify-center flex-grow px-4 pb-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-2">
            ¿Dónde quieres trabajar?
          </h1>
          <p className="text-gray-500 text-lg">Selecciona el modo de operación</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
          {/* Restaurant */}
          <button
            onClick={() => router.push('/products')}
            className="flex-1 group bg-white hover:bg-orange-500 border-2 border-orange-200 hover:border-orange-500 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-200 flex flex-col items-center gap-4 active:scale-95"
          >
            <span className="text-6xl group-hover:scale-110 transition-transform duration-200">
              🍔
            </span>
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-gray-800 group-hover:text-white transition-colors">
                Restaurant
              </h2>
              <p className="text-gray-500 group-hover:text-orange-100 text-sm mt-1 transition-colors">
                Tomar pedidos en mesa o mostrador
              </p>
            </div>
            <span className="mt-2 px-6 py-2 bg-orange-500 group-hover:bg-white text-white group-hover:text-orange-500 font-bold rounded-full text-sm transition-all duration-200 shadow">
              Ir al Restaurant
            </span>
          </button>

          {/* Almacén */}
          <button
            onClick={() => router.push('/almacen')}
            className="flex-1 group bg-white hover:bg-gray-800 border-2 border-gray-200 hover:border-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-200 flex flex-col items-center gap-4 active:scale-95"
          >
            <span className="text-6xl group-hover:scale-110 transition-transform duration-200">
              📦
            </span>
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-gray-800 group-hover:text-white transition-colors">
                Almacén
              </h2>
              <p className="text-gray-500 group-hover:text-gray-300 text-sm mt-1 transition-colors">
                Escanear productos y gestionar stock
              </p>
            </div>
            <span className="mt-2 px-6 py-2 bg-gray-800 group-hover:bg-white text-white group-hover:text-gray-800 font-bold rounded-full text-sm transition-all duration-200 shadow">
              Ir al Almacén
            </span>
          </button>
        </div>
      </main>
    </div>
  )
}
