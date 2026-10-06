import { useNavigate, useParams } from 'react-router-dom'
import { Button, Progress, ResultBadge, StateBlock } from '../../components/ui'
import { SellerPage } from '../../layouts/SellerLayout'
import { useDemo } from '../../store/store'
import { toneOf } from '../../lib/meta'
import { fmtDuration } from '../../lib/format'

export default function AiCoach() {
  const { callId } = useParams()
  const { state } = useDemo()
  const navigate = useNavigate()
  const call = state.calls.find((c) => c.id === callId)
  if (!call)
    return (
      <SellerPage title="AI Coach" back="/seller/calls">
        <div className="m-card">
          <StateBlock kind="error" title="Qo‘ng‘iroq topilmadi" text="Yozuv mavjud emas." action={<Button onClick={() => navigate('/seller/calls')}>Qo‘ng‘iroqlar</Button>} />
        </div>
      </SellerPage>
    )
  const lead = state.leads.find((l) => l.id === call.leadId)
  const a = call.analysis
  const head = `${lead?.name ?? ''} · ${fmtDuration(call.duration)} · ${a ? 'AI tahlili tayyor' : call.aiStatus === 'queued' ? 'tahlil navbatda' : 'tahlil yo‘q'}`

  const footer = (
    <div className="stack-sm">
      <Button block variant="secondary" onClick={() => navigate(`/seller/leads/${call.leadId}`)}>
        Leadni ochish
      </Button>
      <Button block variant="ghost" onClick={() => navigate('/seller/calls')}>
        Qo‘ng‘iroqlar tarixi
      </Button>
    </div>
  )

  if (!a)
    return (
      <SellerPage title="AI Coach" sub={head} back="/seller/calls">
        <div className="m-card">
          {call.aiStatus === 'queued' ? (
            <StateBlock kind="queue" title="AI tahlili navbatda" text="Audio qabul qilindi. Tahlil bir necha soniyada tayyor bo‘ladi — sahifa avtomatik yangilanadi." action={<span className="spinner" />} />
          ) : (
            <StateBlock kind="empty" title="AI tahlili o‘tkazilmadi" text={`Qo‘ng‘iroq ${state.settings.ai.minDuration} soniyadan qisqa yoki mijoz javob bermagan.`} />
          )}
        </div>
        {footer}
      </SellerPage>
    )

  const metrics = [
    { label: 'Ehtiyojni aniqlash', v: a.needs },
    { label: 'E’tiroz bilan ishlash', v: a.objection },
    { label: 'Yopish', v: a.closing },
    { label: 'Umumiy sifat', v: a.quality },
  ]
  return (
    <SellerPage title="AI Coach" sub={head} back="/seller/calls">
      <div className="m-card">
        <div className="row-between">
          <b>Qisqa xulosa</b>
          <ResultBadge result={call.result} />
        </div>
        <p style={{ marginTop: 8, fontSize: 13.5, lineHeight: 1.55 }}>{call.reviewedSummary || a.summary}</p>
        <div className="small muted" style={{ marginTop: 8 }}>Qiziqish {a.interest}% · Niyat: {a.intent} · AI taxmini</div>
      </div>
      <div className="m-card stack">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="row-between small" style={{ marginBottom: 6 }}>
              <span>{m.label}</span>
              <b className={`text-${toneOf(m.v)}`}>{m.v}%</b>
            </div>
            <Progress value={m.v} tone={toneOf(m.v)} />
          </div>
        ))}
      </div>
      <h2 className="m-title" style={{ fontSize: 16 }}>Keyingi suhbatda</h2>
      {a.tips.map((t, i) => (
        <div key={i} className="tip" style={{ background: '#fff' }}>
          <b>
            {String(i + 1).padStart(2, '0')} · {t.title}
          </b>
          <p>{t.text}</p>
        </div>
      ))}
      <Button block size="lg" icon="play" onClick={() => navigate(`/seller/transcript/${call.id}`)}>
        Audio va transkriptni ochish
      </Button>
      {footer}
    </SellerPage>
  )
}
