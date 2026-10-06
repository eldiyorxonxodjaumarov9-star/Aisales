import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Button, ResultBadge, Segmented, StateBlock } from '../../components/ui'
import { SellerPage } from '../../layouts/SellerLayout'
import { useDemo } from '../../store/store'
import { useMe } from './useMe'
import { useNow } from '../../lib/useNow'
import { addDays, fmtDuration, fmtRelativeDay, fmtTime, isSameDay, startOfDay } from '../../lib/format'

type Period = 'today' | '7d' | 'all'

export default function CallHistory() {
  const { state } = useDemo()
  const me = useMe()
  const navigate = useNavigate()
  const [period, setPeriod] = useState<Period>('today')
  const [shown, setShown] = useState(20)
  const now = new Date(useNow())
  const mine = state.calls.filter((c) => c.sellerId === me.id)
  const list = mine.filter((c) => (period === 'today' ? isSameDay(c.startedAt, now) : period === '7d' ? new Date(c.startedAt) >= startOfDay(addDays(now, -6)) : true))
  const total = list.reduce((s, c) => s + c.duration, 0)
  const h = Math.floor(total / 3600)
  const m = Math.round((total % 3600) / 60)

  return (
    <SellerPage title="Qo‘ng‘iroqlar" sub={`${period === 'today' ? 'Bugun' : period === '7d' ? '7 kun' : 'Jami'} ${list.length} ta · ${h ? `${h} soat ` : ''}${m} daqiqa`}>
      <Segmented
        value={period}
        onChange={(v) => (setPeriod(v), setShown(20))}
        options={[
          { value: 'today', label: 'Bugun' },
          { value: '7d', label: '7 kun' },
          { value: 'all', label: 'Barchasi' },
        ]}
      />
      {list.length === 0 && (
        <div className="m-card">
          <StateBlock kind="empty" title="Qo‘ng‘iroq yo‘q" text="Bu davrda qo‘ng‘iroq qilinmagan." action={<Button variant="soft" onClick={() => navigate('/seller/leads')}>Leadlarga o‘tish</Button>} />
        </div>
      )}
      {list.slice(0, shown).map((c) => {
        const lead = state.leads.find((l) => l.id === c.leadId)
        return (
          <div key={c.id} className="lead-card" style={{ alignItems: 'flex-start' }}>
            <Avatar name={lead?.name ?? '?'} size={40} />
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="row-between" style={{ gap: 8 }}>
                <b className="ellipsis">{lead?.name}</b>
                <ResultBadge result={c.result} />
              </div>
              <span>
                {period === 'today' ? fmtTime(c.startedAt) : `${fmtRelativeDay(c.startedAt)}, ${fmtTime(c.startedAt)}`} · {fmtDuration(c.duration)}
              </span>
              {c.aiStatus === 'ready' ? (
                <button className="link-btn" onClick={() => navigate(`/seller/coach/${c.id}`)}>
                  AI tahlili →
                </button>
              ) : c.aiStatus === 'queued' ? (
                <span className="small text-purple">AI tahlili navbatda…</span>
              ) : (
                <span className="small muted">AI tahlili yo‘q</span>
              )}
            </div>
          </div>
        )
      })}
      {list.length > shown && (
        <Button variant="secondary" block onClick={() => setShown((s) => s + 20)}>
          Yana ko‘rsatish ({list.length - shown})
        </Button>
      )}
    </SellerPage>
  )
}
