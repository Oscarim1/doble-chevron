'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  category: string
  image_url?: string
}

interface CartContextProps {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  removeOne: (id: string) => void              // Nuevo: resta 1 unidad, o elimina si llega a cero
  getQuantity: (id: string) => number          // Nuevo: retorna la cantidad actual (o 0)
  clearCart: () => void
}

const CartContext = createContext<CartContextProps | undefined>(undefined)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cart')
      if (stored) setItems(JSON.parse(stored))
    } catch {}
  }, [])

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  // Nuevo: resta 1. Si queda en 0, elimina del carrito
  const removeOne = (id: string) => {
    setItems((prev) => {
      const newCart = prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity - 1) }
            : item
        )
        .filter((item) => item.quantity > 0)
      console.log('Carrito actualizado:', newCart)
      return newCart
    })
  }
  
  

  // Nuevo: devuelve la cantidad actual, o 0
  const getQuantity = (id: string) => {
    const item = items.find((i) => i.id === id)
    return item ? item.quantity : 0
  }

  const clearCart = () => setItems([])

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, removeOne, getQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}
