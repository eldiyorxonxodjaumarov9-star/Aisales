import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, KpiCard, PageHeader, Pagination, Toggle } from '../../components/ui'
import { LineChart } from '../../components/charts'
import { useToast } from '../../components/toast'
import { useDemo } from '../../store/store'
import { useDialogs } from '../../dialogs/Dialogs'
import { campaignStats, delta, inRange, previousRange, rangeDays } from '../../store/metrics'
import { dayKey, fmtMoney, fmtNum, fmtPct } from '../../lib/format'

const PER_PAGE = 4

export default function Ads() {
  const { state } = useDemo()
  const navigate = useNavigate()
  const toast = useToast()
  const dialogs = useDialogs()
  const [paused, setPaused] = useState<Record<string, boolean>>({})
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<'leads' | 'conversion'>('leads')
  const range = state.range
  const stats = campaignStats(state, range).sort((a, b) => (sort === 'leads' ? b.leads - a.leads : b.conversion - a.conversion))
  const prev = campaignStats(state, previousRange(range))
  const sum = (arr: typeof stats, k: 'leads' | 'sales') => arr.reduce((a, c) => a + c[k], 0)
  const leads = sum(stats, 'leads')
  const sales = sum(stats, 'sales')
  const spend = stats.reduce((a, c) => a + c.spend, 0)
  const best = [...stats].filter((c) => c.leads >= 3).sort((a, b) => b.conversion - a.conversion)[0] ?? stats[0]
  const days = rangeDays(range)
  const adLeads = state.leads.filter((l) => l.campaignId && inRange(l.createdAt, range))
  const ids = new Set(adLeads.map((l) => l.id))
  const series = {
    leads: days.map((d) => adLeads.filter((l) => dayKey(l.createdAt) === d).length),
    calls: days.map((d) => state.calls.filter((c) => ids.has(c.leadId) && dayKey(c.startedAt) === d).length),
    sales: days.map((d) => state.sales.filter((s) => ids.has(s.leadId) && dayKey(s.at) === d).length),
  }
  const active = stats.filter((c) => !paused[c.id]).length

  return (
    <>
      <PageHeader
        title="Reklamalar"
        subtitle="Manbadan kelgan leadning haqiqiy sotuvgacha bo‘lgan natijasi"
        actions={
          <Button variant="secondary" icon="download" onClick={() => dialogs.exportData({ dataset: 'leads' })}>
            Eksport
          </Button>
        }
      />
      <div className="kpi-grid four">
        <KpiCard label="Leadlar" value={fmtNum(leads)} delta={delta(leads, sum(prev, 'leads'))} />
        <KpiCard label="Sotuvlar" value={fmtNum(sales)} delta={delta(sales, sum(prev, 'sales'))} />
        <KpiCard label="Reklama xarajati" value={`$${spend}`} />
        <KpiCard label="Sotuv / lead" value={fmtPct(leads ? (sales / leads) * 100 : 0)} />
      </div>
      <div className="dash-row-3 mb">
        <Card title="Reklama natijalari" subtitle="Tanlangan davr · reklama leadlari, qo‘ng‘iroqlar va sotuvlar">
          <LineChart
            days={days}
            height={200}
            series={[
              { label: 'Leadlar', color: '#245CFF', data: series.leads },
              { label: 'Qo‘ng‘iroqlar', color: '#885CF6', data: series.calls },
              { label: 'Sotuvlar', color: '#13AC80', data: series.sales },
            ]}
          />
        </Card>
        <Card title="Eng samarali reklama">
          {best && (
            <div className="stack">
              <div style={{ fontSize: 20, fontWeight: 700 }}>{best.name}</div>
              <div className="text-green strong" style={{ fontSize: 26 }}>{fmtPct(best.conversion)} <span className="muted small">konversiya</span></div>
              <p className="muted">
                {best.leads} lead → {best.sales} sotuv · {fmtMoney(best.revenue)}
              </p>
              <p className="small muted">Sotuv manbasi CRM natijasi bilan bog‘langan · {active} faol kampaniya (demo).</p>
              <Button variant="soft" onClick={() => navigate(`/admin/leads?campaign=${best.id}`)}>
                Leadlarini ko‘rish →
              </Button>
            </div>
          )}
        </Card>
      </div>
      <Card
        title="Kampaniyalar"
        pad={false}
        action={
          <select className="input" style={{ height: 32, width: 'auto' }} aria-label="Saralash" value={sort} onChange={(e) => setSort(e.target.value as 'leads' | 'conversion')}>
            <option value="leads">Leadlar bo‘yicha</option>
            <option value="conversion">Konversiya bo‘yicha</option>
          </select>
        }
      >
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Kampaniya</th>
                <th>Manba</th>
                <th>Leadlar</th>
                <th>Sotuvlar</th>
                <th>Konversiya</th>
                <th>Xarajat</th>
                <th>Lead narxi</th>
                <th>Holat (demo)</th>
              </tr>
            </thead>
            <tbody>
              {stats.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((c) => (
                <tr key={c.id} className="row-link" onClick={() => navigate(`/admin/leads?campaign=${c.id}`)}>
                  <td className="strong">{c.name}</td>
                  <td>{c.source}</td>
                  <td>{c.leads}</td>
                  <td>{c.sales}</td>
                  <td>
                    <Badge tone={c.conversion >= 10 ? 'green' : 'red'}>{fmtPct(c.conversion)}</Badge>
                  </td>
                  <td>${c.spend}</td>
                  <td>{c.leads ? `$${(c.spend / c.leads).toFixed(2)}` : '—'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="row">
                      <Toggle
                        checked={!paused[c.id]}
                        label={`${c.name} faolligi`}
                        onChange={(v) => {
                          setPaused((p) => ({ ...p, [c.id]: !v }))
                          toast(`${c.name}: ${v ? 'faol' : 'to‘xtatildi'} (faqat demo ko‘rinish)`, 'info')
                        }}
                      />
                      <span className="small muted">{paused[c.id] ? 'To‘xtatilgan' : 'Faol'}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={stats.length} perPage={PER_PAGE} onChange={setPage} label={`${stats.length} ta kampaniya · lokal demo`} />
      </Card>
    </>
  )
}
