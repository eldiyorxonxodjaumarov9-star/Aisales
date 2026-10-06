import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Button, StateBlock } from '../../components/ui'
import { useToast } from '../../components/toast'
import { SellerPage } from '../../layouts/SellerLayout'
import { useDemo } from '../../store/store'
import { useMe } from './useMe'
import { useNow } from '../../lib/useNow'
import { fmtDate, fmtRelativeDay, fmtTime, isSameDay, startOfDay, addDays } from '../../lib/format'

type Tab = 'today' | 'overdue' | 'upcoming' | 'done'

export default function FollowupList() {
  const { state, actions } = useDemo()
  const me = useMe()
  const navigate = useNavigate()
  const toast = useToast()
  const now = new Date(useNow())
  const mine = state.followups.filter((f) => f.sellerId === me.id)
  const groups: Record<Tab, typeof mine> = {
    today: mine.filter((f) => !f.done && isSameDay(f.due, now) && new Date(f.due) >= now),
    overdue: mine.filter((f) => !f.done && new Date(f.due) < now),
    upcoming: mine.filter((f) => !f.done && new Date(f.due) >= startOfDay(addDays(now, 1))),
    done: mine.filter((f) => f.done),
  }
  const [tab, setTab] = useState<Tab>(groups.today.length || !groups.overdue.length ? 'today' : 'overdue')
  const list = [...groups[tab]].sort((a, b) => (tab === 'done' ? b.due.localeCompare(a.due) : a.due.localeCompare(b.due)))
  const tabs: { key: Tab; label: string }[] = [
    { key: 'today', label: 'Bugun' },
    { key: 'overdue', label: 'Kechikkan' },
    { key: 'upcoming', label: 'Kelgusi' },
    { key: 'done', label: 'Bajarilgan' },
  ]

  return (
    <SellerPage
      title="Follow-up reja"
      sub={`${fmtDate(now)} · ${groups.today.length} ta bugun, ${groups.overdue.length} ta kechikkan`}
      back="/seller"
      action={
        <button className="icon-btn" aria-label="Follow-up qo‘shish" onClick={() => navigate('/seller/followups/new')}>
          <Icon name="plus" size={22} />
        </button>
      }
    >
      <div className="chips" role="tablist">
        {tabs.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={`chip ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label} <b>{groups[t.key].length}</b>
          </button>
        ))}
      </div>
      {list.length === 0 && (
        <div className="m-card">
          <StateBlock kind={tab === 'overdue' ? 'success' : 'empty'} title={tab === 'overdue' ? 'Kechikkan ish yo‘q' : 'Ro‘yxat bo‘sh'} text={tab === 'today' ? 'Bugunga rejalashtirilgan follow-up yo‘q.' : 'Bu bo‘limda yozuv yo‘q.'} action={tab !== 'done' && <Button variant="soft" icon="plus" onClick={() => navigate('/seller/followups/new')}>Follow-up qo‘shish</Button>} />
        </div>
      )}
      {list.map((f) => {
        const lead = state.leads.find((l) => l.id === f.leadId)
        const over = !f.done && new Date(f.due) < now
        return (
          <div key={f.id} className={`fu-card ${over ? 'overdue' : ''} ${f.done ? 'done' : ''}`}>
            <div className="row-between">
              <b className={over ? 'text-red' : 'text-blue'}>{tab === 'today' ? fmtTime(f.due) : `${fmtRelativeDay(f.due)}, ${fmtTime(f.due)}`}</b>
              <label className="row small" style={{ gap: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  className="check"
                  checked={f.done}
                  onChange={() => {
                    actions.toggleFollowupDone(f.id)
                    toast(f.done ? 'Qayta ochildi' : 'Bajarildi')
                  }}
                />
                Bajarildi
              </label>
            </div>
            <button style={{ border: 0, background: 'none', padding: 0, textAlign: 'left' }} onClick={() => lead && navigate(`/seller/leads/${lead.id}`)}>
              <b style={{ fontSize: 15 }}>{lead?.name}</b>
              <div className="small muted" style={{ marginTop: 2 }}>{f.note}</div>
            </button>
            {!f.done && (
              <div className="row" style={{ gap: 8 }}>
                <Button size="sm" icon="phone" style={{ flex: 1 }} onClick={() => navigate(`/seller/call/${f.leadId}`)}>
                  Qo‘ng‘iroq
                </Button>
                <Button size="sm" variant="secondary" icon="clock" style={{ flex: 1 }} onClick={() => navigate(`/seller/followups/${f.id}`)}>
                  Ko‘chirish
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </SellerPage>
  )
}
