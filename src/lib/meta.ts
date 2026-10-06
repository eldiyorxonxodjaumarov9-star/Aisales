export type Tone = 'blue' | 'purple' | 'cyan' | 'amber' | 'green' | 'red' | 'gray'

export const RESULT_META: Record<string, { label: string; tone: Tone }> = {
  won: { label: 'Sotib oldi', tone: 'green' },
  interested: { label: 'Qiziqmoqda', tone: 'cyan' },
  thinking: { label: 'Ikkilanish', tone: 'amber' },
  followup: { label: 'Follow-up', tone: 'blue' },
  lost: { label: 'Rad etdi', tone: 'red' },
  noanswer: { label: 'Javob bermadi', tone: 'gray' },
}

export function toneOf(v: number) {
  return v >= 75 ? 'green' : v >= 55 ? 'amber' : 'red'
}

export function tempOf(score: number): { label: string; tone: Tone } {
  if (score >= 80) return { label: 'Issiq', tone: 'red' }
  if (score >= 60) return { label: 'Iliq', tone: 'amber' }
  return { label: 'Sovuq', tone: 'cyan' }
}
