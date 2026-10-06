import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Badge, Button, Progress, Segmented } from '../../components/ui'
import { LineChart, Legend } from '../../components/charts'
import { SellerPage } from '../../layouts/SellerLayout'
import { useDemo } from '../../store/store'
import { dailySeries, delta, kpis, previousRange, sellerStats } from '../../store/metrics'
import { useMe } from './useMe'
import { useNow } from '../../lib/useNow'
import { addDays, dayKey, fmtMoney, fmtPct } from '../../lib/format'
import { toneOf } from '../../lib/meta'

type Period = '1' | '7' | '30'

function Kpi({ label, value, d }: { label: string; value: string; d: number }) {
  return (
    <div className="m-kpi">
      <span>{label}</span>
      <b>{value}</b>
      <small className={d >= 0 ? 'text-green' : 'text-red'} style={{ fontSize: 11, fontWeight: 600 }}>
        {d >= 0 ? '▲' : '▼'} {Math.abs(Math.round(d))}%
      </small>
    </div>
  )
}

export default function Statistics() {
  const { state } = useDemo()
  const me = useMe()
  const navigate = useNavigate()
  const [period, setPeriod] = useState<Period>('7')
  const today = new Date(useNow())
  const range = { from: dayKey(addDays(today, -(Number(period) - 1))), to: dayKey(today) }
  const chartRange = period === '1' ? { from: dayKey(addDays(today, -6)), to: dayKey(today) } : range
  const k = kpis(state, range, me.id)
  const p = kpis(state, previousRange(range), me.id)
  const st = sellerStats(state, me.id, range)
  const series = dailySeries(state, chartRange, me.id)
  const target = state.settings.kpi.dailySales * Number(period)
  const skills = [
    { key: 'needs', label: 'Ehtiyojni aniqlash', v: st.needs, tip: 'Suhbat boshida 2–3 ta ochiq savol bering: maqsad, muddat, byudjet.' },
    { key: 'objection', label: 'E’tiroz bilan ishlash', v: st.objection, tip: 'Narx e’tirozida avval qiymatni, keyin to‘lov variantlarini ayting.' },
    { key: 'closing', label: 'Yopish', v: st.closing, tip: 'Har suhbat oxirida aniq keyingi qadam va vaqtni kelishing.' },
  ]
  const weakest = [...skills].sort((a, b) => a.v - b.v)[0]
  const lastAnalysed = state.calls.find((c) => c.sellerId === me.id && c.analysis)

  return (
    <SellerPage title="Statistika" sub="Shaxsiy natijalar">
      <Segmented
        value={period}
        onChange={setPeriod}
        options={[
          { value: '1', label: 'Bugun' },
          { value: '7', label: '7 kun' },
          { value: '30', label: '30 kun' },
        ]}
      />
      <div className="m-card">
        <div className="row-between">
          <span className="muted">Sotuv rejasi</span>
          <Badge tone={k.sales >= target ? 'green' : 'blue'}>
            {k.sales} / {target}
          </Badge>
        </div>
        <div style={{ margin: '10px 0 6px' }}>
          <Progress value={(k.sales / target) * 100} height={8} />
        </div>
        <span className="small muted">Tushum: {fmtMoney(k.revenue)}</span>
      </div>
      <div className="m-kpis" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <Kpi label="Leadlar" value={String(k.leads)} d={delta(k.leads, p.leads)} />
        <Kpi label="Qo‘ng‘iroqlar" value={String(k.calls)} d={delta(k.calls, p.calls)} />
        <Kpi label="Sotuvlar" value={String(k.sales)} d={delta(k.sales, p.sales)} />
        <Kpi label="Konversiya" value={fmtPct(k.conversion)} d={k.conversion - p.conversion} />
      </div>
      <div className="m-card">
        <div className="row-between" style={{ marginBottom: 8 }}>
          <b>{period === '1' ? 'Oxirgi 7 kun' : `Oxirgi ${period} kun`}</b>
        </div>
        <LineChart
          days={series.days}
          height={170}
          series={[
            { label: 'Qo‘ng‘iroqlar', color: '#885CF6', data: series.calls },
            { label: 'Sotuvlar', color: '#13AC80', data: series.sales },
          ]}
        />
        <Legend items={[{ label: 'Qo‘ng‘iroqlar', color: '#885CF6' }, { label: 'Sotuvlar', color: '#13AC80' }]} />
      </div>
      <div className="m-card stack">
        <b>Suhbat ko‘nikmalari</b>
        {skills.map((s) => (
          <div key={s.key}>
            <div className="row-between small" style={{ marginBottom: 6 }}>
              <span>{s.label}</span>
              <b className={`text-${toneOf(s.v)}`}>{s.v ? `${s.v}%` : '—'}</b>
            </div>
            <Progress value={s.v} tone={toneOf(s.v)} />
          </div>
        ))}
      </div>
      <div className="alert-card">
        <b className="row" style={{ gap: 6 }}>
          <Icon name="sparkle" size={16} /> AI tavsiyasi
        </b>
        <p className="small" style={{ margin: '6px 0 10px' }}>
          {weakest.v ? `${weakest.label} — eng past ko‘rsatkich (${weakest.v}%). ${weakest.tip}` : 'Tavsiya uchun AI tahlil qilingan qo‘ng‘iroqlar yetarli emas.'}
        </p>
        {lastAnalysed && (
          <Button size="sm" variant="soft" onClick={() => navigate(`/seller/coach/${lastAnalysed.id}`)}>
            Oxirgi tahlilni ko‘rish
          </Button>
        )}
      </div>
    </SellerPage>
  )
}
