import { buildAnalysis, rng } from './analysis'
import type {
  Call,
  CallResult,
  Campaign,
  DemoState,
  FollowUp,
  Integration,
  Lead,
  LeadStatus,
  Notification,
  Sale,
  Seller,
  Settings,
  Source,
  SyncLog,
} from './types'
import { addDays, dayKey, startOfDay } from '../lib/format'

export const DEMO_VERSION = 4

export const PRODUCTS: { name: string; price: number }[] = [
  { name: 'Professional paket', price: 1_500_000 },
  { name: 'Standart paket', price: 900_000 },
  { name: 'Biznes paket', price: 2_400_000 },
]

export const SOURCES: Source[] = ['Instagram', 'Facebook', 'Lead Ads', 'Boshqa']

export const DEFAULT_STATUSES: LeadStatus[] = [
  { key: 'new', label: 'Yangi', color: 'blue', system: true },
  { key: 'contacted', label: 'Aloqada', color: 'purple', system: true },
  { key: 'interested', label: 'Qiziqmoqda', color: 'cyan', system: true },
  { key: 'offer', label: 'Taklif yuborildi', color: 'amber', system: true },
  { key: 'won', label: 'Sotib oldi', color: 'green', system: true },
  { key: 'lost', label: 'Rad etdi', color: 'red', system: true },
  { key: 'followup', label: 'Follow-up', color: 'purple', system: true },
]

const SELLERS: Seller[] = [
  { id: 'u-admin', name: 'Admin', email: 'admin@example.com', phone: '+998 90 000 00 01', title: 'Boshqaruvchi', role: 'admin', status: 'active' },
  { id: 's1', name: 'Aziz Ismoilov', email: 'aziz@example.com', phone: '+998 90 111 22 33', title: 'Sales Manager', role: 'seller', status: 'active' },
  { id: 's2', name: 'Madina Karimova', email: 'madina@example.com', phone: '+998 90 222 33 44', title: 'Sales Manager', role: 'seller', status: 'active' },
  { id: 's3', name: 'Sardor Mirzayev', email: 'sardor@example.com', phone: '+998 90 333 44 55', title: 'Sales Manager', role: 'seller', status: 'active' },
  { id: 's4', name: 'Anvar Jo‘rayev', email: 'anvar@example.com', phone: '+998 90 444 55 66', title: 'Sales Manager', role: 'seller', status: 'active' },
  { id: 's5', name: 'Dilshod Otabekov', email: 'dilshod@example.com', phone: '+998 90 555 66 77', title: 'Sales Manager', role: 'seller', status: 'active' },
  { id: 's6', name: 'Nodira Saidova', email: 'nodira@example.com', phone: '+998 90 666 77 88', title: 'Sales Manager', role: 'seller', status: 'active' },
  { id: 's7', name: 'Kamola Yusupova', email: 'kamola@example.com', phone: '+998 90 777 88 99', title: 'Sales Manager', role: 'seller', status: 'invited' },
]

const CAMPAIGNS: Campaign[] = [
  { id: 'c1', name: 'Instagram Set 1', source: 'Instagram', spend: 50, active: true },
  { id: 'c2', name: 'Instagram Set 2', source: 'Instagram', spend: 40, active: true },
  { id: 'c3', name: 'Facebook Kamp. 1', source: 'Facebook', spend: 35, active: true },
  { id: 'c4', name: 'Lead Ads yangi', source: 'Lead Ads', spend: 28, active: true },
]

const FIRST = ['Bekzod', 'Dilnoza', 'Shoxrux', 'Malika', 'Jasur', 'Gulnora', 'Farrux', 'Nilufar', 'Rustam', 'Kamola', 'Sherzod', 'Zarina', 'Ulug‘bek', 'Shahlo', 'Akmal', 'Feruza', 'Doniyor', 'Lola', 'Sanjar', 'Mohira', 'Botir', 'Yulduz', 'Islom', 'Nargiza']
const LAST = ['Tursunov', 'Rahimova', 'Qodirov', 'Yusupova', 'Nazarov', 'Abdullayeva', 'Xolmatov', 'Sobirova', 'Ergashev', 'Usmonova', 'Hamidov', 'Mirzayeva', 'Rasulov', 'Normatova', 'Sultonov', 'Aliyeva']

const FIXED: { name: string; source: Source; campaignId: string | null; seller: string; status: string; score: number }[] = [
  { name: 'Ali Valiyev', source: 'Instagram', campaignId: 'c1', seller: 's1', status: 'interested', score: 87 },
  { name: 'Diyorbek Sattorov', source: 'Facebook', campaignId: 'c3', seller: 's1', status: 'offer', score: 62 },
  { name: 'Madina Karimova', source: 'Instagram', campaignId: 'c1', seller: 's2', status: 'followup', score: 58 },
  { name: 'Otabek Karimov', source: 'Facebook', campaignId: 'c3', seller: 's1', status: 'followup', score: 71 },
  { name: 'Ziyoda Aliyeva', source: 'Instagram', campaignId: 'c2', seller: 's1', status: 'interested', score: 80 },
  { name: 'Jamshid Ergashev', source: 'Facebook', campaignId: 'c3', seller: 's1', status: 'new', score: 57 },
  { name: 'Sevinch Rasulova', source: 'Instagram', campaignId: 'c1', seller: 's2', status: 'contacted', score: 76 },
]

const defaultSettings = (): Settings => ({
  company: {
    name: 'Demo Company',
    phone: '+998 90 123 45 67',
    email: 'info@example.com',
    address: 'Toshkent, O‘zbekiston',
    website: 'https://example.com',
    timezone: 'Asia/Tashkent (GMT+5)',
    dateFormat: 'DD.MM.YYYY',
    language: 'O‘zbekcha',
    logoName: null,
  },
  kpi: { dailySales: 10, dailyCalls: 30, firstResponse: 5, reminder: 15, targetConversion: 20 },
  ai: {
    language: 'Avtomatik · O‘zbekcha / Ruscha',
    criteria: ['Ehtiyoj', 'E’tiroz', 'Closing', 'Follow-up'],
    autoRun: true,
    minDuration: 30,
    adminReview: true,
  },
  telephony: { provider: '', server: 'sip.example.com', extension: '101', tokenSet: false, announce: true, retention: 90 },
  notifications: {
    newLead: { app: true, telegram: true, email: false },
    followup: { app: true, telegram: true, email: false },
    sale: { app: true, telegram: false, email: true },
    ai: { app: true, telegram: false, email: false },
    integration: { app: true, telegram: true, email: true },
    daily: { app: false, telegram: true, email: true },
  },
  roles: {
    leads: { admin: 'full', seller: 'own' },
    calls: { admin: 'all', seller: 'own' },
    kpi: { admin: 'full', seller: 'own' },
    coaching: { admin: 'all', seller: 'own' },
    billing: { admin: 'full', seller: 'none' },
    export: { admin: 'yes', seller: 'no' },
  },
  billing: { plan: 'Professional' },
  security: {
    twoFactor: true,
    passwordChangedAt: new Date().toISOString(),
    sessions: [
      { id: 'ses1', device: 'Chrome · Windows', place: 'Toshkent', current: true },
      { id: 'ses2', device: 'Safari · iPhone', place: 'Toshkent', current: false },
      { id: 'ses3', device: 'Edge · Windows', place: 'Samarqand', current: false },
    ],
  },
  meta: {
    page: 'SalesAI Demo',
    instagram: '@salesai_demo',
    form: 'Professional paket — ariza',
    defaultSeller: 's1',
    distribution: 'auto',
  },
})

export function createSeed(): DemoState {
  const r = rng(20261004)
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)]
  const now = new Date()
  const today = startOfDay(now)
  const at = (dayOffset: number, h: number, m: number) => {
    const d = addDays(today, dayOffset)
    d.setHours(h, m, 0, 0)
    return d
  }
  const pastAt = (dayOffset: number, h: number, m: number) => {
    let d = at(dayOffset, h, m)
    if (d > now) d = new Date(now.getTime() - (5 + Math.floor(r() * 50)) * 60000)
    return d.toISOString()
  }

  const leads: Lead[] = []
  const calls: Call[] = []
  const sales: Sale[] = []
  const followups: FollowUp[] = []
  let callSeq = 1
  let fuSeq = 1

  const sellerPool = ['s1', 's1', 's1', 's2', 's2', 's3', 's4', 's5', 's6']
  const sourcePool: Source[] = [...Array(13).fill('Instagram'), ...Array(7).fill('Facebook'), ...Array(3).fill('Lead Ads'), 'Boshqa', 'Boshqa']
  const statusPool = ['new', 'new', 'contacted', 'contacted', 'interested', 'interested', 'offer', 'won', 'won', 'lost', 'lost', 'followup']

  const total = 120
  for (let i = 0; i < total; i++) {
    const fixed = FIXED[i]
    const source: Source = fixed?.source ?? pick(sourcePool)
    const campaignId =
      fixed?.campaignId !== undefined
        ? fixed.campaignId
        : source === 'Instagram'
          ? r() < 0.55 ? 'c1' : 'c2'
          : source === 'Facebook'
            ? 'c3'
            : source === 'Lead Ads'
              ? 'c4'
              : null
    const status = fixed?.status ?? pick(statusPool)
    const dayOffset = fixed ? -(i % 3) : -Math.floor(r() * 30)
    const createdAt = pastAt(dayOffset, 9 + Math.floor(r() * 8), Math.floor(r() * 60))
    const sellerId = fixed?.seller ?? (status === 'new' && r() < 0.4 ? null : pick(sellerPool))
    const name = fixed?.name ?? `${pick(FIRST)} ${pick(LAST)}`
    const product = i < 7 ? 'Professional paket' : pick(PRODUCTS).name
    const id = `L-${10284 - i}`
    const phoneTail = String(4567 + i * 100).padStart(4, '0').slice(-4)
    const score =
      fixed?.score ??
      (status === 'won' ? 75 + Math.floor(r() * 20) : status === 'lost' ? 15 + Math.floor(r() * 25) : 45 + Math.floor(r() * 40))

    const lead: Lead = {
      id,
      name,
      phone: `+998 90 123 ${phoneTail.slice(0, 2)} ${phoneTail.slice(2)}`,
      source,
      campaignId,
      product,
      sellerId,
      status,
      score,
      createdAt,
      lastContactAt: null,
      notes: [],
      history: [{ id: `h-${id}-0`, at: createdAt, title: 'Lead qabul qilindi', detail: `${source}${campaignId ? ' · ' + CAMPAIGNS.find((c) => c.id === campaignId)?.name : ''}` }],
    }

    if (status !== 'new' && sellerId) {
      const created = new Date(createdAt)
      const daysSince = Math.max(0, Math.round((today.getTime() - startOfDay(created).getTime()) / 86400000))
      const callCount = 1 + Math.floor(r() * 3)
      const span = Math.min(daysSince, 1 + Math.floor(r() * 6))
      for (let c = 0; c < callCount; c++) {
        const isLast = c === callCount - 1
        const off = Math.min(0, -daysSince + Math.round(((c + 1) * span) / callCount))
        let result: CallResult = 'thinking'
        if (isLast) {
          result =
            status === 'won' ? 'won' : status === 'lost' ? 'lost' : status === 'followup' ? 'followup' : status === 'interested' ? 'interested' : status === 'offer' ? 'thinking' : r() < 0.5 ? 'noanswer' : 'thinking'
        } else {
          result = r() < 0.35 ? 'noanswer' : 'interested'
        }
        const isAli = i === 0 && isLast
        const startedAt = isAli ? pastAt(0, 10, 21) : pastAt(off, 9 + Math.floor(r() * 9), Math.floor(r() * 60))
        const duration = isAli ? 402 : result === 'noanswer' ? 15 + Math.floor(r() * 15) : 90 + Math.floor(r() * 420)
        const cid = `C-${String(callSeq++).padStart(4, '0')}`
        calls.push({
          id: cid,
          leadId: id,
          sellerId,
          startedAt,
          duration,
          result,
          aiStatus: duration >= 30 ? 'ready' : 'none',
          analysis: duration >= 30 ? buildAnalysis(cid, result, duration) : null,
        })
        if (!lead.lastContactAt || startedAt > lead.lastContactAt) lead.lastContactAt = startedAt
      }
      const myCalls = calls.filter((c) => c.leadId === id)
      const last = myCalls[myCalls.length - 1]
      lead.history.push({ id: `h-${id}-1`, at: last.startedAt, title: `Qo‘ng‘iroq yakunlandi · ${Math.floor(last.duration / 60).toString().padStart(2, '0')}:${(last.duration % 60).toString().padStart(2, '0')}`, detail: last.analysis ? 'AI: ' + last.analysis.summary.split('.')[0] : 'Javob berilmadi' })

      if (status === 'won') {
        const price = PRODUCTS.find((p) => p.name === product)?.price ?? 1_500_000
        sales.push({ id: `S-${id}`, leadId: id, sellerId, product, amount: price, payment: r() < 0.8 ? 'paid' : 'partial', note: 'Mijoz taklifni qabul qildi', at: last.startedAt })
        lead.history.push({ id: `h-${id}-2`, at: last.startedAt, title: 'Sotuv yakunlandi', detail: `${product} · ${price.toLocaleString('en-US')} so‘m` })
      }
      if (status === 'offer') {
        lead.history.push({ id: `h-${id}-3`, at: last.startedAt, title: 'Taklif yuborildi', detail: `${product} · Telegram` })
      }
    }
    leads.push(lead)
  }

  // Follow-ups matching the reference plan (today 14:00, 15:00, 16:30, 17:00) plus overdue and upcoming ones.
  const fu = (leadIdx: number, due: Date, note: string, kind: FollowUp['kind'] = 'followup', done = false) => {
    const lead = leads[leadIdx]
    if (!lead.sellerId) return
    followups.push({ id: `F-${String(fuSeq++).padStart(3, '0')}`, leadId: lead.id, sellerId: lead.sellerId, due: due.toISOString(), note, reminder: 15, kind, done })
  }
  fu(1, at(0, 14, 0), 'Narx bo‘yicha qayta bog‘lanish', 'call')
  fu(0, at(0, 15, 0), 'Paket qiymatini tushuntirish')
  fu(2, at(0, 16, 30), 'Qayta bog‘lanish')
  fu(3, at(0, 17, 0), 'Narx bo‘yicha javob')
  fu(4, at(-1, 11, 0), 'Taklifni aniqlashtirish')
  fu(6, at(-1, 16, 0), 'Demo ko‘rsatish', 'offer')
  fu(4, at(1, 10, 0), 'Shartnoma tafsilotlari', 'offer')
  fu(5, at(2, 13, 0), 'Birinchi qo‘ng‘iroq', 'call')
  let extra = 0
  for (let i = 7; i < leads.length && extra < 22; i++) {
    const l = leads[i]
    if (!l.sellerId || !['followup', 'interested', 'offer', 'contacted'].includes(l.status)) continue
    const off = Math.floor(r() * 9) - 3
    fu(i, at(off, 9 + Math.floor(r() * 8), r() < 0.5 ? 0 : 30), pick(['Qayta qo‘ng‘iroq', 'Taklif yuborish', 'Narx bo‘yicha javob', 'Ehtiyojni aniqlash']), pick(['followup', 'call', 'offer']), off < -1 && r() < 0.5)
    extra++
  }
  for (const f of followups) {
    const lead = leads.find((l) => l.id === f.leadId)
    lead?.history.push({ id: `h-${f.id}`, at: new Date(Math.min(Date.now(), new Date(f.due).getTime() - 3600000 * 4)).toISOString(), title: 'Follow-up belgilandi', detail: `${new Date(f.due).toLocaleDateString('uz-UZ')} · ${f.note}` })
  }
  for (const l of leads) l.history.sort((a, b) => a.at.localeCompare(b.at))

  const ali = leads[0]
  ali.notes.push({ id: 'n-1', text: 'Narx bo‘yicha ikkilangan. Xizmatning oylik qiymatini va jamoaga foydasini tushuntirish kerak.', at: pastAt(0, 10, 35), author: 'Aziz Ismoilov' })

  const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString()
  const notifications: Notification[] = [
    { id: 'nt1', title: 'Follow-up kechikdi', detail: 'Ziyoda Aliyeva · Aziz · kecha 11:00 da rejalashtirilgan', at: ago(5), read: false, link: '/admin/calendar', kind: 'warning' },
    { id: 'nt2', title: 'Yangi lead qabul qilindi', detail: 'Instagram Lead Ads · Madina Karimova', at: ago(12), read: false, link: `/admin/leads/${leads[2].id}`, kind: 'lead' },
    { id: 'nt3', title: 'AI tahlili tayyor', detail: 'Ali Valiyev bilan 06:42 daqiqalik qo‘ng‘iroq', at: ago(25), read: false, link: '/admin/calls', kind: 'ai' },
    { id: 'nt4', title: 'Sotuv yakunlandi', detail: 'Aziz: Professional paket · 1,500,000 so‘m', at: ago(60), read: true, link: '/admin/reports', kind: 'sale' },
    { id: 'nt5', title: 'Integratsiya tokeni yangilansin', detail: 'Facebook tokeni amal qilish muddati tugamoqda', at: ago(180), read: true, link: '/admin/integrations/meta', kind: 'integration' },
    { id: 'nt6', title: 'Kunlik reja 60% bajarildi', detail: '6 / 10 sotuv · jamoa bo‘yicha', at: ago(300), read: true, link: '/admin', kind: 'goal' },
  ]

  const integrations: Integration[] = [
    { id: 'instagram', name: 'Instagram', description: 'Kompaniya sahifasi va lead manbalari', connected: true, lastSync: ago(5) },
    { id: 'facebook', name: 'Facebook Lead Ads', description: 'Formalar orqali kelgan leadlarni qabul qilish', connected: true, lastSync: ago(5) },
    { id: 'sip', name: 'Telefon tizimi / SIP', description: 'Qo‘ng‘iroq, audio va webhook integratsiyasi', connected: false, lastSync: null, needsSetup: true },
    { id: 'telegram', name: 'Telegram', description: 'Follow-up va muhim bildirishnomalar', connected: true, lastSync: ago(5) },
    { id: 'email', name: 'Email', description: 'Takliflar va mijoz bilan yozishmalar', connected: false, lastSync: null },
    { id: 'webhook', name: 'Webhook / API', description: 'Boshqa tizimlar bilan ma’lumot almashish', connected: true, lastSync: ago(40) },
  ]

  const syncLog: SyncLog[] = [
    { id: 'sl1', at: ago(5), integration: 'Instagram', message: '3 ta yangi lead qabul qilindi', ok: true },
    { id: 'sl2', at: ago(5), integration: 'Facebook Lead Ads', message: '2 ta yangi lead qabul qilindi', ok: true },
    { id: 'sl3', at: ago(40), integration: 'Webhook / API', message: 'Holat tekshirildi', ok: true },
  ]

  return {
    version: DEMO_VERSION,
    sellers: SELLERS.map((s) => ({ ...s, invitedAt: s.status === 'invited' ? ago(60 * 26) : undefined })),
    leads,
    calls: calls.sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    followups,
    sales,
    campaigns: CAMPAIGNS,
    statuses: DEFAULT_STATUSES,
    notifications,
    integrations,
    syncLog,
    settings: defaultSettings(),
    range: { from: dayKey(addDays(today, -6)), to: dayKey(today) },
    session: null,
  }
}
