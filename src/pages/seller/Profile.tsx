import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Avatar, Button, Field, Input, Modal, Select, Toggle } from '../../components/ui'
import { useToast } from '../../components/toast'
import { ResetDemoModal } from '../../components/ResetDemo'
import { SellerPage } from '../../layouts/SellerLayout'
import { useDemo } from '../../store/store'
import { useMe } from './useMe'
import { isValidEmail, isValidPhone } from '../../lib/format'

type Sheet = 'info' | 'password' | 'notify' | 'lang' | 'help' | 'reset' | null

const LANGS = [
  { value: 'uz', label: 'O‘zbekcha' },
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
]

export default function Profile() {
  const { actions } = useDemo()
  const me = useMe()
  const navigate = useNavigate()
  const [sheet, setSheet] = useState<Sheet>(null)
  const close = () => setSheet(null)
  const lang = LANGS.find((l) => l.value === (me.lang ?? 'uz'))!

  const items: { key: Exclude<Sheet, null>; icon: string; label: string; hint?: string }[] = [
    { key: 'info', icon: 'user', label: 'Shaxsiy ma’lumotlar' },
    { key: 'password', icon: 'lock', label: 'Parolni o‘zgartirish' },
    { key: 'notify', icon: 'bell', label: 'Bildirishnomalar' },
    { key: 'lang', icon: 'globe', label: 'Til', hint: lang.label },
    { key: 'help', icon: 'help', label: 'Yordam' },
    { key: 'reset', icon: 'refresh', label: 'Demo ma’lumotlarni tiklash' },
  ]

  return (
    <SellerPage title="Profil">
      <div className="profile-head">
        <Avatar name={me.name} size={76} />
        <b style={{ fontSize: 19, marginTop: 6 }}>{me.name}</b>
        <span className="muted">{me.title || 'Sotuv menejeri'}</span>
        <span className="small muted">{me.email}</span>
      </div>
      <div className="menu-list">
        {items.map((i) => (
          <button key={i.key} onClick={() => setSheet(i.key)}>
            <Icon name={i.icon} size={19} />
            <span className="grow">{i.label}</span>
            {i.hint && <span className="small muted">{i.hint}</span>}
            <Icon name="chevronRight" size={16} />
          </button>
        ))}
        <button
          className="danger"
          onClick={() => {
            actions.logout()
            navigate('/login', { replace: true })
          }}
        >
          <Icon name="logout" size={19} />
          <span className="grow">Hisobdan chiqish</span>
        </button>
      </div>
      {sheet === 'info' && <InfoSheet onClose={close} />}
      {sheet === 'password' && <PasswordSheet onClose={close} />}
      {sheet === 'notify' && <NotifySheet onClose={close} />}
      {sheet === 'lang' && <LangSheet onClose={close} />}
      {sheet === 'help' && (
        <Modal open onClose={close} title="Yordam" footer={<Button onClick={close}>Yopish</Button>}>
          <div className="stack">
            <p className="small"><b>Qo‘ng‘iroq qanday ishlaydi?</b><br />Bu demo: qo‘ng‘iroq simulyatsiya qilinadi, haqiqiy aloqa va audio yozuvi yo‘q.</p>
            <p className="small"><b>AI tahlili qayerdan keladi?</b><br />Tahlillar oldindan tayyorlangan demo ma’lumotlardan olinadi; tashqi AI xizmatiga ulanmaydi.</p>
            <p className="small"><b>Ma’lumotlar qayerda saqlanadi?</b><br />Faqat shu brauzerning lokal xotirasida. Parol saqlanmaydi.</p>
          </div>
        </Modal>
      )}
      <ResetDemoModal open={sheet === 'reset'} onClose={close} />
    </SellerPage>
  )
}

function InfoSheet({ onClose }: { onClose: () => void }) {
  const { actions } = useDemo()
  const me = useMe()
  const toast = useToast()
  const [f, setF] = useState({ name: me.name, phone: me.phone, email: me.email })
  const [e, setE] = useState<Record<string, string>>({})
  const save = () => {
    const err: Record<string, string> = {}
    if (f.name.trim().length < 3) err.name = 'Ism kamida 3 ta belgi'
    if (!isValidPhone(f.phone)) err.phone = 'Telefon formati: +998 90 123 45 67'
    if (!isValidEmail(f.email)) err.email = 'Email noto‘g‘ri'
    setE(err)
    if (Object.keys(err).length) return
    actions.updateSeller(me.id, { name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() })
    toast('Ma’lumotlar saqlandi')
    onClose()
  }
  return (
    <Modal
      open
      onClose={onClose}
      title="Shaxsiy ma’lumotlar"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Bekor qilish</Button>
          <Button onClick={save}>Saqlash</Button>
        </>
      }
    >
      <div className="form-stack">
        <Field label="Ism familiya" error={e.name}>
          <Input value={f.name} onChange={(x) => setF({ ...f, name: x.target.value })} />
        </Field>
        <Field label="Telefon" error={e.phone}>
          <Input value={f.phone} inputMode="tel" onChange={(x) => setF({ ...f, phone: x.target.value })} />
        </Field>
        <Field label="Email" error={e.email}>
          <Input value={f.email} type="email" onChange={(x) => setF({ ...f, email: x.target.value })} />
        </Field>
      </div>
    </Modal>
  )
}

function PasswordSheet({ onClose }: { onClose: () => void }) {
  const toast = useToast()
  const [f, setF] = useState({ cur: '', next: '', again: '' })
  const [e, setE] = useState<Record<string, string>>({})
  const save = () => {
    const err: Record<string, string> = {}
    if (!f.cur) err.cur = 'Joriy parolni kiriting'
    if (f.next.length < 8) err.next = 'Kamida 8 ta belgi'
    else if (!/\d/.test(f.next) || !/[a-zA-Z]/.test(f.next)) err.next = 'Harf va raqam bo‘lishi kerak'
    if (f.again !== f.next) err.again = 'Parollar mos emas'
    setE(err)
    if (Object.keys(err).length) return
    toast('Demo: parol o‘zgartirildi (hech qayerda saqlanmaydi)')
    onClose()
  }
  return (
    <Modal
      open
      onClose={onClose}
      title="Parolni o‘zgartirish"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Bekor qilish</Button>
          <Button onClick={save}>O‘zgartirish</Button>
        </>
      }
    >
      <div className="form-stack">
        <Field label="Joriy parol" error={e.cur}>
          <Input type="password" autoComplete="current-password" value={f.cur} onChange={(x) => setF({ ...f, cur: x.target.value })} />
        </Field>
        <Field label="Yangi parol" error={e.next} hint="Demo rejim: parol saqlanmaydi">
          <Input type="password" autoComplete="new-password" value={f.next} onChange={(x) => setF({ ...f, next: x.target.value })} />
        </Field>
        <Field label="Yangi parolni takrorlang" error={e.again}>
          <Input type="password" autoComplete="new-password" value={f.again} onChange={(x) => setF({ ...f, again: x.target.value })} />
        </Field>
      </div>
    </Modal>
  )
}

function NotifySheet({ onClose }: { onClose: () => void }) {
  const { actions } = useDemo()
  const me = useMe()
  const toast = useToast()
  const [p, setP] = useState(me.prefs ?? { followup: true, newLead: true, aiReady: true })
  const rows: { key: keyof typeof p; label: string }[] = [
    { key: 'followup', label: 'Follow-up eslatmalari' },
    { key: 'newLead', label: 'Yangi lead biriktirilganda' },
    { key: 'aiReady', label: 'AI tahlili tayyor bo‘lganda' },
  ]
  return (
    <Modal
      open
      onClose={onClose}
      title="Bildirishnomalar"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Bekor qilish</Button>
          <Button
            onClick={() => {
              actions.updateSeller(me.id, { prefs: p })
              toast('Sozlamalar saqlandi')
              onClose()
            }}
          >
            Saqlash
          </Button>
        </>
      }
    >
      <div className="stack">
        {rows.map((r) => (
          <div key={r.key} className="row-between">
            <span>{r.label}</span>
            <Toggle label={r.label} checked={p[r.key]} onChange={(v) => setP({ ...p, [r.key]: v })} />
          </div>
        ))}
        <span className="small muted">Ilova ichidagi eslatmalar. Push yoki SMS yuborilmaydi.</span>
      </div>
    </Modal>
  )
}

function LangSheet({ onClose }: { onClose: () => void }) {
  const { actions } = useDemo()
  const me = useMe()
  const toast = useToast()
  const [v, setV] = useState(me.lang ?? 'uz')
  return (
    <Modal
      open
      onClose={onClose}
      title="Til"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Bekor qilish</Button>
          <Button
            onClick={() => {
              actions.updateSeller(me.id, { lang: v })
              toast(v === 'uz' ? 'Til saqlandi' : 'Til saqlandi · demo interfeys hozircha o‘zbekcha')
              onClose()
            }}
          >
            Saqlash
          </Button>
        </>
      }
    >
      <Field label="Interfeys tili">
        <Select value={v} onChange={(e) => setV(e.target.value)} options={LANGS} />
      </Field>
    </Modal>
  )
}
