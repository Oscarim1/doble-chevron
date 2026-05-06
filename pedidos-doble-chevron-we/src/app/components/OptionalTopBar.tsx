'use client'
import { usePathname } from 'next/navigation'
import TopBar from './TopBar'

export default function OptionalTopBar() {
  const pathname = usePathname()
  if (pathname === '/' || pathname.startsWith('/login')) return null
  return <TopBar />
}
