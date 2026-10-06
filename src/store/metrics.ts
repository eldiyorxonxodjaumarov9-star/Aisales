import type { Call, DateRange, DemoState, Lead, Source } from './types'
import { addDays, dayKey, fromDayKey } from '../lib/format'
import { hashString } from './analysis'

export function rangeBounds(range: DateRange) {
  const from = fromDayKey(range.from)
  const to = addDays(fromDayKey(range.to), 1)
  return { from, to }
}

export function inRange(iso: string, range: DateRange): boolean {
  const { from, to } = rangeBounds(range)
  const t = new Date(iso).getTime()
  return t >= from.getTime() && t < to.getTime()
}

export function previousRange(range: DateRange): DateRange {
  const from = fromDayKey(range.from)
  const to = fromDayKey(range.to)
  const len = Math.round((to.getTime() - from.getTime()) / 86400000) + 1
  return { from: dayKey(addDays(from, -len)), to: dayKey(addDays(from, -1)) }
}

export function rangeDays(range: DateRange): string[] {
  const out: string[] = []
  let d = fromDayKey(range.from)
  const end = fromDayKey(range.to)
  while (d <= end && out.length < 92) {
    out.push(dayKey(d))
    d = addDays(d, 1)
  }
  return out
}

export interface Kpis {
  leads: number
  calls: number
  sales: number
  conversion: number
  lost: number
  followups: number
  revenue: number
}

export function kpis(s: DemoState, range: DateRange, sellerId?: string): Kpis {
  const leads = s.leads.filter((l) => inRange(l.createdAt, range) && (!sellerId || l.sellerId === sellerId))
  const calls = s.calls.filter((c) => inRange(c.startedAt, range) && (!sellerId || c.sellerId === sellerId))
  const sales = s.sales.filter((x) => inRange(x.at, range) && (!sellerId || x.sellerId === sellerId))
  const { to } = rangeBounds(range)
  const followups = s.followups.filter((f) => !f.done && new Date(f.due) < to && (!sellerId || f.sellerId === sellerId)).length
  return {
    leads: leads.length,
    calls: calls.length,
    sales: sales.length,
    conversion: leads.length ? (leads.filter((l) => l.status === 'won').length / leads.length) * 100 : 0,
    lost: leads.filter((l) => l.status === 'lost').length,
    followups,
    revenue: sales.reduce((a, x) => a + x.amount, 0),
  }
}

export function delta(cur: number, prev: number): number {
  if (!prev) return cur ? 100 : 0
  return ((cur - prev) / prev) * 100
}

export function funnel(s: DemoState, range: DateRange) {
  const leads = s.leads.filter((l) => inRange(l.createdAt, range))
  const called = new Set(s.calls.map((c) => c.leadId))
  const total = leads.length
  const contacted = leads.filter((l) => called.has(l.id) || l.status !== 'new').length
  const interested = leads.filter((l) => ['interested', 'offer', 'won', 'followup'].includes(l.status)).length
  const offer = leads.filter((l) => ['offer', 'won'].includes(l.status)).length
  const won = leads.filter((l) => l.status === 'won').length
  return [
    { label: 'Leadlar', value: total, color: '#245CFF' },
    { label: 'Qo‘ng‘iroq', value: contacted, color: '#885CF6' },
    { label: 'Qiziqdi', value: interested, color: '#46B9E8' },
    { label: 'Taklif', value: offer, color: '#F6B755' },
    { label: 'Sotuv', value: won, color: '#13AC80' },
  ].map((x) => ({ ...x, pct: total ? (x.value / total) * 100 : 0 }))
}

export function dailySeries(s: DemoState, range: DateRange, sellerId?: string) {
  const days = rangeDays(range)
  const by = (items: { at: string; seller: string | null }[]) =>
    days.map((d) => items.filter((x) => dayKey(x.at) === d && (!sellerId || x.seller === sellerId)).length)
  return {
    days,
    leads: by(s.leads.map((l) => ({ at: l.createdAt, seller: l.sellerId }))),
    calls: by(s.calls.map((c) => ({ at: c.startedAt, seller: c.sellerId }))),
    sales: by(s.sales.map((x) => ({ at: x.at, seller: x.sellerId }))),
  }
}

export const SOURCE_COLORS: Record<Source, string> = {
  Instagram: '#245CFF',
  Facebook: '#885CF6',
  'Lead Ads': '#46B9E8',
  Boshqa: '#B5C1D4',
}

export const STATUS_HEX: Record<string, string> = {
  blue: '#245CFF',
  purple: '#885CF6',
  cyan: '#46B9E8',
  amber: '#F6B755',
  green: '#13AC80',
  red: '#E84C61',
  gray: '#94A3BD',
}

export function sourceBreakdown(leads: Lead[]) {
  const sources: Source[] = ['Instagram', 'Facebook', 'Lead Ads', 'Boshqa']
  return sources.map((src) => ({ label: src, value: leads.filter((l) => l.source === src).length, color: SOURCE_COLORS[src] }))
}

export function statusBreakdown(s: DemoState, leads: Lead[]) {
  return s.statuses.map((st) => ({ label: st.label, value: leads.filter((l) => l.status === st.key).length, color: STATUS_HEX[st.color] }))
}

export function sellerStats(s: DemoState, sellerId: string, range?: DateRange) {
  const ok = (iso: string) => !range || inRange(iso, range)
  const leads = s.leads.filter((l) => l.sellerId === sellerId && ok(l.createdAt))
  const calls = s.calls.filter((c) => c.sellerId === sellerId && ok(c.startedAt))
  const sales = s.sales.filter((x) => x.sellerId === sellerId && ok(x.at))
  const analysed = calls.filter((c) => c.analysis && c.result !== 'noanswer')
  const avg = (f: (c: Call) => number) => (analysed.length ? Math.round(analysed.reduce((a, c) => a + f(c), 0) / analysed.length) : 0)
  const overdue = s.followups.filter((f) => f.sellerId === sellerId && !f.done && new Date(f.due) < new Date()).length
  return {
    leads: leads.length,
    calls: calls.length,
    sales: sales.length,
    revenue: sales.reduce((a, x) => a + x.amount, 0),
    conversion: leads.length ? (leads.filter((l) => l.status === 'won').length / leads.length) * 100 : 0,
    needs: avg((c) => c.analysis!.needs),
    objection: avg((c) => c.analysis!.objection),
    closing: avg((c) => c.analysis!.closing),
    quality: avg((c) => c.analysis!.quality),
    noClosingPct: analysed.length ? Math.round((analysed.filter((c) => !c.analysis!.closingFound).length / analysed.length) * 100) : 0,
    overdue,
  }
}

export function campaignStats(s: DemoState, range?: DateRange) {
  return s.campaigns.map((c) => {
    const leads = s.leads.filter((l) => l.campaignId === c.id && (!range || inRange(l.createdAt, range)))
    const ids = new Set(leads.map((l) => l.id))
    const sales = s.sales.filter((x) => ids.has(x.leadId))
    return { ...c, leads: leads.length, sales: sales.length, conversion: leads.length ? (sales.length / leads.length) * 100 : 0, revenue: sales.reduce((a, x) => a + x.amount, 0) }
  })
}

export function aiInsights(s: DemoState, range: DateRange) {
  const calls = s.calls.filter((c) => inRange(c.startedAt, range) && c.analysis)
  const priceLeads = new Set(calls.filter((c) => c.analysis!.priceObjection).map((c) => c.leadId)).size
  const overdueLeads = new Set(s.followups.filter((f) => !f.done && new Date(f.due) < new Date()).map((f) => f.leadId)).size
  const sellers = s.sellers.filter((x) => x.role === 'seller' && x.status === 'active').map((x) => ({ seller: x, st: sellerStats(s, x.id, range) }))
  const withCalls = sellers.filter((x) => x.st.calls > 0)
  const worstClosing = [...withCalls].sort((a, b) => b.st.noClosingPct - a.st.noClosingPct)[0]
  const bestNeeds = [...withCalls].sort((a, b) => b.st.needs - a.st.needs)[0]
  const out: { text: string; tone: 'amber' | 'red' | 'green' }[] = [
    { text: `${priceLeads} ta lead narx bo‘yicha ikkilangan`, tone: 'amber' },
    { text: `${overdueLeads} ta lead uchun follow-up muddati o‘tgan`, tone: 'amber' },
  ]
  if (worstClosing) out.push({ text: `${worstClosing.seller.name.split(' ')[0]}: ${worstClosing.st.noClosingPct}% suhbatda closing savoli topilmadi`, tone: 'red' })
  if (bestNeeds) out.push({ text: `${bestNeeds.seller.name.split(' ')[0]}: ehtiyojni aniqlash ko‘rsatkichi yuqori (${bestNeeds.st.needs}%)`, tone: 'green' })
  return out
}

export function lossReasons(s: DemoState, range: DateRange) {
  const lost = s.leads.filter((l) => l.status === 'lost' && inRange(l.createdAt, range))
  const reasons = [
    { label: 'Narx e’tirozi', color: '#E84C61' },
    { label: 'Follow-up qilinmagan', color: '#F6B755' },
    { label: 'Sovuq lead', color: '#46B9E8' },
    { label: 'Kech javob', color: '#885CF6' },
    { label: 'Mahsulot mos emas', color: '#245CFF' },
    { label: 'Boshqa', color: '#B5C1D4' },
  ]
  const cumulative = [31, 53, 70, 83, 92, 100]
  const counts = reasons.map((r) => ({ ...r, value: 0 }))
  for (const l of lost) {
    const n = hashString(l.id) % 100
    counts[cumulative.findIndex((c) => n < c)].value++
  }
  return { total: lost.length, items: counts }
}
