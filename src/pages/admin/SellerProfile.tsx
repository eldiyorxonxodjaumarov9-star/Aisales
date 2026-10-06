import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Avatar, Button, Card, KpiCard, PageHeader, Progress, ResultBadge, StateBlock, StatusBadge } from '../../components/ui'
import { LineChart } from '../../components/charts'
import { useDemo } from '../../store/store'
import { useDialogs } from '../../dialogs/Dialogs'
import { dailySeries, delta, kpis, previousRange, sellerStats } from '../../store/metrics'
import { dayKey, fmtPct, fmtRelativeDay, isSameDay } from '../../lib/format'
import { useNow } from '../../lib/useNow'

export default function SellerProfile() {
  const { id } = useParams()
  const { state } = useDemo()
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const now = useNow()
  const seller = state.sellers.find((s) => s.id === id)
  if (!seller)
    return (
      <Card>
        <StateBlock kind="error" title="Sotuvchi topilmadi" text="Bu foydalanuvchi mavjud emas." action={<Button onClick={() => navigate('/admin/sellers')}>Sotuvchilarga qaytish</Button>} />
      </Card>
    )
  const todayKey = dayKey(new Date(now))
  const today = kpis(state, { from: todayKey, to: todayKey }, seller.id)
  const cur = kpis(state, state.range, seller.id)
  const prev = kpis(state, previousRange(state.range), seller.id)
  const st = sellerStats(state, seller.id)
  const series = dailySeries(state, state.range, seller.id)
  const target = state.settings.kpi
  const fuToday = state.followups.filter((f) => f.sellerId === seller.id && isSameDay(f.due, new Date(now)))
  const overdue = state.followups.filter((f) => f.sellerId === seller.id && !f.done && new Date(f.due).getTime() < now)
  const leads = state.leads.filter((l) => l.sellerId === seller.id && !['won', 'lost'].includes(l.status)).sort((a, b) => b.score - a.score)
  const calls = state.calls.filter((c) => c.sellerId === seller.id).slice(0, 5)
  const strengths = [
    { label: 'Mahsulotni tushuntirish', v: st.quality },
    { label: 'Ehtiyojni aniqlash', v: st.needs },
    { label: 'E’tiroz bilan ishlash', v: st.objection },
    { label: 'Closing', v: st.closing },
  ].sort((a, b) => b.v - a.v)

  return (
    <>
      <PageHeader
        back={
          <button className="back-link" onClick={() => navigate('/admin/sellers')}>
            <Icon name="chevronLeft" size={14} /> Sotuvchilar
          </button>
        }
        title={
          <span className="row">
            <Avatar name={seller.name} size={36} />
            {seller.name}
          </span>
        }
        subtitle={`${seller.title} · natijalar va rivojlanish tavsiyalari`}
        actions={
          <>
            <Button variant="secondary" icon="download" onClick={() => dialogs.exportData({ dataset: 'leads', sellerId: seller.id })}>
              Eksport
            </Button>
            <Button variant="secondary" icon="edit" onClick={() => dialogs.editUser(seller.id)}>
              Profilni tahrirlash
            </Button>
          </>
        }
      />
      <div className="kpi-grid four">
        <KpiCard label="Bugungi leadlar" value={today.leads} />
        <KpiCard label="Bugungi qo‘ng‘iroqlar" value={`${today.calls} / ${target.dailyCalls}`} />
        <KpiCard label="Bugungi sotuvlar" value={`${today.sales} / ${target.dailySales}`} />
        <KpiCard label="Konversiya (davr)" value={fmtPct(cur.conversion)} delta={cur.conversion - prev.conversion} />
      </div>
      <div className="dash-row-3 mb">
        <Card title="Natijalar dinamikasi" subtitle="Tanlangan davr · lead, qo‘ng‘iroq va sotuv">
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
        <Card title="Bugungi reja">
          <div style={{ fontSize: 26, fontWeight: 700 }}>
            {today.sales} / {target.dailySales} <span className="muted" style={{ fontSize: 14 }}>sotuv</span>
          </div>
          <Progress value={(today.sales / target.dailySales) * 100} height={8} />
          <p className="muted" style={{ marginTop: 8 }}>
            {Math.round((today.sales / target.dailySales) * 100)}% bajarildi · {Math.max(0, target.dailySales - today.sales)} ta sotuv qoldi
          </p>
          <p style={{ marginTop: 12 }}>
            {fuToday.length} ta follow-up rejalashtirilgan. <span className={overdue.length ? 'text-red' : ''}>{overdue.length} tasi kechikkan.</span>
          </p>
          <Button variant="soft" size="sm" style={{ marginTop: 12 }} onClick={() => navigate('/admin/calendar')}>
            Kalendarda ko‘rish →
          </Button>
          <p className="small muted" style={{ marginTop: 10 }}>Davr bo‘yicha sotuvlar: {cur.sales} ({delta(cur.sales, prev.sales) >= 0 ? '↑' : '↓'} {Math.abs(delta(cur.sales, prev.sales)).toFixed(1)}%)</p>
        </Card>
      </div>
      <div className="grid cols-2 mb">
        <Card title="Kuchli tomonlari" subtitle="AI bahosi · tahlil qilingan suhbatlar asosida">
          <ul className="bullets">
            {strengths.slice(0, 2).map((s) => (
              <li key={s.label}>
                <i className="bg-green" />
                {s.label}: {s.v}%
              </li>
            ))}
            <li>
              <i className="bg-green" />
              Jami {st.calls} ta qo‘ng‘iroq · {st.sales} ta sotuv
            </li>
          </ul>
        </Card>
        <Card title="Rivojlantirish kerak" subtitle="AI bahosi · tahlil qilingan suhbatlar asosida">
          <ul className="bullets">
            {strengths.slice(2).map((s) => (
              <li key={s.label}>
                <i className={s.v < 55 ? 'bg-red' : 'bg-amber'} />
                {s.label}: {s.v}%
              </li>
            ))}
            <li>
              <i className={overdue.length ? 'bg-red' : 'bg-green'} />
              Follow-up: {overdue.length} ta muddati o‘tgan
            </li>
          </ul>
        </Card>
      </div>
      <div className="grid cols-2">
        <Card title="Faol leadlar" subtitle={`${leads.length} ta`} action={<button className="link-btn" onClick={() => navigate(`/admin/leads?seller=${seller.id}`)}>Barchasi →</button>}>
          <ul className="list">
            {leads.slice(0, 5).map((l) => (
              <li key={l.id}>
                <button className="list-row btn-row" onClick={() => navigate(`/admin/leads/${l.id}`)}>
                  <Avatar name={l.name} size={30} />
                  <span className="grow strong ellipsis">{l.name}</span>
                  <StatusBadge status={l.status} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="So‘nggi qo‘ng‘iroqlar">
          <ul className="list">
            {calls.map((c) => (
              <li key={c.id}>
                <button className="list-row btn-row" onClick={() => navigate(c.aiStatus === 'ready' ? `/admin/calls/${c.id}` : `/admin/leads/${c.leadId}`)}>
                  <Icon name="phone" size={16} className="muted" />
                  <span className="grow">
                    <span className="strong">{state.leads.find((l) => l.id === c.leadId)?.name}</span>
                    <span className="small muted"> · {fmtRelativeDay(c.startedAt)}</span>
                  </span>
                  <ResultBadge result={c.result} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}
