'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLoading } from '../../context/LoadingContext'
import { getApiUrl } from '@/utils/api'

export default function LogoutPage() {
  const router = useRouter()
  const { setLoading } = useLoading()

  useEffect(() => {
    setLoading(true)

    const refreshToken = localStorage.getItem('refreshToken')

    const cerrarSesion = async () => {
      try {
        if (refreshToken) {
          const apiUrl = getApiUrl();
          await fetch(`${apiUrl}/api/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          })
        }
      } catch (err) {
        console.error('Error cerrando sesión', err)
      } finally {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        setLoading(false)
        router.replace('/login')
      }
    }

    cerrarSesion()
  }, [router, setLoading])

  return null
}
