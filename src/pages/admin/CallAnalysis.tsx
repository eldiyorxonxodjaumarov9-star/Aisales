import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { AudioPlayer } from '../../components/AudioPlayer'
import { Badge, Button, Card, Field, Modal, PageHeader, Progress, ResultBadge, StateBlock, Textarea } from '../../components/ui'
import { useToast } from '../../components/toast'
import { useDemo } from '../../store/store'
import { useDialogs } from '../../dialogs/Dialogs'
import type { Analysis, Call } from '../../store/types'
import { fmtDate, fmtDuration, fmtTime } from '../../lib/format'
import { toneOf } from '../../lib/meta'

export function Transcript({ a, time, onSeek, sellerName }: { a: Analysis; time: number; onSeek: (t: number) => void; sellerName: string }) {
  const activeIdx = a.transcript.reduce((acc, l, i) => (l.t <= time + 0.3 ? i : acc), -1)
  return (
    <div className="transcript">
      {a.transcript.map((l, i) => (
        <button key={i} className={`tline ${i === activeIdx && time > 0 ? 'active' : ''}`} onClick={() => onSeek(l.t)}>
          <div className={`tline-who ${l.speaker === 'client' ? 'client' : ''}`}>
            {l.speaker === 'seller' ? sellerName : 'Mijoz'} · {fmtDuration(l.t)}
          </div>
          <div className="tline-text">{l.text}</div>
        </button>
      ))}
    </div>
  )
}

export default function CallAnalysis() {
  const { id } = useParams()
  const { state } = useDemo()
  const navigate = useNavigate()
  const call = state.calls.find((c) => c.id === id)
  if (!call)
    return (
      <Card>
        <StateBlock kind="error" title="Qo‘ng‘iroq topilmadi" text="Ushbu yozuv mavjud emas." action={<Button onClick={() => navigate('/admin/calls')}>Qo‘ng‘iroqlarga qaytish</Button>} />
      </Card>
    )
  return <CallAnalysisView call={call} />
}

function CallAnalysisView({ call }: { call: Call }) {
  const { state, actions } = useDemo()
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const toast = useToast()
  const [time, setTime] = useState(0)
  const [seek, setSeek] = useState<{ t: number; key: number }>()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const lead = state.leads.find((l) => l.id === call.leadId)
  const seller = state.sellers.find((s) => s.id === call.sellerId)
  const a = call.analysis
  const jump = (t: number) => setSeek({ t, key: Date.now() })
  const sName = seller?.name.split(' ')[0] ?? 'Sotuvchi'

  return (
    <>
      <PageHeader
        back={
          <button className="back-link" onClick={() => navigate(-1)}>
            <Icon name="chevronLeft" size={14} /> Orqaga
          </button>
        }
        title="Qo‘ng‘iroq tahlili"
        subtitle={`${lead?.name} · ${seller?.name} · ${fmtDate(call.startedAt)}, ${fmtTime(call.startedAt)} · ${fmtDuration(call.duration)}`}
        actions={
          <>
            <ResultBadge result={call.result} />
            <Button variant="secondary" onClick={() => navigate(`/admin/leads/${call.leadId}`)}>
              Leadni ochish
            </Button>
            <Button icon="calendar" onClick={() => dialogs.followup({ leadId: call.leadId })}>
              Follow-up qo‘yish
            </Button>
          </>
        }
      />
      {!a ? (
        <Card>
          {call.aiStatus === 'queued' ? (
            <StateBlock kind="queue" title="AI tahlili navbatda" text="Audio qabul qilindi. Tahlil holati avtomatik yangilanadi." action={<span className="spinner" />} />
          ) : (
            <StateBlock kind="empty" title="AI tahlili mavjud emas" text={`Qo‘ng‘iroq juda qisqa (${state.settings.ai.minDuration} soniyadan kam) yoki mijoz javob bermagan.`} />
          )}
        </Card>
      ) : (
        <div className="grid cols-2" style={{ alignItems: 'start' }}>
          <Card title="Audio va transkript">
            <AudioPlayer id={call.id} duration={call.duration} onTime={setTime} seek={seek} />
            <div className="row wrap" style={{ margin: '14px 0 8px' }}>
              <Badge tone="blue">O‘zbekcha</Badge>
              <span className="small muted">2 suhbatdosh · 96% aniqlik · namunaviy audio</span>
            </div>
            <Transcript a={a} time={time} onSeek={jump} sellerName={sName} />
          </Card>
          <div className="stack" style={{ gap: 14 }}>
            <Card title="AI Call Analysis" subtitle="AI taxminlari · suhbatdan olingan dalillar bilan">
              <div className="metric-tiles">
                <div className="metric-tile">
                  <span>Qiziqish</span>
                  <b className={`text-${toneOf(a.interest)}`}>{a.interest}%</b>
                </div>
                <div className="metric-tile">
                  <span>Ikkilanish</span>
                  <b className="text-amber">{a.hesitation}%</b>
                </div>
                <div className="metric-tile">
                  <span>Xarid niyati</span>
                  <b className={a.intent === 'Yuqori' ? 'text-green' : a.intent === 'Past' ? 'text-red' : 'text-amber'}>{a.intent}</b>
                </div>
                <div className="metric-tile">
                  <span>Narx e’tirozi</span>
                  <b className={a.priceObjection ? 'text-red' : 'text-green'}>{a.priceObjection ? 'Mavjud' : 'Yo‘q'}</b>
                </div>
              </div>
              <h4 style={{ margin: '18px 0 12px', fontSize: 14 }}>Sotuvchining o‘lchanadigan signallari</h4>
              <Signal label="Muloqot sifati" value={a.quality} note={`Sotuvchi / mijoz gapirish nisbati: ${a.talkRatio[0]}% / ${a.talkRatio[1]}%`} />
              <Signal
                label="Ehtiyojni aniqlash"
                value={a.needs}
                note={
                  <>
                    {a.openQuestions.length} ta ochiq savol ·{' '}
                    {a.openQuestions.map((t, i) => (
                      <span key={t}>
                        <button className="evidence" onClick={() => jump(t)}>
                          {fmtDuration(t)}
                        </button>
                        {i < a.openQuestions.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </>
                }
              />
              <Signal
                label="E’tiroz bilan ishlash"
                value={a.objection}
                note={
                  a.objectionAt !== null ? (
                    <>
                      E’tiroz:{' '}
                      <button className="evidence" onClick={() => jump(a.objectionAt!)}>
                        {fmtDuration(a.objectionAt)}
                      </button>
                    </>
                  ) : (
                    'E’tiroz qayd etilmadi'
                  )
                }
              />
              <Signal label="Sotuvni yopish" value={a.closing} note={a.closingFound ? 'Aniq closing savoli berilgan' : 'Aniq closing savoli topilmadi · tekshirish kerak'} />
            </Card>
            <div className="soft-box">
              <div className="row-between">
                <h4 style={{ fontSize: 14 }}>AI xulosa va keyingi qadam</h4>
                {call.reviewedSummary && <Badge tone="green">Admin tekshirgan</Badge>}
              </div>
              <p style={{ margin: '8px 0 12px' }}>{call.reviewedSummary || a.summary}</p>
              <button
                className="link-btn"
                onClick={() => {
                  setDraft(call.reviewedSummary || a.summary)
                  setEditing(true)
                }}
              >
                AI xulosasini tekshirish / tuzatish →
              </button>
            </div>
          </div>
        </div>
      )}
      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="AI xulosasini tekshirish"
        footer={
          <>
            {call.reviewedSummary && (
              <Button
                variant="secondary"
                onClick={() => {
                  actions.reviewSummary(call.id, '')
                  setEditing(false)
                  toast('Asl AI xulosasi tiklandi', 'info')
                }}
              >
                Asl holatga qaytarish
              </Button>
            )}
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Bekor qilish
            </Button>
            <Button
              onClick={() => {
                if (draft.trim().length < 10) return
                actions.reviewSummary(call.id, draft)
                setEditing(false)
                toast('Xulosa tasdiqlandi')
              }}
              disabled={draft.trim().length < 10}
            >
              Tasdiqlash
            </Button>
          </>
        }
      >
        <Field label="Xulosa matni" error={draft.trim().length < 10 ? 'Kamida 10 ta belgi' : undefined} hint="AI bahosi taxmin. Tuzatish faqat shu lokal demo yozuvga saqlanadi.">
          <Textarea rows={5} value={draft} onChange={(e) => setDraft(e.target.value)} />
        </Field>
      </Modal>
    </>
  )
}

function Signal({ label, value, note }: { label: string; value: number; note: ReactNode }) {
  const tone = toneOf(value)
  return (
    <div className="signal">
      <div className="signal-head">
        <span>{label}</span>
        <b className={`text-${tone}`}>{value}%</b>
      </div>
      <Progress value={value} tone={tone} />
      <small>{note}</small>
    </div>
  )
}
