'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useLoading } from '../../context/LoadingContext'

export default function RouteChangeHandler() {
  const pathname = usePathname()
  const { setLoading } = useLoading()

  useEffect(() => {
    // When the route changes, hide the loader
    setLoading(false)
  }, [pathname, setLoading])

  return null
}
