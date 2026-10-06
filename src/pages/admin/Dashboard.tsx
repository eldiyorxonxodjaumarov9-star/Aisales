import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Badge, Button, Card, KpiCard, PageHeader, Pagination, ResultBadge } from '../../components/ui'
import { Donut, Funnel, LineChart } from '../../components/charts'
import { useDemo } from '../../store/store'
import { useDialogs } from '../../dialogs/Dialogs'
import { aiInsights, campaignStats, dailySeries, delta, funnel, inRange, kpis, previousRange, sellerStats, sourceBreakdown, statusBreakdown } from '../../store/metrics'
import { MONTHS, fmtNum, fmtPct, fmtTime, isSameDay } from '../../lib/format'
import { useNow } from '../../lib/useNow'

const FUNNEL_STATUS = ['', 'contacted', 'interested', 'offer', 'won']

export default function Dashboard() {
  const { state, actions } = useDemo()
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const [adsPage, setAdsPage] = useState(1)
  const now = useNow()
  const range = state.range
  const k = kpis(state, range)
  const p = kpis(state, previousRange(range))
  const series = dailySeries(state, range)
  const steps = funnel(state, range)
  const leadsInRange = state.leads.filter((l) => inRange(l.createdAt, range))
  const insights = aiInsights(state, range)
  const sellers = state.sellers
    .filter((s) => s.role === 'seller' && s.status === 'active')
    .map((s) => ({ s, st: sellerStats(state, s.id, range) }))
    .sort((a, b) => b.st.sales - a.st.sales || b.st.revenue - a.st.revenue || b.st.conversion - a.st.conversion)
    .slice(0, 4)
  const recentCalls = state.calls.filter((c) => c.result !== 'noanswer').slice(0, 4)
  const campaigns = campaignStats(state, range).sort((a, b) => b.leads - a.leads)
  const today = new Date(now)
  const plan = state.followups.filter((f) => isSameDay(f.due, today)).sort((a, b) => a.due.localeCompare(b.due))
  const me = state.sellers.find((s) => s.id === state.session?.userId)
  const sellerName = (id: string | null) => state.sellers.find((s) => s.id === id)?.name.split(' ')[0] ?? '—'
  const leadOf = (id: string) => state.leads.find((l) => l.id === id)

  return (
    <>
      <PageHeader
        title={`Salom, ${me?.name.split(' ')[0] ?? 'Admin'}!`}
        subtitle={
          <>
            <span className="hide-mobile">Bugun, {today.getDate()}-{MONTHS[today.getMonth()].toLowerCase()} {today.getFullYear()} · sotuv jarayonining umumiy ko‘rinishi</span>
            <span className="show-mobile">Mobil nazorat · bugungi natijalar</span>
          </>
        }
        actions={
          <>
            <Button variant="secondary" icon="download" onClick={() => dialogs.exportData({ dataset: 'sellers' })}>
              Eksport
            </Button>
            <Button icon="plus" onClick={() => dialogs.addLead((id) => navigate(`/admin/leads/${id}`))}>
              Lead qo‘shish
            </Button>
          </>
        }
      />

      <div className="kpi-grid">
        <KpiCard label="Jami leadlar" value={fmtNum(k.leads)} delta={delta(k.leads, p.leads)} spark={series.leads} onClick={() => navigate('/admin/leads')} />
        <KpiCard label="Qo‘ng‘iroqlar" value={fmtNum(k.calls)} delta={delta(k.calls, p.calls)} spark={series.calls} onClick={() => navigate('/admin/calls')} />
        <KpiCard label="Sotuvlar" value={fmtNum(k.sales)} delta={delta(k.sales, p.sales)} spark={series.sales} onClick={() => navigate('/admin/reports')} />
        <KpiCard label="Konversiya" value={fmtPct(k.conversion)} delta={k.conversion - p.conversion} spark={series.sales.map((s, i) => (series.leads[i] ? s / series.leads[i] : 0))} onClick={() => navigate('/admin/reports')} />
        <div className="hide-mobile" style={{ display: 'contents' }}>
          <KpiCard label="Yo‘qotilgan" value={fmtNum(k.lost)} delta={delta(k.lost, p.lost)} invert spark={series.leads.map((v, i) => Math.max(0, v - series.sales[i] * 3))} onClick={() => navigate('/admin/leads?status=lost')} />
          <KpiCard label="Follow-up kerak" value={fmtNum(k.followups)} delta={delta(k.followups, p.followups)} invert spark={series.calls.map((v) => v % 5)} onClick={() => navigate('/admin/calendar')} />
        </div>
      </div>

      <div className="dash-row-1">
        <Card title="Sotuv voronkasi" subtitle="Bosqichlar va jami leadga nisbatan konversiya" className="dash-funnel">
          <Funnel steps={steps} onSelect={(i) => navigate(FUNNEL_STATUS[i] ? `/admin/leads?status=${FUNNEL_STATUS[i]}` : '/admin/leads')} />
        </Card>
        <Card title="Sotuvlar dinamikasi" subtitle="Tanlangan davr · natijalar taqqoslanishi" className="dash-chart">
          <LineChart
            days={series.days}
            height={200}
            series={[
              { label: 'Leadlar', color: '#245CFF', data: series.leads },
              { label: 'Qo‘ng‘iroqlar', color: '#885CF6', data: series.calls },
              { label: 'Sotuvlar', color: '#13AC80', data: series.sales },
            ]}
          />
        </Card>
        <Card title="AI bugungi xulosasi" className="dash-ai">
          <ul className="bullets">
            {insights.map((i) => (
              <li key={i.text}>
                <i className={i.tone === 'red' ? 'bg-red' : i.tone === 'green' ? 'bg-green' : 'bg-amber'} />
                {i.text}
              </li>
            ))}
          </ul>
          <Button variant="soft" block style={{ marginTop: 16 }} onClick={() => navigate('/admin/ai')}>
            Batafsil AI tahlil →
          </Button>
        </Card>
      </div>

      <div className="dash-row-2">
        <Card title="Eng yaxshi sotuvchilar" action={<Link className="link-btn" to="/admin/sellers">Barchasi →</Link>}>
          <ul className="list">
            {sellers.map(({ s, st }) => (
              <li key={s.id}>
                <button className="list-row btn-row" onClick={() => navigate(`/admin/sellers/${s.id}`)}>
                  <Avatar name={s.name} size={32} />
                  <div className="grow">
                    <div className="strong ellipsis">{s.name}</div>
                    <div className="small muted">
                      {st.leads} lead · {st.sales} sotuv
                    </div>
                  </div>
                  <Badge className="rank-pill" tone={st.conversion >= 30 ? 'green' : st.conversion >= 18 ? 'green' : 'red'}>
                    {fmtPct(st.conversion)}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Lead manbalari">
          <Donut items={sourceBreakdown(leadsInRange)} center={fmtNum(leadsInRange.length)} sub="Leadlar" size={130} onSelect={(src) => navigate(`/admin/leads?source=${encodeURIComponent(src)}`)} />
        </Card>
        <Card title="Lead statuslari">
          <Donut
            items={statusBreakdown(state, leadsInRange)}
            center={fmtNum(leadsInRange.length)}
            sub="Leadlar"
            size={130}
            onSelect={(label) => navigate(`/admin/leads?status=${state.statuses.find((s) => s.label === label)?.key ?? ''}`)}
          />
        </Card>
        <Card title="So‘nggi qo‘ng‘iroqlar" action={<Link className="link-btn" to="/admin/calls">Barchasi →</Link>}>
          <ul className="list">
            {recentCalls.map((c) => {
              const lead = leadOf(c.leadId)
              return (
                <li key={c.id}>
                  <button className="list-row btn-row" onClick={() => navigate(c.aiStatus === 'ready' ? `/admin/calls/${c.id}` : `/admin/leads/${c.leadId}`)}>
                    <Avatar name={lead?.name ?? '?'} size={32} />
                    <div className="grow">
                      <div className="strong ellipsis">{lead?.name.split(' ')[0]}</div>
                      <div className="small muted">{sellerName(c.sellerId)}</div>
                    </div>
                    <ResultBadge result={c.result} />
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      <div className="dash-row-3">
        <Card title="Reklamalar samaradorligi" pad={false} action={<Link className="link-btn" to="/admin/ads">Barchasini ko‘rish →</Link>}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Reklama</th>
                  <th>Leadlar</th>
                  <th>Sotuvlar</th>
                  <th>Konversiya</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.slice((adsPage - 1) * 2, adsPage * 2).map((c) => (
                  <tr key={c.id} className="row-link" onClick={() => navigate(`/admin/leads?campaign=${c.id}`)}>
                    <td className="strong">{c.name}</td>
                    <td>{c.leads}</td>
                    <td>{c.sales}</td>
                    <td>
                      <Badge tone={c.conversion >= 10 ? 'green' : 'red'}>{fmtPct(c.conversion)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={adsPage} total={campaigns.length} perPage={2} onChange={setAdsPage} label={`${campaigns.length} ta kampaniya · lokal demo`} />
        </Card>
        <Card
          title="Bugungi reja / follow-up"
          action={
            <Button size="sm" variant="soft" icon="plus" onClick={() => dialogs.followup()}>
              Qo‘shish
            </Button>
          }
        >
          {plan.length === 0 && <p className="muted">Bugun uchun follow-up yo‘q.</p>}
          <div className="plan-list">
            {plan.slice(0, 5).map((f) => {
              const lead = leadOf(f.leadId)
              const overdue = !f.done && new Date(f.due).getTime() < now
              return (
                <div key={f.id} className={`plan-item ${f.done ? 'done' : ''}`}>
                  <span className={`plan-time ${overdue ? 'overdue' : ''}`}>{fmtTime(f.due)}</span>
                  <button className="grow ellipsis link-plain" style={{ border: 0, background: 'none', textAlign: 'left', padding: 0 }} onClick={() => navigate(`/admin/leads/${f.leadId}`)}>
                    {lead?.name} · {f.note.toLowerCase()}
                  </button>
                  <label className="check" title="Bajarildi">
                    <input type="checkbox" checked={f.done} onChange={() => actions.toggleFollowupDone(f.id)} aria-label={`${lead?.name} follow-up bajarildi`} />
                  </label>
                </div>
              )
            })}
          </div>
          {plan.length > 5 && (
            <Link className="link-btn" to="/admin/calendar" style={{ marginTop: 8 }}>
              Yana {plan.length - 5} ta → Kalendar
            </Link>
          )}
        </Card>
      </div>
    </>
  )
}
