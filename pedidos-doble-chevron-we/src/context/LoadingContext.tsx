'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

interface LoadingContextProps {
  loading: boolean
  setLoading: (value: boolean) => void
}

const LoadingContext = createContext<LoadingContextProps | undefined>(undefined)

export function useLoading() {
  const ctx = useContext(LoadingContext)
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider')
  return ctx
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false)

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  )
}
