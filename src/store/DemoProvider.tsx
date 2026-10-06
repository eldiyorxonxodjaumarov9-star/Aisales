import type { ReactNode } from 'react'
import { StoreContext, useDemoStore } from './store'

export function DemoProvider({ children }: { children: ReactNode }) {
  const store = useDemoStore()
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}
