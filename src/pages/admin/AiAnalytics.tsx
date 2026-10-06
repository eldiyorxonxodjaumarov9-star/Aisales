import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Badge, Button, Card, Modal, PageHeader, ResultBadge, StateBlock } from '../../components/ui'
import { BarList, Donut } from '../../components/charts'
import { useToast } from '../../components/toast'
import { useDemo } from '../../store/store'
import { aiInsights, inRange, lossReasons, sellerStats } from '../../store/metrics'
import { hashString } from '../../store/analysis'
import type { Call } from '../../store/types'
import { fmtRelativeDay, fmtTime } from '../../lib/format'
import { useNow } from '../../lib/useNow'

export default function AiAnalytics() {
  const { state } = useDemo()
  const navigate = useNavigate()
  const toast = useToast()
  const [updatedAt, setUpdatedAt] = useState(() => new Date())
  const [loading, setLoading] = useState(false)
  const [rec, setRec] = useState<number | null>(null)
  const [sent, setSent] = useState<Record<number, boolean>>({})
  const now = useNow()
  const range = state.range
  const calls = state.calls.filter((c) => inRange(c.startedAt, range) && c.analysis)
  const insights = aiInsights(state, range)
  const loss = lossReasons(state, range)
  const price = calls.filter((c) => c.analysis!.priceObjection)
  const notNeeded = calls.filter((c) => c.result === 'lost')
  const thinking = calls.filter((c) => c.result === 'thinking')
  const rest = calls.filter((c) => c.result === 'interested' || c.result === 'followup')
  const delivery = rest.filter((c) => hashString(c.id) % 3 === 0)
  const quality = rest.filter((c) => hashString(c.id) % 3 === 1)
  const totalObj = Math.max(1, price.length + notNeeded.length + thinking.length + delivery.length + quality.length)
  const objections = [
    { label: 'Narx qimmat', value: Math.round((price.length / totalObj) * 100), suffix: '%', color: '#E84C61' },
    { label: 'Hozir kerak emas', value: Math.round((notNeeded.length / totalObj) * 100), suffix: '%', color: '#F6B755' },
    { label: 'Boshqa variantni ko‘raman', value: Math.round((thinking.length / totalObj) * 100), suffix: '%', color: '#885CF6' },
    { label: 'Yetkazish muddati', value: Math.round((delivery.length / totalObj) * 100), suffix: '%', color: '#46B9E8' },
    { label: 'Sifat haqida savol', value: Math.round((quality.length / totalObj) * 100), suffix: '%', color: '#245CFF' },
  ]
  const noClosing = calls.filter((c) => !c.analysis!.closingFound && c.result !== 'noanswer')
  const overdueLeadIds = [...new Set(state.followups.filter((f) => !f.done && new Date(f.due).getTime() < now).map((f) => f.leadId))]
  const recs = [
    { title: '01 · Narx e’tirozi', text: 'Qiymatni tushuntirish bo‘yicha 15 daqiqalik mashg‘ulot.', detail: 'Narx e’tirozi bo‘lgan suhbatlarda sotuvchi narxni foydadan oldin aytgan. Mashg‘ulotda “qiymat → natija → narx” ketma-ketligi mashq qilinadi.', calls: price },
    { title: '02 · Follow-up', text: 'Kechikkan leadlarni tekshirish va qayta taqsimlash.', detail: `${overdueLeadIds.length} ta leadda follow-up muddati o‘tgan. Ularni bugun qayta taqsimlash yoki vaqtini ko‘chirish tavsiya etiladi.`, calls: [] as Call[] },
    { title: '03 · Closing', text: 'Suhbat oxirida aniq taklif va keyingi qadamni belgilash.', detail: 'Closing savoli topilmagan suhbatlarda mijoz bilan keyingi qadam kelishilmagan. Har suhbat oxirida aniq savol bering.', calls: noClosing },
  ]
  const sellers = state.sellers.filter((s) => s.role === 'seller' && s.status === 'active').map((s) => ({ s, st: sellerStats(state, s.id, range) }))
  const leadName = (id: string) => state.leads.find((l) => l.id === id)?.name ?? id

  const refresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setUpdatedAt(new Date())
      toast('AI ko‘rsatkichlari lokal ma’lumotdan qayta hisoblandi')
    }, 900)
  }

  return (
    <>
      <PageHeader
        title="AI tahlil"
        subtitle="O‘lchanadigan signallar, yo‘qotish sabablari va tavsiyalar"
        actions={
          <>
            <Badge tone="gray">Yangilandi · {fmtTime(updatedAt)}</Badge>
            <Button variant="secondary" icon="refresh" onClick={refresh} disabled={loading}>
              Qayta hisoblash
            </Button>
          </>
        }
      />
      {loading ? (
        <Card>
          <StateBlock kind="loading" title="Ma’lumotlar yuklanmoqda" text="Natijalar bir necha soniyada paydo bo‘ladi." />
        </Card>
      ) : calls.length === 0 ? (
        <Card>
          <StateBlock kind="empty" title="Tanlangan davrda tahlil yo‘q" text="Davrni kengaytiring yoki qo‘ng‘iroqlar AI tahlilini kuting." />
        </Card>
      ) : (
        <>
          <div className="grid cols-3 mb">
            <Card title="AI umumiy xulosasi" subtitle={`${calls.length} ta tahlil qilingan suhbat`}>
              <ul className="bullets">
                {insights.map((i) => (
                  <li key={i.text}>
                    <i className={i.tone === 'red' ? 'bg-red' : i.tone === 'green' ? 'bg-green' : 'bg-amber'} />
                    {i.text}
                  </li>
                ))}
              </ul>
              <Button variant="soft" block style={{ marginTop: 16 }} onClick={() => navigate('/admin/calls')}>
                Qo‘ng‘iroqlarni ko‘rish →
              </Button>
            </Card>
            <Card title="Yo‘qotilgan leadlar sababi">
              <Donut items={loss.items} center={String(loss.total)} sub="Leadlar" size={130} onSelect={() => navigate('/admin/leads?status=lost')} />
            </Card>
            <Card title="Mijozlarning asosiy e’tirozlari">
              <BarList items={objections} max={100} />
            </Card>
          </div>
          <Card title="Jamoaga tavsiya va trening" className="mb">
            <div className="grid cols-3">
              {recs.map((r, i) => (
                <div key={r.title} className="soft-box stack-sm">
                  <div className="row-between">
                    <b className="text-blue">{r.title}</b>
                    {sent[i] && <Badge tone="green">Yuborildi</Badge>}
                  </div>
                  <p>{r.text}</p>
                  <button className="link-btn" onClick={() => setRec(i)}>
                    Tavsiyani ochish →
                  </button>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Sotuvchilar bo‘yicha AI signallari" pad={false}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Sotuvchi</th>
                    <th>Suhbatlar</th>
                    <th>Ehtiyojni aniqlash</th>
                    <th>E’tiroz bilan ishlash</th>
                    <th>Closing</th>
                    <th>Closing savolisiz</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.map(({ s, st }) => (
                    <tr key={s.id} className="row-link" onClick={() => navigate(`/admin/sellers/${s.id}`)}>
                      <td>
                        <div className="person">
                          <Avatar name={s.name} size={28} />
                          <span className="person-name">{s.name}</span>
                        </div>
                      </td>
                      <td>{st.calls}</td>
                      <td className={st.needs >= 75 ? 'text-green' : st.needs >= 55 ? 'text-amber' : 'text-red'}>{st.needs}%</td>
                      <td className={st.objection >= 75 ? 'text-green' : st.objection >= 55 ? 'text-amber' : 'text-red'}>{st.objection}%</td>
                      <td className={st.closing >= 75 ? 'text-green' : st.closing >= 55 ? 'text-amber' : 'text-red'}>{st.closing}%</td>
                      <td>{st.noClosingPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
      {rec !== null && (
        <Modal
          open
          onClose={() => setRec(null)}
          title={recs[rec].title}
          footer={
            <>
              <Button variant="secondary" onClick={() => setRec(null)}>
                Yopish
              </Button>
              {rec === 1 ? (
                <Button onClick={() => navigate('/admin/calendar')}>Kechikkan vazifalarni ochish</Button>
              ) : (
                <Button
                  icon="send"
                  disabled={sent[rec]}
                  onClick={() => {
                    setSent((x) => ({ ...x, [rec]: true }))
                    toast('Tavsiya jamoaga ilova ichida belgilandi (demo)')
                  }}
                >
                  {sent[rec] ? 'Yuborilgan' : 'Jamoaga yuborish'}
                </Button>
              )}
            </>
          }
        >
          <p style={{ marginBottom: 14 }}>{recs[rec].detail}</p>
          {recs[rec].calls.length > 0 && (
            <>
              <div className="small muted strong" style={{ marginBottom: 6 }}>
                Dalil sifatida suhbatlar ({recs[rec].calls.length})
              </div>
              <ul className="list">
                {recs[rec].calls.slice(0, 6).map((c) => (
                  <li key={c.id}>
                    <button className="list-row btn-row" onClick={() => navigate(`/admin/calls/${c.id}`)}>
                      <span className="grow">
                        <span className="strong">{leadName(c.leadId)}</span>
                        <span className="small muted"> · {fmtRelativeDay(c.startedAt)}</span>
                      </span>
                      <ResultBadge result={c.result} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {rec === 1 && (
            <ul className="list">
              {overdueLeadIds.slice(0, 6).map((id) => (
                <li key={id}>
                  <button className="list-row btn-row" onClick={() => navigate(`/admin/leads/${id}`)}>
                    <span className="grow strong">{leadName(id)}</span>
                    <Badge tone="red">Kechikkan</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </>
  )
}
