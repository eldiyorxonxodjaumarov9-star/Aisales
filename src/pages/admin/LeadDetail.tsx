import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Avatar, Badge, Button, Card, Field, Modal, PageHeader, ResultBadge, Select, StateBlock, Textarea } from '../../components/ui'
import { useToast } from '../../components/toast'
import { useDemo } from '../../store/store'
import { useDialogs } from '../../dialogs/Dialogs'
import { StatusPicker } from './Leads'
import type { CallResult, Lead } from '../../store/types'
import { fmtDate, fmtDuration, fmtRelativeDay, fmtTime } from '../../lib/format'
import { RESULT_META, tempOf } from '../../lib/meta'
import { useNow } from '../../lib/useNow'

export default function LeadDetail() {
  const { id } = useParams()
  const { state, actions } = useDemo()
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const toast = useToast()
  const [note, setNote] = useState('')
  const [noteErr, setNoteErr] = useState('')
  const [allHistory, setAllHistory] = useState(false)
  const [calling, setCalling] = useState(false)
  const now = useNow()
  const lead = state.leads.find((l) => l.id === id)
  if (!lead)
    return (
      <Card>
        <StateBlock kind="error" title="Lead topilmadi" text="Lead o‘chirilgan yoki demo ma’lumotlar tiklangan bo‘lishi mumkin." action={<Button onClick={() => navigate('/admin/leads')}>Leadlar ro‘yxatiga</Button>} />
      </Card>
    )
  const seller = state.sellers.find((s) => s.id === lead.sellerId)
  const calls = state.calls.filter((c) => c.leadId === lead.id)
  const fus = state.followups.filter((f) => f.leadId === lead.id).sort((a, b) => a.due.localeCompare(b.due))
  const next = fus.find((f) => !f.done)
  const campaign = state.campaigns.find((c) => c.id === lead.campaignId)
  const history = [...lead.history].reverse()
  const temp = tempOf(lead.score)
  const sale = state.sales.find((s) => s.leadId === lead.id)

  return (
    <>
      <PageHeader
        back={
          <button className="back-link" onClick={() => navigate(-1)}>
            <Icon name="chevronLeft" size={14} /> Orqaga
          </button>
        }
        title="Lead tafsiloti"
        subtitle="Lead tarixi, AI bahosi va keyingi harakat"
        actions={
          <>
            <Button variant="secondary" icon="user" onClick={() => dialogs.assign([lead.id])}>
              Biriktirish
            </Button>
            {lead.status !== 'won' && (
              <Button variant="secondary" icon="check" onClick={() => dialogs.sale(lead.id)}>
                Sotuvni yakunlash
              </Button>
            )}
            <Button variant="secondary" icon="edit" onClick={() => dialogs.editLead(lead)}>
              Tahrirlash
            </Button>
          </>
        }
      />
      <div className="detail-grid">
        <Card>
          <div className="strong" style={{ fontSize: 15 }}>{lead.name}</div>
          <div className="small muted">
            Lead #{lead.id} · {fmtDate(lead.createdAt)}
          </div>
          <div className="row" style={{ marginTop: 18, gap: 14 }}>
            <Avatar name={lead.name} size={48} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{lead.name}</div>
              <Badge tone={temp.tone}>{temp.label} lead</Badge>
            </div>
          </div>
          <dl className="info-list">
            <div>
              <dt>Telefon</dt>
              <dd>{lead.phone}</dd>
            </div>
            {lead.email && (
              <div>
                <dt>Email</dt>
                <dd>{lead.email}</dd>
              </div>
            )}
            <div>
              <dt>Manba</dt>
              <dd>
                {lead.source}
                {campaign ? ` · ${campaign.name}` : ''}
              </dd>
            </div>
            <div>
              <dt>Mahsulot</dt>
              <dd>{lead.product}</dd>
            </div>
            <div>
              <dt>Sotuvchi</dt>
              <dd className="row-between">
                {seller ? <Link to={`/admin/sellers/${seller.id}`}>{seller.name}</Link> : <span className="muted">Biriktirilmagan</span>}
                <button className="link-btn" onClick={() => dialogs.assign([lead.id])}>
                  O‘zgartirish
                </button>
              </dd>
            </div>
            <div>
              <dt>AI lead score</dt>
              <dd>{lead.score} / 100 · AI taxmini</dd>
            </div>
            <div>
              <dt>Oxirgi aloqa</dt>
              <dd>{lead.lastContactAt ? fmtRelativeDay(lead.lastContactAt) : '—'}</dd>
            </div>
            <div>
              <dt>Qo‘ng‘iroqlar soni</dt>
              <dd>{calls.length} ta</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusPicker lead={lead} />
              </dd>
            </div>
            {sale && (
              <div>
                <dt>Sotuv</dt>
                <dd className="text-green strong">
                  {sale.product} · {sale.amount.toLocaleString('en-US')} so‘m
                </dd>
              </div>
            )}
          </dl>
          <Button block icon="phone" onClick={() => setCalling(true)}>
            Qo‘ng‘iroq qilish
          </Button>
        </Card>

        <div className="stack" style={{ gap: 14 }}>
          <Card
            title="Keyingi harakat"
            action={
              <Button variant="soft" size="sm" icon="plus" onClick={() => dialogs.followup({ leadId: lead.id })}>
                Follow-up qo‘yish
              </Button>
            }
          >
            {next ? (
              <div className="row-between wrap">
                <div className="stack-sm">
                  <Badge tone={new Date(next.due).getTime() < now ? 'red' : 'blue'}>
                    {next.kind === 'call' ? 'Qo‘ng‘iroq' : next.kind === 'offer' ? 'Taklif' : 'Follow-up'} · {fmtRelativeDay(next.due).toLowerCase()}
                  </Badge>
                  <span className="muted">{next.note}</span>
                </div>
                <div className="row">
                  <Button size="sm" variant="secondary" onClick={() => dialogs.followup({ followupId: next.id })}>
                    Ko‘chirish
                  </Button>
                  <Button
                    size="sm"
                    variant="success"
                    icon="check"
                    onClick={() => {
                      actions.toggleFollowupDone(next.id)
                      toast('Follow-up bajarildi')
                    }}
                  >
                    Bajarildi
                  </Button>
                </div>
              </div>
            ) : (
              <p className="muted">Rejalashtirilgan harakat yo‘q. Follow-up qo‘yib, keyingi qadamni belgilang.</p>
            )}
            {fus.filter((f) => f !== next).length > 0 && (
              <ul className="list" style={{ marginTop: 10 }}>
                {fus
                  .filter((f) => f !== next)
                  .slice(-3)
                  .map((f) => (
                    <li key={f.id} className="list-row small">
                      <Icon name={f.done ? 'check' : 'clock'} size={14} className={f.done ? 'text-green' : 'muted'} />
                      <span className="grow">
                        {fmtRelativeDay(f.due)} · {f.note}
                      </span>
                      <button className="link-btn" onClick={() => actions.toggleFollowupDone(f.id)}>
                        {f.done ? 'Qayta ochish' : 'Bajarildi'}
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </Card>

          <div className="grid cols-2">
            <Card title="Faoliyat tarixi" action={history.length > 6 && <button className="link-btn" onClick={() => setAllHistory((x) => !x)}>{allHistory ? 'Kamroq' : `Barchasi (${history.length})`}</button>}>
              <ul className="timeline">
                {(allHistory ? history : history.slice(0, 6)).map((h) => (
                  <li key={h.id}>
                    <span className="tl-dot" />
                    <span className="tl-time">{fmtRelativeDay(h.at).includes('Bugun') ? fmtTime(h.at) : fmtDate(h.at).slice(0, 5)}</span>
                    <div>
                      <b>{h.title}</b>
                      <span>{h.detail}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="Qo‘ng‘iroqlar" subtitle={`${calls.length} ta qo‘ng‘iroq`}>
              {calls.length === 0 && <p className="muted">Hali qo‘ng‘iroq qilinmagan.</p>}
              <ul className="list">
                {calls.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <button className="list-row btn-row" onClick={() => c.aiStatus === 'ready' && navigate(`/admin/calls/${c.id}`)} disabled={c.aiStatus !== 'ready'} style={{ cursor: c.aiStatus === 'ready' ? 'pointer' : 'default' }}>
                      <Icon name="phone" size={16} className="muted" />
                      <div className="grow">
                        <div className="strong">{fmtRelativeDay(c.startedAt)}</div>
                        <div className="small muted">
                          {fmtDuration(c.duration)} · {c.aiStatus === 'ready' ? 'AI tahlil tayyor →' : c.aiStatus === 'queued' ? 'AI navbatda…' : 'AI tahlil yo‘q'}
                        </div>
                      </div>
                      <ResultBadge result={c.result} />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card title="Izohlar">
            <div className="stack">
              {lead.notes.length === 0 && <p className="muted">Hali izoh yo‘q.</p>}
              {lead.notes.map((n) => (
                <div key={n.id} className="note">
                  {n.text}
                  <small>
                    {n.author} · {fmtRelativeDay(n.at)}
                  </small>
                </div>
              ))}
              <form
                className="row"
                style={{ alignItems: 'flex-start' }}
                onSubmit={(e) => {
                  e.preventDefault()
                  if (note.trim().length < 2) return setNoteErr('Izoh matnini yozing')
                  actions.addNote(lead.id, note)
                  setNote('')
                  toast('Izoh qo‘shildi')
                }}
              >
                <Field label="Yangi izoh" error={noteErr} className="grow">
                  <Textarea rows={2} style={{ minHeight: 44 }} placeholder="Izoh yozing..." value={note} onChange={(e) => (setNote(e.target.value), setNoteErr(''))} />
                </Field>
                <Button type="submit" style={{ marginTop: 22 }}>
                  Qo‘shish
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
      {calling && <DemoCallModal lead={lead} onClose={() => setCalling(false)} />}
    </>
  )
}

function DemoCallModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { state, actions } = useDemo()
  const toast = useToast()
  const [sec, setSec] = useState(0)
  const [running, setRunning] = useState(true)
  const [result, setResult] = useState<CallResult>('interested')
  const [note, setNote] = useState('')
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setSec((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [running])
  const sellerId = lead.sellerId ?? state.sellers.find((s) => s.role === 'seller' && s.status === 'active')?.id ?? 's1'
  const save = () => {
    const callId = actions.createCall(lead.id, sellerId, Math.max(sec, 1))
    actions.saveCallResult(callId, result, note)
    toast(sec >= state.settings.ai.minDuration && result !== 'noanswer' ? 'Qo‘ng‘iroq saqlandi · AI tahlili navbatda' : 'Qo‘ng‘iroq saqlandi')
    onClose()
  }
  return (
    <Modal
      open
      onClose={onClose}
      title="Demo qo‘ng‘iroq"
      width={460}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button onClick={save} variant={running ? 'danger' : 'primary'} icon={running ? 'phoneOff' : 'check'}>
            {running ? 'Yakunlash va saqlash' : 'Saqlash'}
          </Button>
        </>
      }
    >
      <div className="stack">
        <div className="soft-box row-between">
          <div className="row">
            <Avatar name={lead.name} size={40} />
            <div>
              <div className="strong">{lead.name}</div>
              <div className="small muted">{lead.phone}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtDuration(sec)}</div>
            <button className="link-btn" onClick={() => setRunning((r) => !r)}>
              {running ? 'Pauza' : 'Davom etish'}
            </button>
          </div>
        </div>
        <p className="small muted">Simulyatsiya: haqiqiy qo‘ng‘iroq, mikrofon yoki audio yozuv ishlatilmaydi.</p>
        <Field label="Natija">
          <Select value={result} onChange={(e) => setResult(e.target.value as CallResult)} options={Object.entries(RESULT_META).map(([value, m]) => ({ value, label: m.label }))} />
        </Field>
        <Field label="Izoh (ixtiyoriy)">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}
