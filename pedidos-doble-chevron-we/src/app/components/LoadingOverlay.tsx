'use client'
import { useLoading } from '../../context/LoadingContext'
import LogoLoader from './LogoLoader'

export default function LoadingOverlay() {
  const { loading } = useLoading()
  if (!loading) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-orange-50 gap-5">
      <LogoLoader className="h-20 w-20 animate-bounce drop-shadow-lg" />
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent" />
    </div>
  )
}
