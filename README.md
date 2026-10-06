# SalesAI — AI Sales Control (frontend demo)

Faqat frontend: React 19 + TypeScript + Vite. Backend, API, ma'lumotlar bazasi yoki tashqi xizmat (AI, Meta, Telegram, email, SIP) ulanmagan. Barcha ma'lumotlar demo bo'lib, brauzerning `localStorage`ida (`salesai-demo-state` kaliti) saqlanadi.

## Ishga tushirish

```bash
npm install
npm run dev          # http://localhost:5173
```

## Tekshiruv va build

```bash
npx tsc -b           # typecheck
npm run lint         # oxlint
npm run build        # dist/ ga production build
npm run preview      # build natijasini lokal ko'rish
```

## Demo kirish

Login sahifasida **Demo Admin** yoki **Demo Sotuvchi** tugmasini bosing, yoki:

- `admin@example.com` — admin paneli (`/admin`)
- `aziz@example.com` — sotuvchi mobil kabineti (`/seller`)

Parol istalgan 6+ belgi; u tekshirilmaydi va saqlanmaydi. Sessiyada faqat `{ role, userId }` saqlanadi.

## Demo xususiyatlar

- **Demo ma'lumotlarni tiklash** — Sozlamalar (admin) yoki Profil (sotuvchi) ichida; boshlang'ich holatni qaytaradi.
- Qo'ng'iroq simulyatsiya qilinadi (taymer, mute, karnay, klaviatura) — haqiqiy qo'ng'iroq qilinmaydi.
- AI tahlillari oldindan tayyorlangan demo ma'lumotlardan olinadi; yangi qo'ng'iroq ~5 soniya "navbatda" turadi.
- Audio yozuvlar brauzerda lokal generatsiya qilinadi (play/pause, seek, tezlik).
- Eksport CSV / XLSX / PDF fayllarni brauzerda yaratib yuklab beradi.

## Eksportni oddiy Chrome'da tekshirish

Holat: **Chrome'da hali sinalmagan.** Cursor brauzerida fayllar yaratilishi, nomi va tarkibi (CSV BOM, XLSX ZIP tuzilmasi, PDF sarlavhasi va `%%EOF`) tekshirilgan, lekin u yuklangan fayllarni diskka yozmaydi.

1. `npm run build` va `npm run preview` ni ishga tushiring, Chrome'da http://localhost:4173 ni oching.
2. **Demo Admin** bilan kiring → **Leadlar** → manbani `Instagram` qiling va qidiruvga `Karimov` yozing.
3. **Eksport** → qamrov "Joriy filtr natijasi" → **XLSX** → **Yuklab olish**. So'ng **CSV** va **PDF** uchun takrorlang.
   Bir necha faylni ketma-ket yuklaganda Chrome "bir nechta fayl yuklashga ruxsat" so'rasa, ruxsat bering.
4. `Downloads` papkasida `leadlar-YYYY-MM-DD.xlsx`, `.csv` va `.pdf` paydo bo'lganini tekshiring.
5. Fayllarni oching:
   - **XLSX** — Excel yoki LibreOffice'da xatosiz ochiladi, ustunlar: ID, Mijoz, Telefon, Manba, … ; filtr natijasidagi qator(lar) bor.
   - **CSV** — Excel'da o'zbekcha belgilar (`‘`, `’`) buzilmasdan ko'rinadi (fayl UTF-8 BOM bilan yoziladi).
   - **PDF** — Chrome yoki boshqa PDF ko'ruvchida jadval sarlavhasi va qatorlar ko'rinadi.
6. **Sozlamalar → Tarif → Hisob-fakturalar → PDF**: `inv-YYYYMM-….pdf` yuklanadi va "Demo hujjat — haqiqiy to'lov emas" yozuvi bor.
7. Natijani shu bo'limdagi "Holat" qatoriga yozing (sana, Chrome versiyasi, qaysi format o'tdi yoki o'tmadi).

## Tuzilma

- `src/store` — demo store, seed ma'lumotlar, metrikalar
- `src/pages/admin` — admin desktop sahifalari
- `src/pages/seller` — sotuvchi mobil sahifalari
- `src/pages/auth` — kirish, parolni tiklash, taklifni qabul qilish
- `src/layouts` — admin va sotuvchi layoutlari
- `src/dialogs`, `src/components` — modal oynalar va umumiy UI komponentlari
- `src/lib` — eksport (CSV/XLSX/PDF, faqat eksport bosilganda yuklanadi), audio, `useNow` va yordamchi funksiyalar

Sahifalar `React.lazy` orqali route darajasida alohida chunk'larga bo'lingan.
