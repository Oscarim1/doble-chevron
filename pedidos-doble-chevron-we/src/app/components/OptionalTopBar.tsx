'use client'
import { usePathname } from 'next/navigation'
import TopBar from './TopBar'

export default function OptionalTopBar() {
  const pathname = usePathname()
  const noTopBar = ['/', '/login', '/almacen', '/products', '/select-mode']
  if (noTopBar.some((p) => pathname === p || (p !== '/' && pathname.startsWith(p)))) return null
  return <TopBar />
}
