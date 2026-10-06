export type Source = 'Instagram' | 'Facebook' | 'Lead Ads' | 'Boshqa'

export type StatusColor = 'blue' | 'purple' | 'cyan' | 'amber' | 'green' | 'red' | 'gray'

export interface LeadStatus {
  key: string
  label: string
  color: StatusColor
  system?: boolean
}

export type CallResult = 'won' | 'interested' | 'thinking' | 'followup' | 'lost' | 'noanswer'

export type AiStatus = 'ready' | 'queued' | 'none'

export interface Seller {
  id: string
  name: string
  email: string
  phone: string
  title: string
  role: 'admin' | 'seller'
  status: 'active' | 'invited' | 'blocked'
  invitedAt?: string
  lang?: string
  prefs?: { followup: boolean; newLead: boolean; aiReady: boolean }
}

export interface Note {
  id: string
  text: string
  at: string
  author: string
}

export interface Activity {
  id: string
  at: string
  title: string
  detail: string
}

export interface Lead {
  id: string
  name: string
  phone: string
  email?: string
  source: Source
  campaignId: string | null
  product: string
  sellerId: string | null
  status: string
  score: number
  createdAt: string
  lastContactAt: string | null
  notes: Note[]
  history: Activity[]
}

export interface TranscriptLine {
  speaker: 'seller' | 'client'
  t: number
  text: string
}

export interface Analysis {
  interest: number
  hesitation: number
  intent: 'Yuqori' | 'O‘rta' | 'Past'
  priceObjection: boolean
  quality: number
  talkRatio: [number, number]
  needs: number
  openQuestions: number[]
  objection: number
  objectionAt: number | null
  closing: number
  closingFound: boolean
  summary: string
  tips: { title: string; text: string }[]
  transcript: TranscriptLine[]
}

export interface Call {
  id: string
  leadId: string
  sellerId: string
  startedAt: string
  duration: number
  result: CallResult
  aiStatus: AiStatus
  analysis: Analysis | null
  reviewedSummary?: string
}

export interface FollowUp {
  id: string
  leadId: string
  sellerId: string
  due: string
  note: string
  reminder: number
  kind: 'followup' | 'call' | 'offer' | 'task'
  done: boolean
}

export interface Sale {
  id: string
  leadId: string
  sellerId: string
  product: string
  amount: number
  payment: 'paid' | 'partial' | 'pending'
  note: string
  at: string
}

export interface Campaign {
  id: string
  name: string
  source: Source
  spend: number
  active: boolean
}

export interface Notification {
  id: string
  title: string
  detail: string
  at: string
  read: boolean
  link?: string
  kind: 'warning' | 'lead' | 'ai' | 'sale' | 'integration' | 'goal'
}

export interface Integration {
  id: string
  name: string
  description: string
  connected: boolean
  lastSync: string | null
  needsSetup?: boolean
}

export interface SyncLog {
  id: string
  at: string
  integration: string
  message: string
  ok: boolean
}

export type Permission = 'full' | 'own' | 'all' | 'none' | 'yes' | 'no'

export interface Settings {
  company: {
    name: string
    phone: string
    email: string
    address: string
    website: string
    timezone: string
    dateFormat: string
    language: string
    logoName: string | null
  }
  kpi: {
    dailySales: number
    dailyCalls: number
    firstResponse: number
    reminder: number
    targetConversion: number
  }
  ai: {
    language: string
    criteria: string[]
    autoRun: boolean
    minDuration: number
    adminReview: boolean
  }
  telephony: {
    provider: string
    server: string
    extension: string
    tokenSet: boolean
    announce: boolean
    retention: number
  }
  notifications: Record<string, { app: boolean; telegram: boolean; email: boolean }>
  roles: Record<string, { admin: string; seller: string }>
  billing: { plan: 'Starter' | 'Professional' | 'Enterprise' }
  security: {
    twoFactor: boolean
    passwordChangedAt: string
    sessions: { id: string; device: string; place: string; current: boolean }[]
  }
  meta: {
    page: string
    instagram: string
    form: string
    defaultSeller: string
    distribution: 'auto' | 'manual' | 'fixed'
  }
}

export interface Session {
  role: 'admin' | 'seller'
  userId: string
}

export interface DateRange {
  from: string
  to: string
}

export interface DemoState {
  version: number
  sellers: Seller[]
  leads: Lead[]
  calls: Call[]
  followups: FollowUp[]
  sales: Sale[]
  campaigns: Campaign[]
  statuses: LeadStatus[]
  notifications: Notification[]
  integrations: Integration[]
  syncLog: SyncLog[]
  settings: Settings
  range: DateRange
  session: Session | null
}
