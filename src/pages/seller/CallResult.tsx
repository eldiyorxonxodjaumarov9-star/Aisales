import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Avatar, Button, Field, StateBlock, Textarea } from '../../components/ui'
import { useToast } from '../../components/toast'
import { SellerPage } from '../../layouts/SellerLayout'
import { useDemo } from '../../store/store'
import { useDialogs } from '../../dialogs/Dialogs'
import { fmtDuration, fmtTime } from '../../lib/format'
import type { CallResult as Result } from '../../store/types'

const OPTIONS: { key: Result; label: string }[] = [
  { key: 'won', label: 'Sotib oldi' },
  { key: 'interested', label: 'Qiziqdi' },
  { key: 'thinking', label: 'O‘ylab ko‘radi' },
  { key: 'followup', label: 'Qayta qo‘ng‘iroq' },
  { key: 'lost', label: 'Qiziqmadi' },
  { key: 'noanswer', label: 'Javob bermadi' },
]

export default function CallResult() {
  const { callId } = useParams()
  const { state, actions } = useDemo()
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const toast = useToast()
  const call = state.calls.find((c) => c.id === callId)
  const [choice, setChoice] = useState<Result | ''>(call && call.duration === 0 ? 'noanswer' : '')
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  if (!call)
    return (
      <SellerPage title="Qo‘ng‘iroq natijasi" back="/seller">
        <div className="m-card">
          <StateBlock kind="error" title="Qo‘ng‘iroq topilmadi" text="Yozuv mavjud emas." action={<Button onClick={() => navigate('/seller')}>Bosh sahifa</Button>} />
        </div>
      </SellerPage>
    )
  const lead = state.leads.find((l) => l.id === call.leadId)
  const willAnalyse = state.settings.ai.autoRun && call.duration >= state.settings.ai.minDuration && choice !== 'noanswer'

  const save = () => {
    if (!choice) return setErr('Natijani tanlang')
    const persist = () => {
      actions.saveCallResult(call.id, choice, note)
      toast('Natija saqlandi')
    }
    if (choice === 'won') {
      dialogs.sale(call.leadId, () => {
        persist()
        navigate(`/seller/coach/${call.id}`, { replace: true })
      })
      return
    }
    persist()
    if (choice === 'followup' || choice === 'thinking') navigate(`/seller/followups/new?lead=${call.leadId}&call=${call.id}`, { replace: true })
    else navigate(`/seller/coach/${call.id}`, { replace: true })
  }

  return (
    <SellerPage title="Qo‘ng‘iroq natijasi" back={`/seller/leads/${call.leadId}`}>
      <div className="row" style={{ gap: 12 }}>
        <Avatar name={lead?.name ?? '?'} size={44} />
        <div>
          <b style={{ fontSize: 16 }}>{lead?.name}</b>
          <div className="small muted">
            {fmtDuration(call.duration)} · {fmtTime(call.startedAt)}
          </div>
        </div>
      </div>
      <div className="stack-sm" role="radiogroup" aria-label="Qo‘ng‘iroq natijasi">
        {OPTIONS.map((o) => (
          <button key={o.key} role="radio" aria-checked={choice === o.key} className={`result-option ${choice === o.key ? 'active' : ''}`} onClick={() => (setChoice(o.key), setErr(''))}>
            <span className="radio" />
            {o.label}
          </button>
        ))}
        {err && <span className="field-error">{err}</span>}
      </div>
      <Field label="Izoh (ixtiyoriy)">
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Mijoz nima dedi?" />
      </Field>
      <div className="alert-card" style={{ display: 'flex', gap: 10 }}>
        <Icon name="sparkle" size={18} />
        <span className="small">
          {willAnalyse ? 'AI tahlili saqlangach avtomatik boshlanadi (demo ma’lumot)' : `AI tahlili o‘tkazilmaydi: qo‘ng‘iroq ${state.settings.ai.minDuration} soniyadan qisqa yoki javob yo‘q`}
        </span>
      </div>
      <Button block size="lg" onClick={save}>
        Natijani saqlash
      </Button>
    </SellerPage>
  )
}
