import type { Analysis, CallResult, TranscriptLine } from './types'

const PRICE_TRANSCRIPT: TranscriptLine[] = [
  { speaker: 'seller', t: 12, text: 'Assalomu alaykum! Qaysi xizmat sizni qiziqtirdi?' },
  { speaker: 'client', t: 27, text: 'Jamoamiz uchun kerak. Narxi qancha bo‘ladi?' },
  { speaker: 'seller', t: 46, text: 'Jamoangizda nechta sotuvchi ishlaydi va leadlar qayerdan keladi?' },
  { speaker: 'client', t: 58, text: 'Besh kishi. Asosan Instagramdan keladi.' },
  { speaker: 'seller', t: 70, text: 'Professional paketda qo‘ng‘iroq va lead nazorati bor.' },
  { speaker: 'seller', t: 83, text: 'Hozir leadlarni qanday kuzatyapsiz?' },
  { speaker: 'seller', t: 125, text: 'Qaysi bosqichda eng ko‘p mijoz yo‘qolyapti?' },
  { speaker: 'client', t: 134, text: 'Narxi biz uchun biroz baland ekan.' },
  { speaker: 'seller', t: 182, text: 'Bu paket jamoa ishini bir joyda nazorat qilishga yordam beradi.' },
  { speaker: 'client', t: 240, text: 'Tushunarli. O‘ylab ko‘rib, keyin javob beraman.' },
]

const CLOSE_TRANSCRIPT: TranscriptLine[] = [
  { speaker: 'seller', t: 8, text: 'Assalomu alaykum! Kecha yuborgan taklifimizni ko‘rdingizmi?' },
  { speaker: 'client', t: 19, text: 'Ha, ko‘rdim. Bizga Professional paket ma’qul.' },
  { speaker: 'seller', t: 41, text: 'Sizga eng muhim funksiya qaysi?' },
  { speaker: 'client', t: 55, text: 'Qo‘ng‘iroqlar tahlili va sotuvchilar reytingi.' },
  { speaker: 'seller', t: 92, text: 'Ikkalasi ham paketda bor. Shu hafta boshlaymizmi?' },
  { speaker: 'client', t: 104, text: 'Ha, boshlaymiz. Shartnomani yuboring.' },
  { speaker: 'seller', t: 130, text: 'Ajoyib, shartnoma va to‘lov ma’lumotini hozir yuboraman.' },
]

const LOST_TRANSCRIPT: TranscriptLine[] = [
  { speaker: 'seller', t: 10, text: 'Assalomu alaykum! Arizangiz bo‘yicha qo‘ng‘iroq qilyapman.' },
  { speaker: 'client', t: 21, text: 'Hozircha bizga kerak emas, boshqa tizimdan foydalanyapmiz.' },
  { speaker: 'seller', t: 48, text: 'Hozirgi tizimda nimasi sizga yoqmaydi?' },
  { speaker: 'client', t: 63, text: 'Hammasi yetarli, rahmat.' },
  { speaker: 'seller', t: 80, text: 'Tushunarli, kelajakda bog‘lansak bo‘ladimi?' },
]

const NOANSWER_TRANSCRIPT: TranscriptLine[] = [
  { speaker: 'seller', t: 4, text: 'Assalomu alaykum... (javob berilmadi)' },
]

export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function buildAnalysis(callId: string, result: CallResult, duration: number): Analysis {
  const r = rng(hashString(callId))
  const jitter = (base: number, spread: number) => Math.max(5, Math.min(98, Math.round(base + (r() - 0.5) * spread)))
  const scale = (lines: TranscriptLine[]) => {
    const last = lines[lines.length - 1]?.t || 1
    const k = Math.min(1, (duration * 0.85) / last)
    return lines.map((l) => ({ ...l, t: Math.round(l.t * Math.max(k, 0.2)) }))
  }

  if (result === 'won') {
    const transcript = scale(CLOSE_TRANSCRIPT)
    return {
      interest: jitter(90, 10),
      hesitation: jitter(18, 14),
      intent: 'Yuqori',
      priceObjection: false,
      quality: jitter(88, 10),
      talkRatio: [52, 48],
      needs: jitter(80, 14),
      openQuestions: [transcript[2].t],
      objection: jitter(78, 12),
      objectionAt: null,
      closing: jitter(86, 10),
      closingFound: true,
      summary: 'Mijoz taklifni qabul qildi. Closing savoli aniq berildi, keyingi qadam — shartnoma va to‘lov ma’lumotini yuborish.',
      tips: [
        { title: 'Natijani mustahkamlang', text: 'Shartnomani bugun yuboring va to‘lov muddatini kelishing.' },
        { title: 'Qo‘shimcha taklif', text: 'Jamoa kengaysa qaysi paketga o‘tishni oldindan tushuntiring.' },
        { title: 'Tavsiya so‘rang', text: '“Sizga o‘xshash kompaniyalarni bilasizmi?” deb so‘rang.' },
      ],
      transcript,
    }
  }
  if (result === 'lost') {
    const transcript = scale(LOST_TRANSCRIPT)
    return {
      interest: jitter(22, 14),
      hesitation: jitter(70, 14),
      intent: 'Past',
      priceObjection: false,
      quality: jitter(64, 14),
      talkRatio: [61, 39],
      needs: jitter(42, 16),
      openQuestions: [transcript[2].t],
      objection: jitter(40, 16),
      objectionAt: transcript[1].t,
      closing: jitter(30, 14),
      closingFound: false,
      summary: 'Mijoz hozirgi tizimidan foydalanmoqda. Ehtiyoj chuqur aniqlanmadi; 30 kundan keyin qayta bog‘lanish mumkin.',
      tips: [
        { title: 'Ehtiyojni aniqlang', text: '“Hozirgi tizimda qaysi hisobot yetishmaydi?” deb so‘rang.' },
        { title: 'Farqni ko‘rsating', text: 'AI tahlil va qo‘ng‘iroq nazoratini misol bilan tushuntiring.' },
        { title: 'Eshikni ochiq qoldiring', text: 'Keyingi aloqa sanasini mijoz bilan kelishing.' },
      ],
      transcript,
    }
  }
  if (result === 'noanswer') {
    return {
      interest: 0,
      hesitation: 0,
      intent: 'Past',
      priceObjection: false,
      quality: 0,
      talkRatio: [100, 0],
      needs: 0,
      openQuestions: [],
      objection: 0,
      objectionAt: null,
      closing: 0,
      closingFound: false,
      summary: 'Mijoz javob bermadi. Boshqa vaqtda qayta qo‘ng‘iroq qilish tavsiya etiladi.',
      tips: [{ title: 'Qayta urinib ko‘ring', text: 'Ish kunining ikkinchi yarmida qo‘ng‘iroq qiling yoki xabar yuboring.' }],
      transcript: NOANSWER_TRANSCRIPT,
    }
  }
  const transcript = scale(PRICE_TRANSCRIPT)
  const interest = jitter(result === 'interested' ? 84 : 72, 12)
  return {
    interest,
    hesitation: jitter(result === 'thinking' ? 70 : 60, 14),
    intent: interest > 78 ? 'Yuqori' : 'O‘rta',
    priceObjection: true,
    quality: jitter(82, 12),
    talkRatio: [58, 42],
    needs: jitter(71, 14),
    openQuestions: [transcript[0].t, transcript[2].t, transcript[5].t, transcript[6].t],
    objection: jitter(58, 14),
    objectionAt: transcript[7].t,
    closing: jitter(48, 14),
    closingFound: false,
    summary:
      'Mijoz mahsulotga qiziqdi, lekin narx bo‘yicha ikkilandi. Keyingi suhbatda ehtiyojni aniqlashtiring, paket qiymatini tushuntiring va aniq taklif bering.',
    tips: [
      { title: 'Ehtiyojni aniqlang', text: '“Jamoangizda qaysi jarayon ko‘p vaqt olyapti?”' },
      { title: 'Qiymatni tushuntiring', text: 'Narxdan oldin xizmatning foydasini misol bilan ko‘rsating.' },
      { title: 'Aniq taklif bering', text: '“Shu paket bilan boshlashga tayyormisiz?”' },
    ],
    transcript,
  }
}
