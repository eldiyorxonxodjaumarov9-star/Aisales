import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Badge, Progress } from '../../components/ui'
import { SellerPage } from '../../layouts/SellerLayout'
import { useDemo } from '../../store/store'
import { LeadCard } from './common'
import { useMe } from './useMe'
import { isSameDay } from '../../lib/format'
import { useNow } from '../../lib/useNow'

export default function SellerHome() {
  const { state } = useDemo()
  const me = useMe()
  const navigate = useNavigate()
  const today = new Date(useNow())
  const target = state.settings.kpi.dailySales
  const salesToday = state.sales.filter((s) => s.sellerId === me.id && isSameDay(s.at, today)).length
  const pct = Math.round((salesToday / target) * 100)
  const myLeads = state.leads.filter((l) => l.sellerId === me.id)
  const newCount = myLeads.filter((l) => l.status === 'new').length
  const fuToday = state.followups.filter((f) => f.sellerId === me.id && !f.done && isSameDay(f.due, today)).length
  const callsToday = state.calls.filter((c) => c.sellerId === me.id && isSameDay(c.startedAt, today)).length
  const overdue = state.followups.filter((f) => f.sellerId === me.id && !f.done && new Date(f.due) < today).length
  const active = myLeads.filter((l) => !['won', 'lost'].includes(l.status)).sort((a, b) => b.score - a.score).slice(0, 3)

  return (
    <SellerPage
      title={`Salom, ${me.name.split(' ')[0]}!`}
      sub={`Bugungi maqsad: ${target} ta sotuv`}
      action={
        <button className="icon-btn" aria-label={`Follow-up reja, ${overdue} ta kechikkan`} onClick={() => navigate('/seller/followups')}>
          <Icon name="bell" size={22} />
          {overdue > 0 && <span className="dot-badge">{overdue}</span>}
        </button>
      }
    >
      <button className="m-card" style={{ textAlign: 'left', width: '100%' }} onClick={() => navigate('/seller/stats')}>
        <div className="row-between">
          <div>
            <div className="goal-big">
              {salesToday} / {target}
            </div>
            <div className="muted" style={{ marginTop: 4 }}>Sotuv rejasi</div>
          </div>
          <Badge tone={pct >= 50 ? 'green' : 'amber'}>{pct}%</Badge>
        </div>
        <div style={{ margin: '18px 0 10px' }}>
          <Progress value={pct} height={8} />
        </div>
        <span className="small muted">{salesToday >= target ? 'Reja bajarildi · ajoyib!' : `${target - salesToday} ta sotuv qoldi · olg‘a!`}</span>
      </button>
      <div className="m-kpis">
        <button className="m-kpi" onClick={() => navigate('/seller/leads?status=new')}>
          <span>Yangi lead</span>
          <b>{newCount}</b>
        </button>
        <button className="m-kpi" onClick={() => navigate('/seller/followups')}>
          <span>Follow-up</span>
          <b>{fuToday}</b>
        </button>
        <button className="m-kpi" onClick={() => navigate('/seller/calls')}>
          <span>Qo‘ng‘iroq</span>
          <b>{callsToday}</b>
        </button>
      </div>
      <div className="row-between" style={{ marginTop: 6 }}>
        <h2 className="m-title">Mening leadlarim</h2>
        <button className="link-btn" onClick={() => navigate('/seller/leads')}>
          Barchasi →
        </button>
      </div>
      {active.length === 0 && <p className="muted">Faol lead yo‘q.</p>}
      {active.map((l) => (
        <LeadCard key={l.id} lead={l} />
      ))}
      <button className={`alert-card ${overdue ? 'warn' : ''}`} onClick={() => navigate('/seller/followups')}>
        <b>{overdue ? `${overdue} ta follow-up kechikkan` : 'Kechikkan follow-up yo‘q'}</b>
        <span className="link-btn" style={{ marginTop: 8 }}>
          Rejani ko‘rish →
        </span>
      </button>
    </SellerPage>
  )
}
