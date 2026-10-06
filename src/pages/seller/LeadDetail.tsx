import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Avatar, Badge, Button, StateBlock, StatusBadge, Textarea } from '../../components/ui'
import { tempOf } from '../../lib/meta'
import { useToast } from '../../components/toast'
import { SellerPage } from '../../layouts/SellerLayout'
import { useDemo } from '../../store/store'
import { useDialogs } from '../../dialogs/Dialogs'
import { useMe } from './useMe'
import { useNow } from '../../lib/useNow'
import { fmtDate, fmtRelativeDay, fmtTime, isSameDay } from '../../lib/format'

export default function SellerLeadDetail() {
  const { id } = useParams()
  const { state, actions } = useDemo()
  const me = useMe()
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const toast = useToast()
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  const now = useNow()
  const lead = state.leads.find((l) => l.id === id)
  if (!lead || lead.sellerId !== me.id)
    return (
      <SellerPage title="Lead tafsiloti" back="/seller/leads">
        <div className="m-card">
          <StateBlock kind={lead ? 'denied' : 'error'} title={lead ? 'Ruxsat cheklangan' : 'Lead topilmadi'} text={lead ? 'Bu lead boshqa sotuvchiga biriktirilgan.' : 'Lead mavjud emas.'} action={<Button onClick={() => navigate('/seller/leads')}>Leadlarim</Button>} />
        </div>
      </SellerPage>
    )
  const t = tempOf(lead.score)
  const next = state.followups.filter((f) => f.leadId === lead.id && !f.done).sort((a, b) => a.due.localeCompare(b.due))[0]
  const history = [...lead.history].reverse().slice(0, 6)
  const lastCall = state.calls.find((c) => c.leadId === lead.id)

  return (
    <SellerPage title="Lead tafsiloti" back>
      <div className="m-card">
        <div className="row" style={{ gap: 14 }}>
          <Avatar name={lead.name} size={52} />
          <div className="grow">
            <div style={{ fontSize: 18, fontWeight: 700 }}>{lead.name}</div>
            <div className="row" style={{ gap: 6, marginTop: 4 }}>
              <Badge tone={t.tone}>{t.label} lead</Badge>
              <StatusBadge status={lead.status} />
            </div>
          </div>
        </div>
        <div className="stack-sm" style={{ margin: '16px 0' }}>
          <a href={`tel:${lead.phone.replace(/\s/g, '')}`} onClick={(e) => e.preventDefault()} className="strong" style={{ color: 'var(--text)' }}>
            {lead.phone}
          </a>
          <span className="muted">
            {lead.source} · {lead.product}
          </span>
          <span className="muted">AI ball: {lead.score} / 100 · taxmin</span>
        </div>
        <Button block size="lg" icon="phone" onClick={() => navigate(`/seller/call/${lead.id}`)}>
          Qo‘ng‘iroq qilish
        </Button>
        {lead.status !== 'won' && (
          <Button block variant="secondary" style={{ marginTop: 8 }} icon="check" onClick={() => dialogs.sale(lead.id)}>
            Sotuvni yakunlash
          </Button>
        )}
      </div>

      <div className="m-card">
        <h3 className="m-title" style={{ fontSize: 16 }}>Keyingi harakat</h3>
        {next ? (
          <>
            <p style={{ marginTop: 8 }}>
              <b className={new Date(next.due).getTime() < now ? 'text-red' : 'text-blue'}>
                {isSameDay(next.due, new Date(now)) ? 'Bugun' : fmtDate(next.due)} {fmtTime(next.due)}
              </b>{' '}
              · Follow-up
            </p>
            <p className="muted">{next.note}</p>
            <div className="row" style={{ marginTop: 10 }}>
              <Button size="sm" variant="soft" onClick={() => navigate(`/seller/followups/${next.id}`)}>
                Vaqtni o‘zgartirish
              </Button>
              <Button size="sm" variant="secondary" icon="check" onClick={() => (actions.toggleFollowupDone(next.id), toast('Follow-up bajarildi'))}>
                Bajarildi
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="muted" style={{ margin: '8px 0 10px' }}>Rejalashtirilgan harakat yo‘q.</p>
            <Button size="sm" variant="soft" icon="plus" onClick={() => navigate(`/seller/followups/new?lead=${lead.id}`)}>
              Follow-up qo‘yish
            </Button>
          </>
        )}
      </div>

      {lastCall && lastCall.aiStatus !== 'none' && (
        <button className="alert-card" onClick={() => navigate(`/seller/coach/${lastCall.id}`)}>
          <b>
            <Icon name="sparkle" size={16} /> AI Coach
          </b>
          <span className="small muted">{lastCall.aiStatus === 'queued' ? 'Oxirgi qo‘ng‘iroq tahlili navbatda…' : 'Oxirgi qo‘ng‘iroq bo‘yicha tavsiyalar →'}</span>
        </button>
      )}

      <div className="m-card">
        <h3 className="m-title" style={{ fontSize: 16, marginBottom: 8 }}>Aloqa tarixi</h3>
        <ul className="timeline">
          {history.map((h) => (
            <li key={h.id}>
              <span className="tl-dot" />
              <span className="tl-time">{fmtRelativeDay(h.at).startsWith('Bugun') ? fmtTime(h.at) : fmtDate(h.at).slice(0, 5)}</span>
              <div>
                <b>{h.title}</b>
                <span>{h.detail}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="m-card">
        <h3 className="m-title" style={{ fontSize: 16, marginBottom: 8 }}>Izoh</h3>
        <div className="stack">
          {lead.notes.map((n) => (
            <div key={n.id} className="note">
              {n.text}
              <small>
                {n.author} · {fmtRelativeDay(n.at)}
              </small>
            </div>
          ))}
          <Textarea rows={2} placeholder="Izoh yozing..." value={note} onChange={(e) => (setNote(e.target.value), setErr(''))} aria-label="Yangi izoh" />
          {err && <span className="field-error">{err}</span>}
          <Button
            variant="secondary"
            onClick={() => {
              if (note.trim().length < 2) return setErr('Izoh matnini yozing')
              actions.addNote(lead.id, note)
              setNote('')
              toast('Izoh qo‘shildi')
            }}
          >
            Izohni saqlash
          </Button>
        </div>
      </div>
    </SellerPage>
  )
}
