import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Field, Input, Modal, Select, StateBlock, Textarea } from '../components/ui'
import { useToast } from '../components/toast'
import { useDemo } from '../store/store'
import { PRODUCTS, SOURCES } from '../store/seed'
import type { Lead, Sale, Source } from '../store/types'
import { addDays, dayKey, fmtDate, fmtDateTime, fmtDuration, fmtMoney, fromLocalInput, isValidEmail, isValidPhone, toLocalInput } from '../lib/format'
import type { ExportFormat, Table } from '../lib/export'
import { inRange, sellerStats } from '../store/metrics'
import { RESULT_META } from '../lib/meta'
import { DialogsContext, type DialogApi, type Dataset } from './Dialogs'

type DialogState =
  | { type: 'lead'; lead?: Lead; onSaved?: (id: string) => void }
  | { type: 'assign'; leadIds: string[]; onSaved?: () => void }
  | { type: 'followup'; leadId?: string; followupId?: string; date?: string; onSaved?: () => void }
  | { type: 'sale'; leadId: string; onSaved?: () => void }
  | { type: 'invite' }
  | { type: 'user'; userId: string }
  | { type: 'export'; dataset?: Dataset; leadIds?: string[]; sellerId?: string }
  | null

export function DialogsProvider({ children }: { children: ReactNode }) {
  const [dlg, setDlg] = useState<DialogState>(null)
  const close = useCallback(() => setDlg(null), [])
  const api = useMemo<DialogApi>(
    () => ({
      addLead: (onSaved) => setDlg({ type: 'lead', onSaved }),
      editLead: (lead) => setDlg({ type: 'lead', lead }),
      assign: (leadIds, onSaved) => setDlg({ type: 'assign', leadIds, onSaved }),
      followup: (opts) => setDlg({ type: 'followup', ...opts }),
      sale: (leadId, onSaved) => setDlg({ type: 'sale', leadId, onSaved }),
      invite: () => setDlg({ type: 'invite' }),
      editUser: (userId) => setDlg({ type: 'user', userId }),
      exportData: (opts) => setDlg({ type: 'export', ...opts }),
    }),
    [],
  )
  return (
    <DialogsContext.Provider value={api}>
      {children}
      {dlg?.type === 'lead' && <LeadDialog key={dlg.lead?.id ?? 'new'} lead={dlg.lead} onClose={close} onSaved={dlg.onSaved} />}
      {dlg?.type === 'assign' && <AssignDialog leadIds={dlg.leadIds} onClose={close} onSaved={dlg.onSaved} />}
      {dlg?.type === 'followup' && <FollowupDialog leadId={dlg.leadId} followupId={dlg.followupId} date={dlg.date} onClose={close} onSaved={dlg.onSaved} />}
      {dlg?.type === 'sale' && <SaleDialog leadId={dlg.leadId} onClose={close} onSaved={dlg.onSaved} />}
      {dlg?.type === 'invite' && <InviteDialog onClose={close} />}
      {dlg?.type === 'user' && <UserDialog userId={dlg.userId} onClose={close} />}
      {dlg?.type === 'export' && <ExportDialog dataset={dlg.dataset} leadIds={dlg.leadIds} sellerId={dlg.sellerId} onClose={close} />}
    </DialogsContext.Provider>
  )
}

function useSellerOptions(withNone = true) {
  const { state } = useDemo()
  const opts = state.sellers.filter((s) => s.role === 'seller' && s.status === 'active').map((s) => ({ value: s.id, label: s.name }))
  return withNone ? [{ value: '', label: 'Biriktirilmagan' }, ...opts] : opts
}

function useIsSeller() {
  const { state } = useDemo()
  return state.session?.role === 'seller' ? state.session.userId : null
}

/* ---------- Lead add / edit ---------- */
function LeadDialog({ lead, onClose, onSaved }: { lead?: Lead; onClose: () => void; onSaved?: (id: string) => void }) {
  const { state, actions } = useDemo()
  const toast = useToast()
  const sellerOpts = useSellerOptions()
  const me = useIsSeller()
  const [f, setF] = useState({
    name: lead?.name ?? '',
    phone: lead?.phone ?? '+998 ',
    email: lead?.email ?? '',
    source: (lead?.source ?? 'Instagram') as Source,
    product: lead?.product ?? PRODUCTS[0].name,
    sellerId: lead ? lead.sellerId ?? '' : me ?? state.sellers.find((s) => s.id === 's1')?.id ?? '',
    status: lead?.status ?? 'new',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (k: keyof typeof f, v: string) => {
    setF((x) => ({ ...x, [k]: v }))
    setErrors((e) => ({ ...e, [k]: '' }))
  }
  const save = () => {
    const e: Record<string, string> = {}
    if (f.name.trim().length < 2) e.name = 'Ism va familiyani kiriting'
    if (!isValidPhone(f.phone)) e.phone = 'Telefon raqami to‘liq emas'
    if (f.email && !isValidEmail(f.email)) e.email = 'Email noto‘g‘ri'
    const dup = state.leads.find((l) => l.phone.replace(/\D/g, '') === f.phone.replace(/\D/g, '') && l.id !== lead?.id)
    if (!e.phone && dup) e.phone = `Bu raqam ${dup.name} leadida mavjud`
    setErrors(e)
    if (Object.keys(e).length) return
    if (lead) {
      actions.updateLead(lead.id, { name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() || undefined, source: f.source, product: f.product, sellerId: f.sellerId || null, status: f.status })
      toast('Lead yangilandi')
      onSaved?.(lead.id)
    } else {
      const id = actions.addLead({ name: f.name, phone: f.phone, email: f.email, source: f.source, product: f.product, sellerId: f.sellerId || null })
      toast(`${f.name.trim()} leadi qo‘shildi`)
      onSaved?.(id)
    }
    onClose()
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={lead ? 'Leadni tahrirlash' : 'Lead qo‘shish'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button onClick={save}>Saqlash</Button>
        </>
      }
    >
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
        noValidate
      >
        <Field label="Ism va familiya" error={errors.name} className="span-2">
          <Input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Ali Valiyev" autoComplete="off" />
        </Field>
        <Field label="Telefon" error={errors.phone}>
          <Input value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+998 90 123 45 67" inputMode="tel" />
        </Field>
        <Field label="Email (ixtiyoriy)" error={errors.email}>
          <Input value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="mijoz@example.com" inputMode="email" />
        </Field>
        <Field label="Manba">
          <Select value={f.source} onChange={(e) => set('source', e.target.value)} options={SOURCES.map((s) => ({ value: s, label: s }))} />
        </Field>
        <Field label="Mahsulot">
          <Select value={f.product} onChange={(e) => set('product', e.target.value)} options={PRODUCTS.map((p) => ({ value: p.name, label: p.name }))} />
        </Field>
        <Field label="Sotuvchi" className={lead ? '' : 'span-2'}>
          <Select value={f.sellerId} onChange={(e) => set('sellerId', e.target.value)} options={sellerOpts} disabled={!!me} />
        </Field>
        {lead && (
          <Field label="Status">
            <Select value={f.status} onChange={(e) => set('status', e.target.value)} options={state.statuses.map((s) => ({ value: s.key, label: s.label }))} />
          </Field>
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}

/* ---------- Assign ---------- */
function AssignDialog({ leadIds, onClose, onSaved }: { leadIds: string[]; onClose: () => void; onSaved?: () => void }) {
  const { state, actions } = useDemo()
  const toast = useToast()
  const opts = useSellerOptions(false)
  const leads = state.leads.filter((l) => leadIds.includes(l.id))
  const [sellerId, setSellerId] = useState(leads.length === 1 && leads[0].sellerId ? leads[0].sellerId : opts[0]?.value ?? '')
  const [method, setMethod] = useState<'manual' | 'auto'>('manual')
  const [error, setError] = useState('')
  const save = () => {
    if (!leads.length) return setError('Lead tanlanmagan')
    if (method === 'manual' && !sellerId) return setError('Sotuvchini tanlang')
    actions.assignLeads(leadIds, method === 'auto' ? 'auto' : sellerId)
    toast(method === 'auto' ? `${leads.length} ta lead avtomatik taqsimlandi` : `${leads.length} ta lead ${state.sellers.find((s) => s.id === sellerId)?.name}ga biriktirildi`)
    onSaved?.()
    onClose()
  }
  return (
    <Modal
      open
      onClose={onClose}
      title="Sotuvchiga biriktirish"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button onClick={save}>Saqlash</Button>
        </>
      }
    >
      <div className="form-stack">
        <Field label="Tanlangan leadlar">
          <div className="input" style={{ display: 'flex', alignItems: 'center' }}>
            {leads.length === 1 ? leads[0].name : `${leads.length} ta lead`}
          </div>
        </Field>
        <Field label="Taqsimlash usuli">
          <Select
            value={method}
            onChange={(e) => setMethod(e.target.value as 'manual' | 'auto')}
            options={[
              { value: 'manual', label: 'Tanlangan sotuvchiga' },
              { value: 'auto', label: 'Avtomatik — eng kam yuklangan sotuvchiga' },
            ]}
          />
        </Field>
        <Field label="Sotuvchi" error={error}>
          <Select value={sellerId} disabled={method === 'auto'} onChange={(e) => (setSellerId(e.target.value), setError(''))} options={opts} />
        </Field>
      </div>
    </Modal>
  )
}

/* ---------- Follow-up ---------- */
function FollowupDialog({ leadId, followupId, date, onClose, onSaved }: { leadId?: string; followupId?: string; date?: string; onClose: () => void; onSaved?: () => void }) {
  const { state, actions } = useDemo()
  const toast = useToast()
  const navigate = useNavigate()
  const me = useIsSeller()
  const existing = state.followups.find((f) => f.id === followupId)
  const initialLead = existing?.leadId ?? leadId ?? ''
  const lead0 = state.leads.find((l) => l.id === initialLead)
  const [today] = useState(() => dayKey(new Date()))
  const dueDefault = existing ? toLocalInput(existing.due) : { date: date ?? today, time: '15:00' }
  const [f, setF] = useState({
    leadId: initialLead,
    date: dueDefault.date,
    time: dueDefault.time,
    sellerId: existing?.sellerId ?? me ?? lead0?.sellerId ?? 's1',
    note: existing?.note ?? '',
    reminder: String(existing?.reminder ?? state.settings.kpi.reminder),
    kind: existing?.kind ?? 'followup',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [done, setDone] = useState<string | null>(null)
  const sellerOpts = useSellerOptions(false)
  const leadOpts = state.leads
    .filter((l) => !me || l.sellerId === me)
    .filter((l) => !['won'].includes(l.status) || l.id === initialLead)
    .map((l) => ({ value: l.id, label: `${l.name} · ${l.phone}` }))
  const set = (k: keyof typeof f, v: string) => {
    setF((x) => {
      const n = { ...x, [k]: v }
      if (k === 'leadId' && !me) n.sellerId = state.leads.find((l) => l.id === v)?.sellerId ?? x.sellerId
      return n
    })
    setErrors((e) => ({ ...e, [k]: '' }))
  }
  const save = () => {
    const e: Record<string, string> = {}
    if (!f.leadId) e.leadId = 'Leadni tanlang'
    if (!f.date) e.date = 'Sanani tanlang'
    if (!f.time) e.time = 'Vaqtni tanlang'
    if (f.note.trim().length < 3) e.note = 'Qisqa izoh yozing'
    const due = f.date && f.time ? fromLocalInput(f.date, f.time) : ''
    if (!existing && due && new Date(due).getTime() < Date.now() - 60000) e.date = 'O‘tgan vaqtni tanlab bo‘lmaydi'
    setErrors(e)
    if (Object.keys(e).length) return
    if (existing) {
      actions.updateFollowup(existing.id, { due, note: f.note.trim(), reminder: Number(f.reminder), sellerId: f.sellerId, kind: f.kind as typeof existing.kind })
      toast('Follow-up yangilandi')
      onSaved?.()
      onClose()
    } else {
      actions.addFollowup({ leadId: f.leadId, sellerId: f.sellerId, due, note: f.note.trim(), reminder: Number(f.reminder), kind: f.kind as 'followup' })
      onSaved?.()
      setDone(f.leadId)
    }
  }
  if (done) {
    return (
      <Modal open onClose={onClose} title="Follow-up belgilash">
        <StateBlock
          kind="success"
          title="Muvaffaqiyatli saqlandi"
          text={`Leadga follow-up va mas’ul sotuvchi biriktirildi: ${fmtDate(fromLocalInput(f.date, f.time))} · ${f.time}.`}
          action={
            <div className="row wrap" style={{ justifyContent: 'center' }}>
              <Button variant="secondary" onClick={onClose}>
                Yopish
              </Button>
              <Button
                onClick={() => {
                  onClose()
                  navigate(me ? `/seller/leads/${done}` : `/admin/leads/${done}`)
                }}
              >
                Leadni ochish
              </Button>
            </div>
          }
        />
      </Modal>
    )
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={existing ? 'Follow-upni o‘zgartirish' : 'Follow-up belgilash'}
      footer={
        <>
          {existing && (
            <Button
              variant="secondary"
              className="text-red"
              icon="trash"
              onClick={() => {
                actions.deleteFollowup(existing.id)
                toast('Follow-up o‘chirildi', 'info')
                onSaved?.()
                onClose()
              }}
            >
              O‘chirish
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button onClick={save}>Saqlash</Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Lead" error={errors.leadId} className="span-2">
          <Select value={f.leadId} onChange={(e) => set('leadId', e.target.value)} options={[{ value: '', label: 'Leadni tanlang' }, ...leadOpts]} disabled={!!existing || !!leadId} />
        </Field>
        <Field label="Sana" error={errors.date}>
          <Input type="date" value={f.date} min={existing ? undefined : today} onChange={(e) => set('date', e.target.value)} />
        </Field>
        <Field label="Vaqt" error={errors.time}>
          <Input type="time" value={f.time} step={300} onChange={(e) => set('time', e.target.value)} />
        </Field>
        <Field label="Mas’ul sotuvchi">
          <Select value={f.sellerId} onChange={(e) => set('sellerId', e.target.value)} options={sellerOpts} disabled={!!me} />
        </Field>
        <Field label="Turi">
          <Select
            value={f.kind}
            onChange={(e) => set('kind', e.target.value)}
            options={[
              { value: 'followup', label: 'Follow-up' },
              { value: 'call', label: 'Qo‘ng‘iroq' },
              { value: 'offer', label: 'Taklif yuborish' },
              { value: 'task', label: 'Boshqa vazifa' },
            ]}
          />
        </Field>
        <Field label="Eslatma" className="span-2">
          <Select
            value={f.reminder}
            onChange={(e) => set('reminder', e.target.value)}
            options={[5, 10, 15, 30, 60].map((m) => ({ value: String(m), label: `${m} daqiqa oldin` }))}
          />
        </Field>
        <Field label="Izoh" error={errors.note} className="span-2">
          <Textarea value={f.note} onChange={(e) => set('note', e.target.value)} placeholder="Paket qiymatini tushuntirish" />
        </Field>
      </div>
    </Modal>
  )
}

/* ---------- Sale result ---------- */
function SaleDialog({ leadId, onClose, onSaved }: { leadId: string; onClose: () => void; onSaved?: () => void }) {
  const { state, actions } = useDemo()
  const toast = useToast()
  const lead = state.leads.find((l) => l.id === leadId)
  const [f, setF] = useState({
    product: lead?.product ?? PRODUCTS[0].name,
    amount: String(PRODUCTS.find((p) => p.name === lead?.product)?.price ?? PRODUCTS[0].price),
    payment: 'paid' as Sale['payment'],
    note: 'Mijoz taklifni qabul qildi',
  })
  const [error, setError] = useState('')
  if (!lead) return null
  const save = () => {
    const amount = Number(f.amount.replace(/[^\d]/g, ''))
    if (!amount || amount < 1000) return setError('Sotuv qiymatini kiriting')
    actions.addSale({ leadId, sellerId: lead.sellerId ?? state.session?.userId ?? 's1', product: f.product, amount, payment: f.payment, note: f.note.trim() })
    toast(`Sotuv saqlandi: ${fmtMoney(amount)}`)
    onSaved?.()
    onClose()
  }
  return (
    <Modal
      open
      onClose={onClose}
      title="Sotuvni yakunlash"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button onClick={save} variant="success">
            Sotuvni saqlash
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Mijoz" className="span-2">
          <div className="input" style={{ display: 'flex', alignItems: 'center' }}>
            {lead.name} · {lead.phone}
          </div>
        </Field>
        <Field label="Mahsulot">
          <Select
            value={f.product}
            onChange={(e) => setF({ ...f, product: e.target.value, amount: String(PRODUCTS.find((p) => p.name === e.target.value)?.price ?? f.amount) })}
            options={PRODUCTS.map((p) => ({ value: p.name, label: p.name }))}
          />
        </Field>
        <Field label="Sotuv qiymati (so‘m)" error={error}>
          <Input inputMode="numeric" value={Number(f.amount.replace(/\D/g, '') || 0).toLocaleString('en-US')} onChange={(e) => (setF({ ...f, amount: e.target.value }), setError(''))} />
        </Field>
        <Field label="To‘lov holati" className="span-2">
          <Select
            value={f.payment}
            onChange={(e) => setF({ ...f, payment: e.target.value as Sale['payment'] })}
            options={[
              { value: 'paid', label: 'To‘langan' },
              { value: 'partial', label: 'Qisman to‘langan' },
              { value: 'pending', label: 'To‘lov kutilmoqda' },
            ]}
          />
        </Field>
        <Field label="Izoh" className="span-2">
          <Textarea value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
        </Field>
      </div>
    </Modal>
  )
}

/* ---------- Invite seller ---------- */
function InviteDialog({ onClose }: { onClose: () => void }) {
  const { state, actions } = useDemo()
  const toast = useToast()
  const navigate = useNavigate()
  const [f, setF] = useState({ name: '', email: '', role: 'seller' as 'seller' | 'admin' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sent, setSent] = useState<string | null>(null)
  const save = () => {
    const e: Record<string, string> = {}
    if (f.name.trim().length < 3) e.name = 'Ism va familiyani kiriting'
    if (!isValidEmail(f.email)) e.email = 'Email noto‘g‘ri'
    else if (state.sellers.some((s) => s.email === f.email.trim().toLowerCase())) e.email = 'Bu email allaqachon jamoada'
    setErrors(e)
    if (Object.keys(e).length) return
    actions.inviteSeller(f)
    toast('Taklif yaratildi (demo: email yuborilmadi)')
    setSent(f.email.trim().toLowerCase())
  }
  if (sent) {
    const link = `/invite?email=${encodeURIComponent(sent)}&name=${encodeURIComponent(f.name.trim())}`
    return (
      <Modal open onClose={onClose} title="Sotuvchi taklif qilish">
        <StateBlock
          kind="success"
          title="Taklif tayyor"
          text="Demo rejimda email yuborilmaydi. Taklif oqimini quyidagi havola orqali sinab ko‘ring."
          action={
            <div className="row wrap" style={{ justifyContent: 'center' }}>
              <Button variant="secondary" onClick={onClose}>
                Yopish
              </Button>
              <Button
                icon="send"
                onClick={() => {
                  onClose()
                  navigate(link)
                }}
              >
                Taklif sahifasini ochish
              </Button>
            </div>
          }
        />
      </Modal>
    )
  }
  return (
    <Modal
      open
      onClose={onClose}
      title="Sotuvchi taklif qilish"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button onClick={save} icon="send">
            Taklif yuborish
          </Button>
        </>
      }
    >
      <div className="form-stack">
        <Field label="Ism va familiya" error={errors.name}>
          <Input value={f.name} onChange={(e) => (setF({ ...f, name: e.target.value }), setErrors({ ...errors, name: '' }))} placeholder="Aziz Ismoilov" />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input value={f.email} onChange={(e) => (setF({ ...f, email: e.target.value }), setErrors({ ...errors, email: '' }))} placeholder="aziz@example.com" inputMode="email" />
        </Field>
        <Field label="Rol">
          <Select
            value={f.role}
            onChange={(e) => setF({ ...f, role: e.target.value as 'seller' | 'admin' })}
            options={[
              { value: 'seller', label: 'Sotuvchi' },
              { value: 'admin', label: 'Administrator' },
            ]}
          />
        </Field>
      </div>
    </Modal>
  )
}

/* ---------- Edit user ---------- */
function UserDialog({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { state, actions } = useDemo()
  const toast = useToast()
  const u = state.sellers.find((s) => s.id === userId)
  const [f, setF] = useState({ name: u?.name ?? '', email: u?.email ?? '', phone: u?.phone ?? '', role: u?.role ?? 'seller', status: u?.status ?? 'active' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  if (!u) return null
  const isSelf = state.session?.userId === u.id
  const save = () => {
    const e: Record<string, string> = {}
    if (f.name.trim().length < 2) e.name = 'Ismni kiriting'
    if (!isValidEmail(f.email)) e.email = 'Email noto‘g‘ri'
    else if (state.sellers.some((s) => s.email === f.email.trim().toLowerCase() && s.id !== u.id)) e.email = 'Bu email band'
    setErrors(e)
    if (Object.keys(e).length) return
    actions.updateSeller(u.id, { name: f.name.trim(), email: f.email.trim().toLowerCase(), phone: f.phone.trim(), role: f.role as 'seller', status: f.status as 'active' })
    toast('Foydalanuvchi yangilandi')
    onClose()
  }
  return (
    <Modal
      open
      onClose={onClose}
      title="Foydalanuvchini tahrirlash"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button onClick={save}>Saqlash</Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Ism va familiya" error={errors.name} className="span-2">
          <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </Field>
        <Field label="Telefon">
          <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        </Field>
        <Field label="Rol">
          <Select
            value={f.role}
            disabled={isSelf}
            onChange={(e) => setF({ ...f, role: e.target.value as 'seller' })}
            options={[
              { value: 'seller', label: 'Sotuvchi' },
              { value: 'admin', label: 'Administrator' },
            ]}
          />
        </Field>
        <Field label="Holat">
          <Select
            value={f.status}
            disabled={isSelf || u.status === 'invited'}
            onChange={(e) => setF({ ...f, status: e.target.value as 'active' })}
            options={[
              { value: 'active', label: 'Faol' },
              { value: 'blocked', label: 'Bloklangan' },
              ...(u.status === 'invited' ? [{ value: 'invited', label: 'Taklif yuborilgan' }] : []),
            ]}
          />
        </Field>
      </div>
    </Modal>
  )
}

/* ---------- Export ---------- */
function ExportDialog({ dataset: ds0, leadIds, sellerId, onClose }: { dataset?: Dataset; leadIds?: string[]; sellerId?: string; onClose: () => void }) {
  const { state } = useDemo()
  const toast = useToast()
  const [f, setF] = useState(() => ({
    dataset: ds0 ?? 'sellers',
    from: leadIds ? dayKey(addDays(new Date(), -365)) : state.range.from,
    to: state.range.to,
    scope: leadIds ? 'filtered' : sellerId ?? 'all',
    format: 'xlsx' as ExportFormat,
  }))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const sellers = state.sellers.filter((s) => s.role === 'seller')
  const sellerName = (id: string | null) => state.sellers.find((s) => s.id === id)?.name ?? 'Biriktirilmagan'
  const leadName = (id: string) => state.leads.find((l) => l.id === id)?.name ?? id
  const statusLabel = (k: string) => state.statuses.find((s) => s.key === k)?.label ?? k

  const build = (): Table => {
    const range = { from: f.from, to: f.to }
    const bySeller = (id: string | null) => f.scope === 'all' || f.scope === 'filtered' || id === f.scope
    if (f.dataset === 'leads') {
      const rows = (f.scope === 'filtered' && leadIds ? state.leads.filter((l) => leadIds.includes(l.id)) : state.leads.filter((l) => inRange(l.createdAt, range) && bySeller(l.sellerId))).map((l) => [
        l.id,
        l.name,
        l.phone,
        l.source,
        state.campaigns.find((c) => c.id === l.campaignId)?.name ?? '—',
        l.product,
        sellerName(l.sellerId),
        statusLabel(l.status),
        l.score,
        fmtDate(l.createdAt),
      ])
      return { title: 'Leadlar', columns: ['ID', 'Mijoz', 'Telefon', 'Manba', 'Kampaniya', 'Mahsulot', 'Sotuvchi', 'Status', 'AI ball', 'Yaratilgan'], rows }
    }
    if (f.dataset === 'calls') {
      const rows = state.calls
        .filter((c) => inRange(c.startedAt, range) && bySeller(c.sellerId))
        .map((c) => [c.id, leadName(c.leadId), sellerName(c.sellerId), fmtDateTime(c.startedAt), fmtDuration(c.duration), RESULT_META[c.result]?.label ?? c.result, c.aiStatus === 'ready' ? 'Tayyor' : c.aiStatus === 'queued' ? 'Navbatda' : '—'])
      return { title: 'Qo‘ng‘iroqlar', columns: ['ID', 'Mijoz', 'Sotuvchi', 'Sana / vaqt', 'Davomiylik', 'Natija', 'AI holati'], rows }
    }
    if (f.dataset === 'sales') {
      const rows = state.sales
        .filter((x) => inRange(x.at, range) && bySeller(x.sellerId))
        .map((x) => [fmtDate(x.at), leadName(x.leadId), sellerName(x.sellerId), x.product, x.amount, x.payment === 'paid' ? 'To‘langan' : x.payment === 'partial' ? 'Qisman' : 'Kutilmoqda'])
      return { title: 'Sotuvlar', columns: ['Sana', 'Mijoz', 'Sotuvchi', 'Mahsulot', 'Summa (so‘m)', 'To‘lov'], rows }
    }
    const rows = sellers
      .filter((s) => bySeller(s.id))
      .map((s) => {
        const st = sellerStats(state, s.id, range)
        return [s.name, st.leads, st.calls, st.sales, `${st.conversion.toFixed(1)}%`, st.revenue]
      })
    return { title: 'Sotuvchilar hisoboti', columns: ['Sotuvchi', 'Leadlar', 'Qo‘ng‘iroq', 'Sotuvlar', 'Konversiya', 'Daromad (so‘m)'], rows }
  }

  const table = build()
  const run = async () => {
    if (f.from > f.to) return setError('Boshlanish sanasi tugash sanasidan keyin bo‘lmasin')
    if (!table.rows.length) return setError('Tanlangan davr va qamrovda ma’lumot yo‘q')
    setBusy(true)
    try {
      const { exportTable } = await import('../lib/export')
      const name = exportTable(table, f.format, table.title.toLowerCase().replace(/[^a-z0-9]+/gi, '-'), `${fmtDate(f.from)} – ${fmtDate(f.to)} · ${table.rows.length} qator`)
      toast(`${name} yuklab olindi`)
      onClose()
    } catch {
      setBusy(false)
      setError('Eksport modulini yuklab bo‘lmadi. Sahifani yangilab qayta urinib ko‘ring.')
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title="Hisobotni eksport qilish"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button icon="download" onClick={run} disabled={busy}>
            {busy ? 'Tayyorlanmoqda…' : 'Yuklab olish'}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Ma’lumot" className="span-2">
          <Select
            value={f.dataset}
            onChange={(e) => (setF({ ...f, dataset: e.target.value as Dataset, scope: e.target.value === 'leads' && leadIds ? 'filtered' : f.scope === 'filtered' ? 'all' : f.scope }), setError(''))}
            options={[
              { value: 'sellers', label: 'Sotuvchilar hisoboti' },
              { value: 'leads', label: 'Leadlar' },
              { value: 'calls', label: 'Qo‘ng‘iroqlar' },
              { value: 'sales', label: 'Sotuvlar' },
            ]}
          />
        </Field>
        {f.scope !== 'filtered' && (
          <>
            <Field label="Davr boshi">
              <Input type="date" value={f.from} onChange={(e) => (setF({ ...f, from: e.target.value }), setError(''))} />
            </Field>
            <Field label="Davr oxiri">
              <Input type="date" value={f.to} onChange={(e) => (setF({ ...f, to: e.target.value }), setError(''))} />
            </Field>
          </>
        )}
        <Field label="Qamrov" className="span-2">
          <Select
            value={f.scope}
            onChange={(e) => (setF({ ...f, scope: e.target.value }), setError(''))}
            options={[
              ...(leadIds && f.dataset === 'leads' ? [{ value: 'filtered', label: `Joriy filtr natijasi (${leadIds.length} ta)` }] : []),
              { value: 'all', label: 'Barcha sotuvchilar' },
              ...sellers.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
        </Field>
        <div className="field span-2">
          <span className="field-label">Format</span>
          <div className="segmented" style={{ alignSelf: 'flex-start' }}>
            {(['xlsx', 'csv', 'pdf'] as ExportFormat[]).map((x) => (
              <button key={x} type="button" className={f.format === x ? 'active' : ''} aria-pressed={f.format === x} onClick={() => setF({ ...f, format: x })}>
                {x.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <p className={`span-2 small ${error ? 'text-red' : 'muted'}`}>{error || `${table.rows.length} qator tayyorlanadi · fayl brauzerda lokal yaratiladi`}</p>
      </div>
    </Modal>
  )
}
