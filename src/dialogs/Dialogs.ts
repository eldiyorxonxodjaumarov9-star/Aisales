import { createContext, useContext } from 'react'
import type { Lead } from '../store/types'

export type Dataset = 'leads' | 'calls' | 'sellers' | 'sales'

export interface DialogApi {
  addLead: (onSaved?: (id: string) => void) => void
  editLead: (lead: Lead) => void
  assign: (leadIds: string[], onSaved?: () => void) => void
  followup: (opts?: { leadId?: string; followupId?: string; date?: string; onSaved?: () => void }) => void
  sale: (leadId: string, onSaved?: () => void) => void
  invite: () => void
  editUser: (userId: string) => void
  exportData: (opts?: { dataset?: Dataset; leadIds?: string[]; sellerId?: string }) => void
}

export const DialogsContext = createContext<DialogApi | null>(null)

export function useDialogs(): DialogApi {
  const c = useContext(DialogsContext)
  if (!c) throw new Error('useDialogs outside provider')
  return c
}
