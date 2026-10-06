import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Avatar, Button, Field, Input, Select, StateBlock, Textarea } from '../../components/ui'
import { useToast } from '../../components/toast'
import { SellerPage } from '../../layouts/SellerLayout'
import { useDemo } from '../../store/store'
import { useMe } from './useMe'
import { useNow } from '../../lib/useNow'
import { addDays, dayKey } from '../../lib/format'

const pad = (n: number) => String(n).padStart(2, '0')

export default function FollowupForm() {
  const { fid } = useParams()
  const [params] = useSearchParams()
  const { state, actions } = useDemo()
  const me = useMe()
  const navigate = useNavigate()
  const toast = useToast()
  const existing = fid ? state.followups.find((f) => f.id === fid) : undefined
  const leadId = existing?.leadId ?? params.get('lead') ?? ''
  const callId = params.get('call')
  const lead = state.leads.find((l) => l.id === leadId)
  const myLeads = state.leads.filter((l) => l.sellerId === me.id && !['won', 'lost'].includes(l.status))

  const now = useNow()
  const [init] = useState(() => {
    if (existing) return new Date(existing.due)
    const d = addDays(new Date(), 1)
    d.setHours(11, 0, 0, 0)
    return d
  })
  const [pick, setPick] = useState(leadId)
  const [date, setDate] = useState(dayKey(init))
  const [time, setTime] = useState(`${pad(init.getHours())}:${pad(init.getMinutes())}`)
  const [reminder, setReminder] = useState(String(existing?.reminder ?? state.settings.kpi.reminder))
  const [note, setNote] = useState(existing?.note ?? (lead ? 'Narx va to‘lov variantlarini yuborish' : ''))
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (fid && !existing)
    return (
      <SellerPage title="Follow-up" back="/seller/followups">
        <div className="m-card">
          <StateBlock kind="error" title="Follow-up topilmadi" text="U o‘chirilgan bo‘lishi mumkin." action={<Button onClick={() => navigate('/seller/followups')}>Rejaga qaytish</Button>} />
        </div>
      </SellerPage>
    )

  const after = () => navigate(callId ? `/seller/coach/${callId}` : '/seller/followups', { replace: true })

  const save = () => {
    const e: Record<string, string> = {}
    const due = new Date(`${date}T${time}`)
    if (!pick) e.lead = 'Leadni tanlang'
    if (!date || !time || Number.isNaN(due.getTime())) e.date = 'Sana va vaqtni kiriting'
    else if (due.getTime() < Date.now() - 60_000) e.date = 'O‘tgan vaqtni tanlab bo‘lmaydi'
    if (note.trim().length < 3) e.note = 'Qisqa izoh yozing'
    setErrors(e)
    if (Object.keys(e).length) return
    if (existing) {
      actions.updateFollowup(existing.id, { due: due.toISOString(), note: note.trim(), reminder: Number(reminder) })
      toast('Follow-up yangilandi')
    } else {
      actions.addFollowup({ leadId: pick, sellerId: me.id, due: due.toISOString(), note: note.trim(), reminder: Number(reminder), kind: 'followup' })
      toast('Follow-up saqlandi')
    }
    after()
  }

  const shown = state.leads.find((l) => l.id === pick)

  return (
    <SellerPage title={existing ? 'Follow-upni ko‘chirish' : 'Follow-up qo‘yish'} back>
      {shown && leadId ? (
        <div className="row" style={{ gap: 12 }}>
          <Avatar name={shown.name} size={44} />
          <div>
            <b style={{ fontSize: 16 }}>{shown.name}</b>
            <div className="small muted">
              {shown.product} · {shown.source}
            </div>
          </div>
        </div>
      ) : (
        <Field label="Lead" error={errors.lead}>
          <Select value={pick} onChange={(e) => setPick(e.target.value)} options={[{ value: '', label: 'Leadni tanlang' }, ...myLeads.map((l) => ({ value: l.id, label: l.name }))]} />
        </Field>
      )}
      <div className="m-card form-stack">
        <Field label="Sana" error={errors.date}>
          <Input type="date" value={date} min={dayKey(new Date(now))} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Vaqt">
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
        <Field label="Eslatma">
          <Select
            value={reminder}
            onChange={(e) => setReminder(e.target.value)}
            options={[
              { value: '5', label: '5 daqiqa oldin' },
              { value: '15', label: '15 daqiqa oldin' },
              { value: '30', label: '30 daqiqa oldin' },
              { value: '60', label: '1 soat oldin' },
            ]}
          />
        </Field>
        <Field label="Izoh" error={errors.note}>
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nima qilish kerak?" />
        </Field>
      </div>
      <Button block size="lg" onClick={save}>
        {existing ? 'O‘zgarishni saqlash' : 'Follow-upni saqlash'}
      </Button>
      {existing && (
        <div className="row" style={{ gap: 8 }}>
          <Button
            variant="secondary"
            style={{ flex: 1 }}
            onClick={() => {
              actions.toggleFollowupDone(existing.id)
              toast(existing.done ? 'Qayta ochildi' : 'Bajarildi deb belgilandi')
              navigate('/seller/followups', { replace: true })
            }}
          >
            {existing.done ? 'Qayta ochish' : 'Bajarildi'}
          </Button>
          <Button
            variant="danger"
            style={{ flex: 1 }}
            onClick={() => {
              actions.deleteFollowup(existing.id)
              toast('Follow-up o‘chirildi')
              navigate('/seller/followups', { replace: true })
            }}
          >
            O‘chirish
          </Button>
        </div>
      )}
      {callId && !existing && (
        <Button block variant="ghost" onClick={after}>
          Hozircha o‘tkazib yuborish
        </Button>
      )}
    </SellerPage>
  )
}
