import { useState, type ReactNode } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Avatar, Badge, Button, Card, DemoTag, Field, Input, Modal, PageHeader, Pagination, Progress, Select, StateBlock, Toggle } from '../../components/ui'
import { useToast } from '../../components/toast'
import { useNow } from '../../lib/useNow'
import { ResetDemoModal } from '../../components/ResetDemo'
import { useDemo } from '../../store/store'
import { useDialogs } from '../../dialogs/Dialogs'
import { STATUS_HEX } from '../../store/metrics'
import type { LeadStatus, Settings } from '../../store/types'
import { MONTHS, fmtAgo, fmtDate, fmtDateTime, isValidEmail, isValidPhone } from '../../lib/format'

const SECTIONS = [
  { key: 'company', label: 'Kompaniya' },
  { key: 'users', label: 'Foydalanuvchilar' },
  { key: 'roles', label: 'Rollar va huquqlar' },
  { key: 'kpi', label: 'KPI va maqsadlar' },
  { key: 'statuses', label: 'Lead statuslari' },
  { key: 'ai', label: 'AI sozlamalari' },
  { key: 'telephony', label: 'Telefon tizimi' },
  { key: 'notifications', label: 'Bildirishnomalar' },
  { key: 'billing', label: 'To‘lov va tarif' },
  { key: 'security', label: 'Xavfsizlik' },
]

export default function SettingsPage() {
  const { section = 'company' } = useParams()
  const navigate = useNavigate()
  const [resetOpen, setResetOpen] = useState(false)
  const cur = SECTIONS.find((s) => s.key === section) ?? SECTIONS[0]
  return (
    <>
      <PageHeader
        title="Sozlamalar"
        subtitle={cur.label}
        actions={
          <Button variant="secondary" icon="refresh" onClick={() => setResetOpen(true)}>
            Demo ma’lumotlarni tiklash
          </Button>
        }
      />
      <ResetDemoModal open={resetOpen} onClose={() => setResetOpen(false)} />
      <div className="settings-layout">
        <Card className="settings-nav-card" pad={false}>
          <nav className="settings-nav" aria-label="Sozlamalar bo‘limlari">
            {SECTIONS.map((s) => (
              <NavLink key={s.key} to={`/admin/settings/${s.key}`}>
                {s.label}
              </NavLink>
            ))}
          </nav>
        </Card>
        <div className="stack" style={{ gap: 12 }}>
          <Select className="settings-select" aria-label="Sozlamalar bo‘limi" value={cur.key} onChange={(e) => navigate(`/admin/settings/${e.target.value}`)} options={SECTIONS.map((s) => ({ value: s.key, label: s.label }))} />
          {cur.key === 'company' && <CompanySection />}
          {cur.key === 'users' && <UsersSection />}
          {cur.key === 'roles' && <RolesSection />}
          {cur.key === 'kpi' && <KpiSection />}
          {cur.key === 'statuses' && <StatusSection />}
          {cur.key === 'ai' && <AiSection />}
          {cur.key === 'telephony' && <TelephonySection />}
          {cur.key === 'notifications' && <NotificationsSection />}
          {cur.key === 'billing' && <BillingSection />}
          {cur.key === 'security' && <SecuritySection />}
        </div>
      </div>
    </>
  )
}

function useDraft<K extends keyof Settings>(key: K) {
  const { state, actions } = useDemo()
  const toast = useToast()
  const [draft, setDraft] = useState<Settings[K]>(() => structuredClone(state.settings[key]))
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const dirty = JSON.stringify(draft) !== JSON.stringify(state.settings[key])
  const save = () => {
    actions.updateSettings(key, draft)
    setSavedAt(Date.now())
    toast('Sozlamalar saqlandi')
  }
  const reset = () => setDraft(structuredClone(state.settings[key]))
  return { draft, setDraft, dirty, save, reset, savedAt }
}

function SaveBar({ dirty, onSave, onReset, savedAt, extra, disabled }: { dirty: boolean; onSave: () => void; onReset: () => void; savedAt: number | null; extra?: ReactNode; disabled?: boolean }) {
  return (
    <div className="form-foot">
      <Button onClick={onSave} disabled={!dirty || disabled}>
        Saqlash
      </Button>
      {dirty && (
        <Button variant="ghost" onClick={onReset}>
          Bekor qilish
        </Button>
      )}
      {extra}
      {dirty ? <span className="dirty-hint">Saqlanmagan o‘zgarishlar bor</span> : savedAt ? <span className="saved-hint"><Icon name="check" size={14} /> Saqlandi</span> : null}
    </div>
  )
}

function SettingRow({ title, desc, children, inline }: { title: string; desc?: string; children: ReactNode; inline?: boolean }) {
  return (
    <div className={`setting-row ${inline ? 'inline' : ''}`}>
      <div className="grow">
        <b>{title}</b>
        {desc && <span>{desc}</span>}
      </div>
      <div className="setting-control" style={inline ? { flex: 'none' } : undefined}>
        {children}
      </div>
    </div>
  )
}

/* ---------- Company ---------- */
function CompanySection() {
  const { draft, setDraft, dirty, save, reset, savedAt } = useDraft('company')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (k: keyof typeof draft, v: string | null) => {
    setDraft({ ...draft, [k]: v })
    setErrors({ ...errors, [k]: '' })
  }
  const submit = () => {
    const e: Record<string, string> = {}
    if (draft.name.trim().length < 2) e.name = 'Kompaniya nomini kiriting'
    if (!isValidPhone(draft.phone)) e.phone = 'Telefon noto‘g‘ri'
    if (!isValidEmail(draft.email)) e.email = 'Email noto‘g‘ri'
    if (draft.website && !/^https?:\/\/.+\..+/.test(draft.website)) e.website = 'https:// bilan boshlang'
    setErrors(e)
    if (!Object.keys(e).length) save()
  }
  return (
    <Card title="Kompaniya">
      <div className="grid cols-2" style={{ alignItems: 'start' }}>
        <div className="form-stack">
          <Field label="Kompaniya nomi" error={errors.name}>
            <Input value={draft.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Telefon" error={errors.phone}>
            <Input value={draft.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label="Email" error={errors.email}>
            <Input value={draft.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Manzil">
            <Input value={draft.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
          <Field label="Veb-sayt" error={errors.website}>
            <Input value={draft.website} onChange={(e) => set('website', e.target.value)} />
          </Field>
        </div>
        <div className="form-stack">
          <div className="soft-box">
            <b>Logotip va brend</b>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--blue)', margin: '10px 0' }}>{draft.name || 'SalesAI'}</div>
            <label className="btn btn-secondary btn-md" style={{ cursor: 'pointer' }}>
              <Icon name="upload" size={16} /> Logotipni yuklash
              <input
                type="file"
                accept=".svg,.png,image/svg+xml,image/png"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (file.size > 2 * 1024 * 1024) return setErrors({ ...errors, logo: 'Fayl 2 MB dan katta' })
                  set('logoName', file.name)
                }}
              />
            </label>
            <p className={`small ${errors.logo ? 'text-red' : 'muted'}`} style={{ marginTop: 8 }}>
              {errors.logo || (draft.logoName ? `Tanlandi: ${draft.logoName} (faqat nomi lokal saqlanadi)` : 'SVG / PNG · 2 MB gacha')}
            </p>
          </div>
          <Field label="Vaqt zonasi">
            <Select value={draft.timezone} onChange={(e) => set('timezone', e.target.value)} options={['Asia/Tashkent (GMT+5)', 'Asia/Samarkand (GMT+5)', 'Europe/Moscow (GMT+3)'].map((v) => ({ value: v, label: v }))} />
          </Field>
          <Field label="Sana formati">
            <Select value={draft.dateFormat} onChange={(e) => set('dateFormat', e.target.value)} options={['DD.MM.YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY'].map((v) => ({ value: v, label: v }))} />
          </Field>
          <Field label="Til">
            <Select value={draft.language} onChange={(e) => set('language', e.target.value)} options={['O‘zbekcha', 'Ruscha', 'English'].map((v) => ({ value: v, label: v }))} />
          </Field>
        </div>
      </div>
      <SaveBar dirty={dirty} onSave={submit} onReset={reset} savedAt={savedAt} />
    </Card>
  )
}

/* ---------- Users ---------- */
function UsersSection() {
  const { state, actions } = useDemo()
  const dialogs = useDialogs()
  const toast = useToast()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const users = state.sellers
  const PER = 6
  return (
    <Card
      title="Foydalanuvchilar"
      pad={false}
      action={
        <Button size="sm" icon="plus" onClick={() => dialogs.invite()}>
          Foydalanuvchi qo‘shish
        </Button>
      }
    >
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Foydalanuvchi</th>
              <th>Rol</th>
              <th>Holat</th>
              <th>Harakat</th>
            </tr>
          </thead>
          <tbody>
            {users.slice((page - 1) * PER, page * PER).map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="person">
                    <Avatar name={u.name} size={30} />
                    <div>
                      <div className="person-name">{u.name}</div>
                      <div className="person-sub">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td>{u.role === 'admin' ? 'Administrator' : 'Sotuvchi'}</td>
                <td>
                  <Badge tone={u.status === 'active' ? 'green' : u.status === 'invited' ? 'amber' : 'red'}>{u.status === 'active' ? 'Faol' : u.status === 'invited' ? 'Taklif yuborilgan' : 'Bloklangan'}</Badge>
                </td>
                <td>
                  {u.status === 'invited' ? (
                    <div className="row">
                      <button
                        className="link-btn"
                        onClick={() => {
                          actions.resendInvite(u.id)
                          toast(`Taklif qayta yaratildi (demo, email yuborilmadi)`)
                        }}
                      >
                        Qayta yuborish
                      </button>
                      <button className="link-btn" onClick={() => navigate(`/invite?email=${encodeURIComponent(u.email)}&name=${encodeURIComponent(u.name)}`)}>
                        Havola
                      </button>
                      {u.invitedAt && <span className="small muted">{fmtAgo(u.invitedAt)}</span>}
                    </div>
                  ) : (
                    <button className="link-btn" onClick={() => dialogs.editUser(u.id)}>
                      Tahrirlash
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={users.length} perPage={PER} onChange={setPage} label={`${users.length} ta foydalanuvchi`} />
    </Card>
  )
}

/* ---------- Roles ---------- */
const MODULES: { key: string; label: string; options: { value: string; label: string }[] }[] = [
  { key: 'leads', label: 'Barcha leadlar', options: [{ value: 'full', label: 'To‘liq' }, { value: 'own', label: 'Faqat o‘ziga biriktirilgan' }, { value: 'none', label: 'Ruxsat yo‘q' }] },
  { key: 'calls', label: 'Qo‘ng‘iroq va audio', options: [{ value: 'all', label: 'Barcha' }, { value: 'own', label: 'Faqat o‘zining' }, { value: 'none', label: 'Ruxsat yo‘q' }] },
  { key: 'kpi', label: 'Sotuvchilar / KPI', options: [{ value: 'full', label: 'To‘liq' }, { value: 'own', label: 'O‘z natijasi' }, { value: 'none', label: 'Ruxsat yo‘q' }] },
  { key: 'coaching', label: 'AI coaching', options: [{ value: 'all', label: 'Barcha' }, { value: 'own', label: 'O‘z qo‘ng‘iroqlari' }, { value: 'none', label: 'Ruxsat yo‘q' }] },
  { key: 'billing', label: 'Integratsiya / billing', options: [{ value: 'full', label: 'To‘liq' }, { value: 'none', label: 'Ruxsat yo‘q' }] },
  { key: 'export', label: 'Lead eksporti', options: [{ value: 'yes', label: 'Ha' }, { value: 'no', label: 'Yo‘q' }] },
]

function RolesSection() {
  const { draft, setDraft, dirty, save, reset, savedAt } = useDraft('roles')
  return (
    <Card title="Rollar va huquqlar" subtitle="Ruxsatlar matritsasi · administrator huquqlari qulflangan" pad={false}>
      <div className="table-wrap">
        <table className="table matrix">
          <thead>
            <tr>
              <th>Modul</th>
              <th>Admin</th>
              <th>Sotuvchi</th>
            </tr>
          </thead>
          <tbody>
            {MODULES.map((m) => (
              <tr key={m.key}>
                <td className="strong">{m.label}</td>
                <td>
                  <Select value={draft[m.key].admin} disabled options={m.options} aria-label={`${m.label} — admin`} />
                </td>
                <td>
                  <Select value={draft[m.key].seller} onChange={(e) => setDraft({ ...draft, [m.key]: { ...draft[m.key], seller: e.target.value } })} options={m.options} aria-label={`${m.label} — sotuvchi`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding: '0 16px 16px' }}>
        <SaveBar dirty={dirty} onSave={save} onReset={reset} savedAt={savedAt} />
      </div>
    </Card>
  )
}

/* ---------- KPI ---------- */
function KpiSection() {
  const { draft, setDraft, dirty, save, reset, savedAt } = useDraft('kpi')
  const rows: { key: keyof typeof draft; title: string; desc: string; unit: string; min: number; max: number }[] = [
    { key: 'dailySales', title: 'Kunlik sotuv maqsadi', desc: 'Har bir sotuvchi uchun', unit: 'ta', min: 1, max: 100 },
    { key: 'dailyCalls', title: 'Kunlik qo‘ng‘iroq maqsadi', desc: 'Har bir sotuvchi uchun', unit: 'ta', min: 1, max: 300 },
    { key: 'firstResponse', title: 'Leadga birinchi javob muddati', desc: 'Yangi lead kelgach', unit: 'daqiqa', min: 1, max: 120 },
    { key: 'reminder', title: 'Follow-up eslatmasi', desc: 'Standart eslatma vaqti', unit: 'daqiqa oldin', min: 5, max: 120 },
    { key: 'targetConversion', title: 'Maqsadli konversiya', desc: 'Sotuv / lead', unit: '%', min: 1, max: 100 },
  ]
  const invalid = rows.some((r) => !(draft[r.key] >= r.min && draft[r.key] <= r.max))
  return (
    <Card title="KPI va maqsadlar">
      {rows.map((r) => {
        const bad = !(draft[r.key] >= r.min && draft[r.key] <= r.max)
        return (
          <SettingRow key={r.key} title={r.title} desc={bad ? `${r.min}–${r.max} oralig‘ida kiriting` : r.desc}>
            <div className="row">
              <Input type="number" min={r.min} max={r.max} value={Number.isNaN(draft[r.key]) ? '' : draft[r.key]} onChange={(e) => setDraft({ ...draft, [r.key]: e.target.valueAsNumber })} aria-label={r.title} style={bad ? { borderColor: 'var(--red)' } : undefined} />
              <span className="muted nowrap">{r.unit}</span>
            </div>
          </SettingRow>
        )
      })}
      <SaveBar dirty={dirty} disabled={invalid} onSave={save} onReset={reset} savedAt={savedAt} />
    </Card>
  )
}

/* ---------- Statuses ---------- */
const COLORS: LeadStatus['color'][] = ['blue', 'purple', 'cyan', 'amber', 'green', 'red', 'gray']

function StatusSection() {
  const { state, actions } = useDemo()
  const toast = useToast()
  const [editing, setEditing] = useState<LeadStatus | null>(null)
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [color, setColor] = useState<LeadStatus['color']>('blue')
  const [err, setErr] = useState('')
  const open = (s: LeadStatus | null) => {
    setEditing(s)
    setAdding(!s)
    setLabel(s?.label ?? '')
    setColor(s?.color ?? 'blue')
    setErr('')
  }
  const close = () => {
    setEditing(null)
    setAdding(false)
  }
  const submit = () => {
    if (label.trim().length < 2) return setErr('Nomini kiriting')
    if (state.statuses.some((s) => s.label.toLowerCase() === label.trim().toLowerCase() && s.key !== editing?.key)) return setErr('Bu nom mavjud')
    if (editing) actions.updateStatus(editing.key, { label: label.trim(), color })
    else actions.addStatus(label, color)
    toast(editing ? 'Status yangilandi' : 'Status qo‘shildi')
    close()
  }
  return (
    <Card title="Lead statuslari" subtitle="Tartib Kanban ustunlari va filtrlarda ishlatiladi">
      {state.statuses.map((s, i) => {
        const count = state.leads.filter((l) => l.status === s.key).length
        return (
          <div key={s.key} className="status-row">
            <span className="status-swatch" style={{ background: STATUS_HEX[s.color] }} />
            <b className="grow">{s.label}</b>
            <span className="small muted hide-mobile">{count} ta lead</span>
            <button className="link-btn" onClick={() => open(s)}>
              Tahrirlash
            </button>
            <button className="icon-btn sm" aria-label={`${s.label}: yuqoriga`} disabled={i === 0} onClick={() => actions.moveStatus(s.key, -1)}>
              <Icon name="chevronUp" size={14} />
            </button>
            <button className="icon-btn sm" aria-label={`${s.label}: pastga`} disabled={i === state.statuses.length - 1} onClick={() => actions.moveStatus(s.key, 1)}>
              <Icon name="chevronDown" size={14} />
            </button>
            {!s.system && (
              <button
                className="icon-btn sm"
                aria-label={`${s.label}: o‘chirish`}
                onClick={() => {
                  actions.removeStatus(s.key)
                  toast(`${s.label} o‘chirildi${count ? `, ${count} ta lead “Yangi”ga o‘tdi` : ''}`, 'info')
                }}
              >
                <Icon name="trash" size={14} />
              </button>
            )}
          </div>
        )
      })}
      <Button variant="soft" icon="plus" onClick={() => open(null)} style={{ marginTop: 8 }}>
        Status qo‘shish
      </Button>
      <Modal
        open={adding || !!editing}
        onClose={close}
        title={editing ? 'Statusni tahrirlash' : 'Status qo‘shish'}
        width={440}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Bekor qilish
            </Button>
            <Button onClick={submit}>Saqlash</Button>
          </>
        }
      >
        <div className="form-stack">
          <Field label="Nomi" error={err}>
            <Input value={label} onChange={(e) => (setLabel(e.target.value), setErr(''))} onKeyDown={(e) => e.key === 'Enter' && submit()} />
          </Field>
          <div className="field">
            <span className="field-label">Rang</span>
            <div className="color-pick">
              {COLORS.map((c) => (
                <button key={c} type="button" aria-label={c} aria-pressed={color === c} className={color === c ? 'active' : ''} style={{ background: STATUS_HEX[c] }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </Card>
  )
}

/* ---------- AI ---------- */
function AiSection() {
  const { draft, setDraft, dirty, save, reset, savedAt } = useDraft('ai')
  const all = ['Ehtiyoj', 'E’tiroz', 'Closing', 'Follow-up', 'Salomlashish']
  return (
    <Card title="AI sozlamalari" action={<DemoTag />}>
      <SettingRow title="Transkripsiya tili" desc="Audio tili aniqlanishi">
        <Select value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value })} options={['Avtomatik · O‘zbekcha / Ruscha', 'O‘zbekcha', 'Ruscha'].map((v) => ({ value: v, label: v }))} />
      </SettingRow>
      <SettingRow title="Baholash mezonlari" desc={draft.criteria.join(' · ') || 'Kamida bittasini tanlang'}>
        <div className="row wrap">
          {all.map((c) => (
            <label key={c} className="check">
              <input type="checkbox" checked={draft.criteria.includes(c)} onChange={() => setDraft({ ...draft, criteria: draft.criteria.includes(c) ? draft.criteria.filter((x) => x !== c) : [...draft.criteria, c] })} />
              {c}
            </label>
          ))}
        </div>
      </SettingRow>
      <SettingRow title="AI ishga tushishi" desc={draft.autoRun ? 'Qo‘ng‘iroq tugagach avtomatik' : 'O‘chirilgan — yangi qo‘ng‘iroqlar tahlil qilinmaydi'} inline>
        <Toggle checked={draft.autoRun} onChange={(v) => setDraft({ ...draft, autoRun: v })} label="AI avtomatik ishga tushishi" />
      </SettingRow>
      <SettingRow title="Minimal audio davomiyligi" desc="Bundan qisqa qo‘ng‘iroqlar tahlil qilinmaydi">
        <Select value={String(draft.minDuration)} onChange={(e) => setDraft({ ...draft, minDuration: Number(e.target.value) })} options={[10, 30, 60, 120].map((v) => ({ value: String(v), label: `${v} soniya` }))} />
      </SettingRow>
      <SettingRow title="Xulosani tekshirish" desc="Admin izoh / tuzatish bera oladi" inline>
        <Toggle checked={draft.adminReview} onChange={(v) => setDraft({ ...draft, adminReview: v })} label="Admin tekshiruvi" />
      </SettingRow>
      <p className="small muted" style={{ marginTop: 10 }}>AI bahosi — taxmin. Har bir xulosa transkript va vaqt belgisi bilan ko‘rsatiladi. Demo: tahlillar oldindan tayyorlangan, AI xizmatiga so‘rov yuborilmaydi.</p>
      <SaveBar dirty={dirty} disabled={!draft.criteria.length} onSave={save} onReset={reset} savedAt={savedAt} />
    </Card>
  )
}

/* ---------- Telephony ---------- */
function TelephonySection() {
  const { state, actions } = useDemo()
  const { draft, setDraft, dirty, save, reset, savedAt } = useDraft('telephony')
  const toast = useToast()
  const [test, setTest] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const sip = state.integrations.find((i) => i.id === 'sip')
  const run = () => {
    setTest('loading')
    setTimeout(() => {
      const ok = !!draft.provider && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(draft.server) && !!draft.extension
      setTest(ok ? 'ok' : 'error')
      if (ok) {
        actions.setIntegration('sip', true)
        toast('Demo ulanish muvaffaqiyatli (haqiqiy SIP ishlatilmadi)')
      }
    }, 1000)
  }
  return (
    <Card title="Telefon tizimi" action={<Badge tone={sip?.connected ? 'green' : 'gray'}>{sip?.connected ? 'Demo ulangan' : 'Ulanmagan'}</Badge>}>
      <SettingRow title="Provayder" desc="SIP / telefoniya provayderini tanlang">
        <Select value={draft.provider} onChange={(e) => setDraft({ ...draft, provider: e.target.value })} options={[{ value: '', label: 'Tanlanmagan' }, ...['Asterisk (SIP)', 'Zadarma', 'OnlinePBX', 'Boshqa SIP'].map((v) => ({ value: v, label: v }))]} />
      </SettingRow>
      <SettingRow title="Server / domen">
        <Input value={draft.server} onChange={(e) => setDraft({ ...draft, server: e.target.value })} />
      </SettingRow>
      <SettingRow title="Extension">
        <Input value={draft.extension} onChange={(e) => setDraft({ ...draft, extension: e.target.value })} />
      </SettingRow>
      <SettingRow title="API token" desc="Demo rejimda talab qilinmaydi va saqlanmaydi">
        <Input type="password" value="" placeholder="••••••••••••••••" disabled aria-label="API token (demo rejimda o‘chirilgan)" />
      </SettingRow>
      <SettingRow title="Qo‘ng‘iroq yozuvi haqida xabar" desc="Suhbat boshida xabardor qilish" inline>
        <Toggle checked={draft.announce} onChange={(v) => setDraft({ ...draft, announce: v })} label="Yozuv haqida xabar" />
      </SettingRow>
      <SettingRow title="Audio saqlash muddati">
        <Select value={String(draft.retention)} onChange={(e) => setDraft({ ...draft, retention: Number(e.target.value) })} options={[30, 90, 180, 365].map((v) => ({ value: String(v), label: `${v} kun` }))} />
      </SettingRow>
      {test === 'loading' && <StateBlock kind="loading" title="Tekshirilmoqda" text="Demo ulanish tekshirilmoqda…" />}
      {test === 'ok' && <div className="soft-box text-green strong" style={{ marginTop: 12 }}>Ulanish muvaffaqiyatli (simulyatsiya)</div>}
      {test === 'error' && <StateBlock kind="error" title="Ulanish xatosi" text="Provayder, to‘g‘ri server domeni va extension kiriting." action={<Button variant="soft" onClick={run}>Qayta urinish</Button>} />}
      <SaveBar
        dirty={dirty}
        onSave={save}
        onReset={reset}
        savedAt={savedAt}
        extra={
          <Button variant="secondary" onClick={run} disabled={test === 'loading'}>
            Ulanishni tekshirish
          </Button>
        }
      />
    </Card>
  )
}

/* ---------- Notifications ---------- */
const EVENTS: { key: string; label: string }[] = [
  { key: 'newLead', label: 'Yangi lead' },
  { key: 'followup', label: 'Follow-up muddati' },
  { key: 'sale', label: 'Sotuv yakunlandi' },
  { key: 'ai', label: 'AI tahlili tayyor' },
  { key: 'integration', label: 'Integratsiya xatosi' },
  { key: 'daily', label: 'Kunlik hisobot' },
]

function NotificationsSection() {
  const { draft, setDraft, dirty, save, reset, savedAt } = useDraft('notifications')
  const ch = [
    { key: 'app', label: 'Ilova ichida' },
    { key: 'telegram', label: 'Telegram' },
    { key: 'email', label: 'Email' },
  ] as const
  return (
    <Card title="Bildirishnomalar" subtitle="Telegram va Email kanallari demo — xabar yuborilmaydi" pad={false}>
      <div className="table-wrap">
        <table className="table notif-matrix">
          <thead>
            <tr>
              <th>Hodisa</th>
              {ch.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EVENTS.map((e) => (
              <tr key={e.key}>
                <td className="strong">{e.label}</td>
                {ch.map((c) => (
                  <td key={c.key}>
                    <Toggle checked={draft[e.key][c.key]} label={`${e.label} — ${c.label}`} onChange={(v) => setDraft({ ...draft, [e.key]: { ...draft[e.key], [c.key]: v } })} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding: '0 16px 16px' }}>
        <SaveBar dirty={dirty} onSave={save} onReset={reset} savedAt={savedAt} />
      </div>
    </Card>
  )
}

/* ---------- Billing ---------- */
const PLANS = [
  { name: 'Starter', users: 10, leads: 10000, audio: 1000, note: 'Kichik jamoalar uchun' },
  { name: 'Professional', users: 50, leads: 50000, audio: 5000, note: 'O‘sayotgan sotuv bo‘limi' },
  { name: 'Enterprise', users: 500, leads: 500000, audio: 50000, note: 'Katta kompaniyalar' },
] as const

function BillingSection() {
  const { state, actions } = useDemo()
  const toast = useToast()
  const [plansOpen, setPlansOpen] = useState(false)
  const [invOpen, setInvOpen] = useState(false)
  const [choice, setChoice] = useState(state.settings.billing.plan)
  const now = useNow()
  const plan = PLANS.find((p) => p.name === state.settings.billing.plan) ?? PLANS[1]
  const users = state.sellers.filter((s) => s.status !== 'blocked').length
  const month = new Date(now)
  const leadsMonth = state.leads.filter((l) => new Date(l.createdAt).getMonth() === month.getMonth()).length
  const audio = state.calls.filter((c) => c.aiStatus === 'ready').length
  const invoices = [0, 1, 2, 3].map((i) => {
    const d = new Date(month.getFullYear(), month.getMonth() - i, 1)
    return { id: `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`, period: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, date: fmtDate(d), status: i === 0 ? 'Kutilmoqda' : 'To‘langan' }
  })
  const usage = [
    { label: 'Foydalanuvchilar', v: users, max: plan.users },
    { label: 'Leadlar / oy', v: leadsMonth, max: plan.leads },
    { label: 'Audio tahlil', v: audio, max: plan.audio },
  ]
  return (
    <Card title="To‘lov va tarif" action={<DemoTag />}>
      <div className="soft-box row-between wrap mb">
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{plan.name}</div>
          <div className="muted">Amaldagi tarif · narx va limitlar tijoriy kelishuvda belgilanadi</div>
        </div>
        <Button onClick={() => (setChoice(state.settings.billing.plan), setPlansOpen(true))}>Tarifni boshqarish</Button>
      </div>
      {usage.map((u) => (
        <div key={u.label} className="usage">
          <div className="usage-head">
            <span>{u.label}</span>
            <b>
              {u.v.toLocaleString('en-US')} / {u.max.toLocaleString('en-US')}
            </b>
          </div>
          <Progress value={(u.v / u.max) * 100} tone={u.v / u.max > 0.85 ? 'red' : 'blue'} />
        </div>
      ))}
      <button className="link-btn" onClick={() => setInvOpen(true)}>
        Hisob-fakturalar va to‘lovlar tarixi →
      </button>

      <Modal
        open={plansOpen}
        onClose={() => setPlansOpen(false)}
        title="Tarifni boshqarish"
        width={680}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPlansOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              disabled={choice === state.settings.billing.plan}
              onClick={() => {
                actions.updateSettings('billing', { plan: choice })
                setPlansOpen(false)
                toast(`Tarif ${choice} ga o‘zgartirildi (simulyatsiya, to‘lov olinmadi)`)
              }}
            >
              Tarifni tanlash
            </Button>
          </>
        }
      >
        <div className="plan-cards">
          {PLANS.map((p) => (
            <button key={p.name} type="button" className={`plan-card ${choice === p.name ? 'active' : ''}`} onClick={() => setChoice(p.name)} aria-pressed={choice === p.name}>
              <b>{p.name}</b>
              <span>{p.note}</span>
              <span>{p.users} foydalanuvchi</span>
              <span>{p.leads.toLocaleString('en-US')} lead / oy</span>
              <span>{p.audio.toLocaleString('en-US')} audio tahlil</span>
              {state.settings.billing.plan === p.name && <Badge tone="blue">Amaldagi</Badge>}
            </button>
          ))}
        </div>
        <p className="small muted" style={{ marginTop: 12 }}>Demo: haqiqiy to‘lov amalga oshirilmaydi.</p>
      </Modal>

      <Modal open={invOpen} onClose={() => setInvOpen(false)} title="Hisob-fakturalar">
        <ul className="list">
          {invoices.map((inv) => (
            <li key={inv.id} className="list-row">
              <Icon name="card" size={18} className="muted" />
              <div className="grow">
                <div className="strong">{inv.id}</div>
                <div className="small muted">
                  {inv.period} · {inv.date}
                </div>
              </div>
              <Badge tone={inv.status === 'To‘langan' ? 'green' : 'amber'}>{inv.status}</Badge>
              <Button
                size="sm"
                variant="secondary"
                icon="download"
                onClick={async () => {
                  try {
                    const { exportTable } = await import('../../lib/export')
                    exportTable(
                      { title: `Hisob-faktura ${inv.id}`, columns: ['Xizmat', 'Davr', 'Holat', 'Izoh'], rows: [[`SalesAI ${plan.name}`, inv.period, inv.status, 'Demo hujjat — haqiqiy to‘lov emas']] },
                      'pdf',
                      inv.id.toLowerCase(),
                      `${state.settings.company.name} · ${inv.date}`,
                    )
                    toast(`${inv.id} PDF yuklab olindi`)
                  } catch {
                    toast('Eksport modulini yuklab bo‘lmadi', 'error')
                  }
                }}
              >
                PDF
              </Button>
            </li>
          ))}
        </ul>
      </Modal>
    </Card>
  )
}

/* ---------- Security ---------- */
function SecuritySection() {
  const { state, actions } = useDemo()
  const toast = useToast()
  const sec = state.settings.security
  const me = state.sellers.find((s) => s.id === state.session?.userId)
  const [pwOpen, setPwOpen] = useState(false)
  const [audit, setAudit] = useState(false)
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwErr, setPwErr] = useState<Record<string, string>>({})
  const log = state.leads
    .flatMap((l) => l.history.filter((h) => /Status|biriktir|Mas’ul|tahrirlandi/.test(h.title)).map((h) => ({ ...h, lead: l.name })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 15)
  const submitPw = () => {
    const e: Record<string, string> = {}
    if (pw.current.length < 6) e.current = 'Joriy parolni kiriting'
    if (pw.next.length < 8) e.next = 'Kamida 8 ta belgi'
    else if (!/\d/.test(pw.next) || !/[a-zA-Z]/.test(pw.next)) e.next = 'Harf va raqam aralash bo‘lsin'
    if (pw.confirm !== pw.next) e.confirm = 'Parollar mos emas'
    setPwErr(e)
    if (Object.keys(e).length) return
    actions.updateSettings('security', { ...sec, passwordChangedAt: new Date().toISOString() })
    setPw({ current: '', next: '', confirm: '' })
    setPwOpen(false)
    toast('Parol o‘zgartirildi (demo: parol saqlanmadi)')
  }
  return (
    <Card title="Xavfsizlik">
      <SettingRow title="Email" desc={me?.email ?? 'admin@example.com'}>
        <span />
      </SettingRow>
      <SettingRow title="Parol" desc={`Oxirgi o‘zgarish: ${fmtDate(sec.passwordChangedAt)}`}>
        <Button variant="secondary" onClick={() => setPwOpen(true)}>
          Parolni o‘zgartirish
        </Button>
      </SettingRow>
      <SettingRow title="Ikki bosqichli himoya" desc={sec.twoFactor ? 'Yoqilgan' : 'O‘chirilgan'} inline>
        <Toggle
          checked={sec.twoFactor}
          label="Ikki bosqichli himoya"
          onChange={(v) => {
            actions.updateSettings('security', { ...sec, twoFactor: v })
            toast(v ? 'Ikki bosqichli himoya yoqildi (demo)' : 'Ikki bosqichli himoya o‘chirildi', v ? 'success' : 'info')
          }}
        />
      </SettingRow>
      <SettingRow title="Faol sessiyalar" desc={`${sec.sessions.length} ta qurilma`}>
        <Button
          variant="secondary"
          disabled={sec.sessions.length <= 1}
          onClick={() => {
            actions.updateSettings('security', { ...sec, sessions: sec.sessions.filter((s) => s.current) })
            toast('Boshqa sessiyalar yakunlandi')
          }}
        >
          Boshqa sessiyalarni yakunlash
        </Button>
      </SettingRow>
      <ul className="list" style={{ marginBottom: 6 }}>
        {sec.sessions.map((s) => (
          <li key={s.id} className="list-row">
            <Icon name="globe" size={16} className="muted" />
            <span className="grow">
              {s.device} · {s.place} {s.current && <Badge tone="green">Joriy</Badge>}
            </span>
            {!s.current && (
              <button className="link-btn" onClick={() => (actions.updateSettings('security', { ...sec, sessions: sec.sessions.filter((x) => x.id !== s.id) }), toast('Sessiya yakunlandi'))}>
                Chiqarish
              </button>
            )}
          </li>
        ))}
      </ul>
      <SettingRow title="Audit jurnali" desc="Profil, status va ruxsat o‘zgarishlari">
        <Button variant="secondary" onClick={() => setAudit(true)}>
          Jurnalni ochish
        </Button>
      </SettingRow>

      <Modal
        open={pwOpen}
        onClose={() => setPwOpen(false)}
        title="Parolni o‘zgartirish"
        width={440}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPwOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={submitPw}>Saqlash</Button>
          </>
        }
      >
        <div className="form-stack">
          <Field label="Joriy parol" error={pwErr.current}>
            <Input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          </Field>
          <Field label="Yangi parol" error={pwErr.next}>
            <Input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          </Field>
          <Field label="Yangi parolni tasdiqlang" error={pwErr.confirm}>
            <Input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          </Field>
          <p className="small muted">Demo: parol hech qayerda saqlanmaydi.</p>
        </div>
      </Modal>
      <Modal open={audit} onClose={() => setAudit(false)} title="Audit jurnali">
        <ul className="list">
          {log.map((h) => (
            <li key={h.id} className="list-row">
              <div className="grow">
                <div className="strong">
                  {h.lead}: {h.title}
                </div>
                <div className="small muted">{h.detail}</div>
              </div>
              <span className="small muted nowrap">{fmtDateTime(h.at)}</span>
            </li>
          ))}
        </ul>
      </Modal>
    </Card>
  )
}
