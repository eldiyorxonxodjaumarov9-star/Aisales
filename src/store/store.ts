import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { buildAnalysis } from './analysis'
import { DEMO_VERSION, PRODUCTS, createSeed } from './seed'
import type {
  CallResult,
  DateRange,
  DemoState,
  FollowUp,
  Lead,
  LeadStatus,
  Notification,
  Sale,
  Seller,
  Session,
  Settings,
  Source,
} from './types'
import { fmtDuration, fmtMoney, fmtRelativeDay, uid } from '../lib/format'

const STORAGE_KEY = 'salesai-demo-state'

function load(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState
      if (parsed.version === DEMO_VERSION) return parsed
    }
  } catch {
    /* corrupted storage falls back to seed */
  }
  return createSeed()
}

export const RESULT_TO_STATUS: Record<CallResult, string> = {
  won: 'won',
  interested: 'interested',
  thinking: 'interested',
  followup: 'followup',
  lost: 'lost',
  noanswer: 'contacted',
}

export interface NewLeadInput {
  name: string
  phone: string
  email?: string
  source: Source
  product: string
  sellerId: string | null
  campaignId?: string | null
  status?: string
}

export function useDemoStore() {
  const [state, setState] = useState<DemoState>(load)
  const scheduled = useRef(new Set<string>())
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(state)), 150)
    return () => clearTimeout(t)
  }, [state])

  const mutate = useCallback((fn: (d: DemoState) => void) => {
    setState((prev) => {
      const next = structuredClone(prev)
      fn(next)
      return next
    })
  }, [])

  const actorName = (d: DemoState) => d.sellers.find((s) => s.id === d.session?.userId)?.name ?? 'Admin'
  const sellerName = (d: DemoState, id: string | null) => d.sellers.find((s) => s.id === id)?.name ?? 'Biriktirilmagan'
  const statusLabel = (d: DemoState, key: string) => d.statuses.find((s) => s.key === key)?.label ?? key
  const pushNote = (d: DemoState, n: Omit<Notification, 'id' | 'at' | 'read'>) => {
    d.notifications.unshift({ ...n, id: uid('nt'), at: new Date().toISOString(), read: false })
  }
  const pushHistory = (lead: Lead, title: string, detail: string) => {
    lead.history.push({ id: uid('h'), at: new Date().toISOString(), title, detail })
  }

  // AI queue: queued calls become "ready" after a short local delay (prepared demo analysis, no AI request).
  useEffect(() => {
    for (const c of state.calls) {
      if (c.aiStatus !== 'queued' || scheduled.current.has(c.id)) continue
      scheduled.current.add(c.id)
      setTimeout(() => {
        scheduled.current.delete(c.id)
        mutate((d) => {
          const call = d.calls.find((x) => x.id === c.id)
          if (!call || call.aiStatus !== 'queued') return
          call.aiStatus = 'ready'
          call.analysis = buildAnalysis(call.id, call.result, call.duration)
          const lead = d.leads.find((l) => l.id === call.leadId)
          if (lead) {
            pushHistory(lead, 'AI tahlili tayyor', call.analysis.summary.split('.')[0])
            pushNote(d, { title: 'AI tahlili tayyor', detail: `${lead.name} bilan ${fmtDuration(call.duration)} daqiqalik qo‘ng‘iroq`, link: `/admin/calls/${call.id}`, kind: 'ai' })
          }
        })
      }, 4500)
    }
  }, [state.calls, mutate])

  const actions = useMemo(
    () => ({
      login(session: Session) {
        mutate((d) => {
          d.session = session
        })
      },
      logout() {
        mutate((d) => {
          d.session = null
        })
      },
      resetDemo() {
        setState((prev) => ({ ...createSeed(), session: prev.session }))
      },
      setRange(range: DateRange) {
        mutate((d) => {
          d.range = range
        })
      },

      addLead(input: NewLeadInput): string {
        const id = `L-${Math.floor(10300 + Math.random() * 89000)}`
        mutate((d) => {
          const campaignId = input.campaignId !== undefined ? input.campaignId : d.campaigns.find((c) => c.source === input.source)?.id ?? null
          const now = new Date().toISOString()
          const lead: Lead = {
            id,
            name: input.name.trim(),
            phone: input.phone.trim(),
            email: input.email?.trim() || undefined,
            source: input.source,
            campaignId,
            product: input.product,
            sellerId: input.sellerId,
            status: input.status ?? 'new',
            score: 50 + Math.floor(Math.random() * 30),
            createdAt: now,
            lastContactAt: null,
            notes: [],
            history: [{ id: uid('h'), at: now, title: 'Lead qo‘shildi', detail: `${input.source} · ${actorName(d)}` }],
          }
          if (input.sellerId) pushHistory(lead, 'Sotuvchi biriktirildi', sellerName(d, input.sellerId))
          d.leads.unshift(lead)
          pushNote(d, { title: 'Yangi lead qabul qilindi', detail: `${input.source} · ${lead.name}`, link: `/admin/leads/${id}`, kind: 'lead' })
        })
        return id
      },

      updateLead(id: string, patch: Partial<Pick<Lead, 'name' | 'phone' | 'email' | 'source' | 'product' | 'sellerId' | 'status' | 'score'>>) {
        mutate((d) => {
          const lead = d.leads.find((l) => l.id === id)
          if (!lead) return
          if (patch.status && patch.status !== lead.status) pushHistory(lead, `Status: ${statusLabel(d, patch.status)}`, `${actorName(d)} tomonidan o‘zgartirildi`)
          if (patch.sellerId !== undefined && patch.sellerId !== lead.sellerId) pushHistory(lead, 'Mas’ul o‘zgardi', sellerName(d, patch.sellerId))
          const edited = (['name', 'phone', 'email', 'source', 'product'] as const).some((k) => patch[k] !== undefined && patch[k] !== lead[k])
          if (edited) pushHistory(lead, 'Lead ma’lumotlari tahrirlandi', actorName(d))
          Object.assign(lead, patch)
          if (patch.sellerId !== undefined) {
            for (const f of d.followups) if (f.leadId === id && !f.done && patch.sellerId) f.sellerId = patch.sellerId
          }
        })
      },

      setLeadStatus(id: string, status: string) {
        mutate((d) => {
          const lead = d.leads.find((l) => l.id === id)
          if (!lead || lead.status === status) return
          lead.status = status
          pushHistory(lead, `Status: ${statusLabel(d, status)}`, `${actorName(d)} tomonidan o‘zgartirildi`)
        })
      },

      assignLeads(ids: string[], sellerId: string | 'auto') {
        mutate((d) => {
          const active = d.sellers.filter((s) => s.role === 'seller' && s.status === 'active')
          const load = new Map(active.map((s) => [s.id, d.leads.filter((l) => l.sellerId === s.id && !['won', 'lost'].includes(l.status)).length]))
          for (const id of ids) {
            const lead = d.leads.find((l) => l.id === id)
            if (!lead) continue
            let target = sellerId
            if (target === 'auto') {
              target = [...load.entries()].sort((a, b) => a[1] - b[1])[0]?.[0] ?? active[0].id
              load.set(target, (load.get(target) ?? 0) + 1)
            }
            if (lead.sellerId === target) continue
            lead.sellerId = target
            pushHistory(lead, 'Sotuvchiga biriktirildi', `${sellerName(d, target)} · ${actorName(d)}`)
            for (const f of d.followups) if (f.leadId === id && !f.done) f.sellerId = target
          }
        })
      },

      addNote(leadId: string, text: string) {
        mutate((d) => {
          const lead = d.leads.find((l) => l.id === leadId)
          if (!lead) return
          lead.notes.push({ id: uid('n'), text: text.trim(), at: new Date().toISOString(), author: actorName(d) })
        })
      },

      addFollowup(input: Omit<FollowUp, 'id' | 'done'>): string {
        const id = uid('F')
        mutate((d) => {
          d.followups.push({ ...input, id, done: false })
          const lead = d.leads.find((l) => l.id === input.leadId)
          if (lead) {
            pushHistory(lead, 'Follow-up belgilandi', `${fmtRelativeDay(input.due)} · ${sellerName(d, input.sellerId)}`)
            if (!lead.sellerId) lead.sellerId = input.sellerId
            if (['new', 'contacted', 'lost'].includes(lead.status)) lead.status = 'followup'
          }
        })
        return id
      },

      updateFollowup(id: string, patch: Partial<Pick<FollowUp, 'due' | 'note' | 'reminder' | 'sellerId' | 'kind'>>) {
        mutate((d) => {
          const f = d.followups.find((x) => x.id === id)
          if (!f) return
          const lead = d.leads.find((l) => l.id === f.leadId)
          if (patch.due && patch.due !== f.due && lead) pushHistory(lead, 'Follow-up ko‘chirildi', fmtRelativeDay(patch.due))
          Object.assign(f, patch)
        })
      },

      toggleFollowupDone(id: string) {
        mutate((d) => {
          const f = d.followups.find((x) => x.id === id)
          if (!f) return
          f.done = !f.done
          const lead = d.leads.find((l) => l.id === f.leadId)
          if (lead) pushHistory(lead, f.done ? 'Follow-up bajarildi' : 'Follow-up qayta ochildi', f.note)
        })
      },

      deleteFollowup(id: string) {
        mutate((d) => {
          d.followups = d.followups.filter((f) => f.id !== id)
        })
      },

      createCall(leadId: string, sellerId: string, duration: number): string {
        const id = uid('C')
        mutate((d) => {
          const startedAt = new Date(Date.now() - duration * 1000).toISOString()
          d.calls.unshift({ id, leadId, sellerId, startedAt, duration, result: 'noanswer', aiStatus: 'none', analysis: null })
          const lead = d.leads.find((l) => l.id === leadId)
          if (lead) {
            lead.lastContactAt = startedAt
            pushHistory(lead, `Qo‘ng‘iroq yakunlandi · ${fmtDuration(duration)}`, `${sellerName(d, sellerId)} · demo qo‘ng‘iroq`)
          }
        })
        return id
      },

      saveCallResult(callId: string, result: CallResult, note?: string) {
        mutate((d) => {
          const call = d.calls.find((c) => c.id === callId)
          if (!call) return
          call.result = result
          const runAi = d.settings.ai.autoRun && call.duration >= d.settings.ai.minDuration && result !== 'noanswer'
          call.aiStatus = runAi ? 'queued' : 'none'
          call.analysis = null
          const lead = d.leads.find((l) => l.id === call.leadId)
          if (lead) {
            const status = RESULT_TO_STATUS[result]
            if (lead.status !== status) {
              lead.status = status
              pushHistory(lead, `Status: ${statusLabel(d, status)}`, `${sellerName(d, call.sellerId)} · qo‘ng‘iroq natijasi`)
            }
            if (note?.trim()) lead.notes.push({ id: uid('n'), text: note.trim(), at: new Date().toISOString(), author: sellerName(d, call.sellerId) })
            if (runAi) pushHistory(lead, 'AI tahlili navbatda', 'Audio qabul qilindi')
          }
        })
      },

      reviewSummary(callId: string, text: string) {
        mutate((d) => {
          const call = d.calls.find((c) => c.id === callId)
          if (call) call.reviewedSummary = text.trim()
        })
      },

      addSale(input: Omit<Sale, 'id' | 'at'>): string {
        const id = uid('S')
        mutate((d) => {
          d.sales.push({ ...input, id, at: new Date().toISOString() })
          const lead = d.leads.find((l) => l.id === input.leadId)
          if (lead) {
            if (lead.status !== 'won') pushHistory(lead, `Status: ${statusLabel(d, 'won')}`, sellerName(d, input.sellerId))
            lead.status = 'won'
            lead.product = input.product
            pushHistory(lead, 'Sotuv yakunlandi', `${input.product} · ${fmtMoney(input.amount)}`)
            for (const f of d.followups) if (f.leadId === lead.id && !f.done) f.done = true
          }
          const name = sellerName(d, input.sellerId).split(' ')[0]
          pushNote(d, { title: 'Sotuv yakunlandi', detail: `${name}: ${input.product} · ${fmtMoney(input.amount)}`, link: `/admin/leads/${input.leadId}`, kind: 'sale' })
        })
        return id
      },

      markNotification(id: string, read: boolean) {
        mutate((d) => {
          const n = d.notifications.find((x) => x.id === id)
          if (n) n.read = read
        })
      },
      markAllRead() {
        mutate((d) => {
          for (const n of d.notifications) n.read = true
        })
      },
      deleteNotification(id: string) {
        mutate((d) => {
          d.notifications = d.notifications.filter((n) => n.id !== id)
        })
      },

      setIntegration(id: string, connected: boolean) {
        mutate((d) => {
          const it = d.integrations.find((x) => x.id === id)
          if (!it) return
          it.connected = connected
          it.lastSync = connected ? new Date().toISOString() : it.lastSync
          if (connected) it.needsSetup = false
          d.syncLog.unshift({ id: uid('sl'), at: new Date().toISOString(), integration: it.name, message: connected ? 'Demo ulanish yoqildi' : 'Ulanish uzildi', ok: true })
        })
      },

      syncIntegration(id: string): number {
        const count = id === 'instagram' || id === 'facebook' || id === 'meta' ? 1 + Math.floor(Math.random() * 3) : 0
        mutate((d) => {
          const targets = id === 'meta' ? ['instagram', 'facebook'] : [id]
          const now = new Date().toISOString()
          for (const t of targets) {
            const it = d.integrations.find((x) => x.id === t)
            if (it && it.connected) it.lastSync = now
          }
          const it = d.integrations.find((x) => x.id === targets[0])
          if (!it?.connected) {
            d.syncLog.unshift({ id: uid('sl'), at: now, integration: it?.name ?? id, message: 'Ulanmagan — sinxronlash bajarilmadi', ok: false })
            return
          }
          const first = ['Bobur', 'Shaxnoza', 'Temur', 'Aziza', 'Javohir', 'Muslima']
          const last = ['Hakimov', 'Ortiqova', 'Saidov', 'Qosimova', 'Valiyev']
          const active = d.sellers.filter((s) => s.role === 'seller' && s.status === 'active')
          for (let i = 0; i < count; i++) {
            const source: Source = i % 2 === 0 ? 'Instagram' : 'Facebook'
            const sellerId = d.settings.meta.distribution === 'manual' ? null : d.settings.meta.distribution === 'fixed' ? d.settings.meta.defaultSeller : active[Math.floor(Math.random() * active.length)]?.id ?? null
            const leadId = `L-${Math.floor(10300 + Math.random() * 89000)}`
            const name = `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`
            d.leads.unshift({
              id: leadId,
              name,
              phone: `+998 9${Math.floor(Math.random() * 10)} ${100 + Math.floor(Math.random() * 899)} ${10 + Math.floor(Math.random() * 89)} ${10 + Math.floor(Math.random() * 89)}`,
              source,
              campaignId: source === 'Instagram' ? 'c1' : 'c4',
              product: PRODUCTS[0].name,
              sellerId,
              status: 'new',
              score: 55 + Math.floor(Math.random() * 30),
              createdAt: now,
              lastContactAt: null,
              notes: [],
              history: [{ id: uid('h'), at: now, title: 'Lead qabul qilindi', detail: `${source} · demo sinxronlash` }],
            })
          }
          d.syncLog.unshift({ id: uid('sl'), at: now, integration: id === 'meta' ? 'Meta' : it.name, message: count ? `${count} ta demo lead qabul qilindi` : 'Holat tekshirildi', ok: true })
          if (count) pushNote(d, { title: 'Yangi lead qabul qilindi', detail: `Meta sinxronlash · ${count} ta lead`, link: '/admin/leads', kind: 'lead' })
        })
        return count
      },

      updateSettings<K extends keyof Settings>(section: K, value: Settings[K]) {
        mutate((d) => {
          d.settings[section] = structuredClone(value)
        })
      },

      addStatus(label: string, color: LeadStatus['color']) {
        mutate((d) => {
          d.statuses.push({ key: uid('st'), label: label.trim(), color })
        })
      },
      updateStatus(key: string, patch: Partial<Pick<LeadStatus, 'label' | 'color'>>) {
        mutate((d) => {
          const s = d.statuses.find((x) => x.key === key)
          if (s) Object.assign(s, patch)
        })
      },
      moveStatus(key: string, dir: -1 | 1) {
        mutate((d) => {
          const i = d.statuses.findIndex((x) => x.key === key)
          const j = i + dir
          if (i < 0 || j < 0 || j >= d.statuses.length) return
          ;[d.statuses[i], d.statuses[j]] = [d.statuses[j], d.statuses[i]]
        })
      },
      removeStatus(key: string) {
        mutate((d) => {
          d.statuses = d.statuses.filter((s) => s.key !== key || s.system)
          for (const l of d.leads) if (l.status === key) l.status = 'new'
        })
      },

      inviteSeller(input: { name: string; email: string; role: 'admin' | 'seller' }): string {
        const id = uid('u')
        mutate((d) => {
          d.sellers.push({ id, name: input.name.trim(), email: input.email.trim().toLowerCase(), phone: '', title: input.role === 'admin' ? 'Administrator' : 'Sales Manager', role: input.role, status: 'invited', invitedAt: new Date().toISOString() })
        })
        return id
      },
      resendInvite(id: string) {
        mutate((d) => {
          const s = d.sellers.find((x) => x.id === id)
          if (s) s.invitedAt = new Date().toISOString()
        })
      },
      updateSeller(id: string, patch: Partial<Pick<Seller, 'name' | 'email' | 'phone' | 'title' | 'role' | 'status' | 'lang' | 'prefs'>>) {
        mutate((d) => {
          const s = d.sellers.find((x) => x.id === id)
          if (s) Object.assign(s, patch)
        })
      },
      acceptInvite(input: { name: string; email: string }): Session {
        const email = input.email.trim().toLowerCase()
        const existing = stateRef.current.sellers.find((x) => x.email === email)
        const session: Session = { role: existing?.role ?? 'seller', userId: existing?.id ?? uid('u') }
        mutate((d) => {
          let s = d.sellers.find((x) => x.id === session.userId)
          if (!s) {
            s = { id: session.userId, name: input.name.trim(), email, phone: '', title: 'Sales Manager', role: 'seller', status: 'active' }
            d.sellers.push(s)
          }
          s.name = input.name.trim()
          s.status = 'active'
          s.invitedAt = undefined
          d.session = session
          pushNote(d, { title: 'Taklif qabul qilindi', detail: `${s.name} jamoaga qo‘shildi`, link: '/admin/settings/users', kind: 'goal' })
        })
        return session
      },
    }),
    [mutate],
  )

  return { state, actions }
}

type Store = ReturnType<typeof useDemoStore>
export const StoreContext = createContext<Store | null>(null)

export function useDemo(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider')
  return ctx
}
