const cache = new Map<number, string>()

/** Builds a quiet, speech-like synthetic WAV locally so the player has real media to control. */
export function sampleAudioUrl(durationSec: number): string {
  const seconds = Math.max(5, Math.min(900, Math.round(durationSec)))
  const hit = cache.get(seconds)
  if (hit) return hit
  const rate = 8000
  const n = seconds * rate
  const buf = new ArrayBuffer(44 + n)
  const v = new DataView(buf)
  const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)))
  w(0, 'RIFF')
  v.setUint32(4, 36 + n, true)
  w(8, 'WAVE')
  w(12, 'fmt ')
  v.setUint32(16, 16, true)
  v.setUint16(20, 1, true)
  v.setUint16(22, 1, true)
  v.setUint32(24, rate, true)
  v.setUint32(28, rate, true)
  v.setUint16(32, 1, true)
  v.setUint16(34, 8, true)
  w(36, 'data')
  v.setUint32(40, n, true)
  let phase = 0
  for (let i = 0; i < n; i++) {
    const t = i / rate
    const turn = Math.floor(t / 6) % 2
    const syllable = Math.max(0, Math.sin(t * Math.PI * 3.1 + turn)) ** 2
    const pause = Math.sin(t * 0.9) > -0.6 ? 1 : 0
    const pitch = (turn ? 190 : 125) + 25 * Math.sin(t * 2.3)
    phase += (2 * Math.PI * pitch) / rate
    const s = (Math.sin(phase) + 0.4 * Math.sin(phase * 2) + 0.2 * Math.sin(phase * 3)) * syllable * pause * 0.12
    v.setUint8(44 + i, Math.max(0, Math.min(255, Math.round(128 + s * 127))))
  }
  const url = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }))
  cache.set(seconds, url)
  return url
}
