const pad = (n: number) => String(n).padStart(2, '0')

export const MONTHS_SHORT = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
export const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
export const WEEKDAYS_SHORT = ['Yak', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sha']

export function dayKey(d: Date | string): string {
  const x = typeof d === 'string' ? new Date(d) : d
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`
}

export function fromDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function isSameDay(a: string | Date, b: string | Date): boolean {
  return dayKey(a) === dayKey(b)
}

export function fmtDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

export function fmtTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fmtDateTime(iso: string): string {
  return `${fmtDate(iso)} ${fmtTime(iso)}`
}

export function fmtShortDay(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

export function fmtRange(from: string, to: string): string {
  const a = fromDayKey(from)
  const b = fromDayKey(to)
  return `${pad(a.getDate())} ${MONTHS_SHORT[a.getMonth()]} – ${pad(b.getDate())} ${MONTHS_SHORT[b.getMonth()]} ${b.getFullYear()}`
}

export function fmtRelativeDay(iso: string): string {
  const d = new Date(iso)
  const today = startOfDay(new Date())
  const diff = Math.round((startOfDay(d).getTime() - today.getTime()) / 86400000)
  if (diff === 0) return `Bugun, ${fmtTime(d)}`
  if (diff === -1) return `Kecha, ${fmtTime(d)}`
  if (diff === 1) return `Ertaga, ${fmtTime(d)}`
  return `${fmtShortDay(d)}, ${fmtTime(d)}`
}

export function fmtAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 1) return 'hozirgina'
  if (mins < 60) return `${mins} daq. oldin`
  const h = Math.round(mins / 60)
  if (h < 24) return `${h} soat oldin`
  return `${Math.round(h / 24)} kun oldin`
}

export function fmtDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`
}

export function fmtNum(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

export function fmtMoney(n: number): string {
  return `${fmtNum(n)} so‘m`
}

export function fmtPct(n: number, digits = 1): string {
  if (!isFinite(n)) return '0%'
  return `${n.toFixed(digits)}%`
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export function firstName(name: string): string {
  return name.split(' ')[0] ?? name
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function isValidPhone(v: string): boolean {
  return v.replace(/\D/g, '').length >= 9
}

export function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

export function toLocalInput(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  return { date: dayKey(d), time: fmtTime(d) }
}

export function fromLocalInput(date: string, time: string): string {
  const [h, m] = time.split(':').map(Number)
  const d = fromDayKey(date)
  d.setHours(h || 0, m || 0, 0, 0)
  return d.toISOString()
}
