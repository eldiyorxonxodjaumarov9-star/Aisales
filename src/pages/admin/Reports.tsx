import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Button, Card, KpiCard, PageHeader, Pagination, Select } from '../../components/ui'
import { LineChart } from '../../components/charts'
import { useDemo } from '../../store/store'
import { useDialogs } from '../../dialogs/Dialogs'
import { delta, inRange, previousRange, rangeDays } from '../../store/metrics'
import { SOURCES } from '../../store/seed'
import type { DateRange, DemoState } from '../../store/types'
import { dayKey, fmtMoney, fmtNum, fmtPct, fmtRange } from '../../lib/format'

function compute(s: DemoState, range: DateRange, seller: string, source: string) {
  const leads = s.leads.filter((l) => inRange(l.createdAt, range) && (!seller || l.sellerId === seller) && (!source || l.source === source))
  const leadSource = new Map(s.leads.map((l) => [l.id, l.source]))
  const okSrc = (leadId: string) => !source || leadSource.get(leadId) === source
  const calls = s.calls.filter((c) => inRange(c.startedAt, range) && (!seller || c.sellerId === seller) && okSrc(c.leadId))
  const sales = s.sales.filter((x) => inRange(x.at, range) && (!seller || x.sellerId === seller) && okSrc(x.leadId))
  return { leads, calls, sales, revenue: sales.reduce((a, x) => a + x.amount, 0), conversion: leads.length ? (sales.length / leads.length) * 100 : 0 }
}

type SortKey = 'sales' | 'revenue' | 'conversion' | 'leads'

export default function Reports() {
  const { state } = useDemo()
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const [seller, setSeller] = useState('')
  const [source, setSource] = useState('')
  const [sort, setSort] = useState<SortKey>('revenue')
  const [page, setPage] = useState(1)
  const range = state.range
  const cur = compute(state, range, seller, source)
  const prev = compute(state, previousRange(range), seller, source)
  const days = rangeDays(range)
  const rows = state.sellers
    .filter((x) => x.role === 'seller' && (!seller || x.id === seller))
    .map((x) => {
      const r = compute(state, range, x.id, source)
      return { s: x, leads: r.leads.length, calls: r.calls.length, sales: r.sales.length, conversion: r.conversion, revenue: r.revenue }
    })
    .sort((a, b) => b[sort] - a[sort])
  const PER = 5
  const th = (k: SortKey, label: string) => (
    <th>
      <button className={`th-sort ${sort === k ? 'active' : ''}`} onClick={() => setSort(k)}>
        {label} {sort === k && <Icon name="chevronDown" size={12} />}
      </button>
    </th>
  )

  return (
    <>
      <PageHeader
        title="Hisobotlar"
        subtitle={`Davr, sotuvchi va manba bo‘yicha hisobotingiz · ${fmtRange(range.from, range.to)}`}
        actions={
          <Button icon="download" onClick={() => dialogs.exportData({ dataset: 'sellers', sellerId: seller || undefined })}>
            Hisobotni yuklab olish
          </Button>
        }
      />
      <div className="toolbar">
        <Select className="half" aria-label="Sotuvchi" value={seller} onChange={(e) => (setSeller(e.target.value), setPage(1))} options={[{ value: '', label: 'Barcha sotuvchilar' }, ...state.sellers.filter((s) => s.role === 'seller').map((s) => ({ value: s.id, label: s.name }))]} />
        <Select className="half" aria-label="Manba" value={source} onChange={(e) => (setSource(e.target.value), setPage(1))} options={[{ value: '', label: 'Barcha manbalar' }, ...SOURCES.map((s) => ({ value: s, label: s }))]} />
      </div>
      <div className="kpi-grid four">
        <KpiCard label="Leadlar" value={fmtNum(cur.leads.length)} delta={delta(cur.leads.length, prev.leads.length)} onClick={() => navigate('/admin/leads')} />
        <KpiCard label="Qo‘ng‘iroqlar" value={fmtNum(cur.calls.length)} delta={delta(cur.calls.length, prev.calls.length)} onClick={() => navigate('/admin/calls')} />
        <KpiCard label="Sotuvlar" value={fmtNum(cur.sales.length)} delta={delta(cur.sales.length, prev.sales.length)} />
        <KpiCard label="Konversiya" value={fmtPct(cur.conversion)} delta={cur.conversion - prev.conversion} />
      </div>
      <div className="dash-row-3 mb">
        <Card title="Sotuvlar dinamikasi" subtitle="Tanlangan davr · natijalar taqqoslanishi">
          <LineChart
            days={days}
            height={200}
            series={[
              { label: 'Leadlar', color: '#245CFF', data: days.map((d) => cur.leads.filter((l) => dayKey(l.createdAt) === d).length) },
              { label: 'Qo‘ng‘iroqlar', color: '#885CF6', data: days.map((d) => cur.calls.filter((c) => dayKey(c.startedAt) === d).length) },
              { label: 'Sotuvlar', color: '#13AC80', data: days.map((d) => cur.sales.filter((x) => dayKey(x.at) === d).length) },
            ]}
          />
        </Card>
        <Card title="Daromad">
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>{fmtNum(cur.revenue)}</div>
          <p className="muted">so‘m · tanlangan davr</p>
          <p className={`strong ${delta(cur.revenue, prev.revenue) >= 0 ? 'text-green' : 'text-red'}`} style={{ marginTop: 10 }}>
            {delta(cur.revenue, prev.revenue) >= 0 ? '↑' : '↓'} {Math.abs(delta(cur.revenue, prev.revenue)).toFixed(1)}% oldingi davrga nisbatan
          </p>
          <p className="small muted" style={{ marginTop: 12 }}>O‘rtacha chek: {cur.sales.length ? fmtMoney(cur.revenue / cur.sales.length) : '—'}</p>
        </Card>
      </div>
      <Card title="Sotuvchilar hisoboti" pad={false} action={<button className="link-btn" onClick={() => navigate('/admin/sellers')}>Barchasini ko‘rish →</button>}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Sotuvchi</th>
                {th('leads', 'Leadlar')}
                <th>Qo‘ng‘iroq</th>
                {th('sales', 'Sotuvlar')}
                {th('conversion', 'Konversiya')}
                {th('revenue', 'Daromad')}
              </tr>
            </thead>
            <tbody>
              {rows.slice((page - 1) * PER, page * PER).map((r) => (
                <tr key={r.s.id} className="row-link" onClick={() => navigate(`/admin/sellers/${r.s.id}`)}>
                  <td className="strong">{r.s.name}</td>
                  <td>{r.leads}</td>
                  <td>{r.calls}</td>
                  <td>{r.sales}</td>
                  <td>{fmtPct(r.conversion)}</td>
                  <td>{fmtMoney(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={rows.length} perPage={PER} onChange={setPage} label={`${rows.length} ta sotuvchi · lokal demo`} />
      </Card>
    </>
  )
}
