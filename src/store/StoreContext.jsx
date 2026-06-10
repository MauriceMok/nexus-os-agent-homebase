import { createContext, useContext } from 'react'
import { useStore } from './useStore'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const store = useStore()
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useAppStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useAppStore must be used within StoreProvider')
  return ctx
}
