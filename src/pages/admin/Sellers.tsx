import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Avatar, Badge, Button, Card, PageHeader, Segmented, StateBlock } from '../../components/ui'
import { useDemo } from '../../store/store'
import { useDialogs } from '../../dialogs/Dialogs'
import { sellerStats } from '../../store/metrics'
import { fmtPct, fmtRange } from '../../lib/format'

function coachingLines(st: ReturnType<typeof sellerStats>) {
  const level = (v: number) => (v >= 75 ? { t: 'yaxshi', c: 'bg-green' } : v >= 55 ? { t: 'rivojlantirish kerak', c: 'bg-amber' } : { t: 'e’tibor talab qiladi', c: 'bg-red' })
  const fu = st.overdue === 0 ? { t: 'yaxshi', c: 'bg-green' } : st.overdue <= 2 ? { t: 'rivojlantirish kerak', c: 'bg-amber' } : { t: 'e’tibor talab qiladi', c: 'bg-red' }
  return [
    { label: 'Ehtiyojni aniqlash', ...level(st.needs) },
    { label: 'Narx e’tirozi', ...level(st.objection) },
    { label: 'Follow-up', ...fu },
  ]
}

export default function Sellers() {
  const { state } = useDemo()
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'conversion' | 'sales' | 'name'>('conversion')
  const list = state.sellers
    .filter((s) => s.role === 'seller' && s.name.toLowerCase().includes(q.trim().toLowerCase()))
    .map((s) => ({ s, st: sellerStats(state, s.id, state.range) }))
    .sort((a, b) => (sort === 'name' ? a.s.name.localeCompare(b.s.name) : sort === 'sales' ? b.st.sales - a.st.sales : b.st.conversion - a.st.conversion))

  return (
    <>
      <PageHeader
        title="Sotuvchilar"
        subtitle={`Jamoa ko‘rsatkichlari va AI coaching · ${fmtRange(state.range.from, state.range.to)}`}
        actions={
          <Button icon="plus" onClick={() => dialogs.invite()}>
            Sotuvchi qo‘shish
          </Button>
        }
      />
      <div className="toolbar">
        <label className="input-icon">
          <Icon name="search" size={16} />
          <input className="input" type="search" placeholder="Sotuvchini qidirish..." aria-label="Sotuvchini qidirish" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <Segmented
          value={sort}
          onChange={setSort}
          options={[
            { value: 'conversion', label: 'Konversiya' },
            { value: 'sales', label: 'Sotuvlar' },
            { value: 'name', label: 'Ism' },
          ]}
        />
      </div>
      {list.length === 0 && (
        <Card>
          <StateBlock kind="empty" title="Sotuvchi topilmadi" text="Qidiruvni o‘zgartiring yoki yangi sotuvchini taklif qiling." />
        </Card>
      )}
      <div className="grid cols-3">
        {list.map(({ s, st }) => (
          <Card key={s.id} className="seller-card">
            <div className="row">
              <Avatar name={s.name} size={44} />
              <div className="grow">
                <div className="strong" style={{ fontSize: 15 }}>{s.name}</div>
                <div className="small muted">
                  {s.title} · {s.status === 'active' ? 'Faol' : s.status === 'invited' ? 'Taklif yuborilgan' : 'Bloklangan'}
                </div>
              </div>
              {s.status !== 'active' && <Badge tone={s.status === 'invited' ? 'amber' : 'red'}>{s.status === 'invited' ? 'Taklif' : 'Blok'}</Badge>}
            </div>
            <div className="seller-stats">
              <div>
                <span>Leadlar</span>
                <b>{st.leads}</b>
              </div>
              <div>
                <span>Qo‘ng‘iroq</span>
                <b>{st.calls}</b>
              </div>
              <div>
                <span>Sotuv</span>
                <b>{st.sales}</b>
              </div>
              <div>
                <span>Konversiya</span>
                <b className={st.conversion >= 20 ? 'text-green' : st.conversion >= 10 ? 'text-amber' : 'text-red'}>{fmtPct(st.conversion)}</b>
              </div>
            </div>
            <ul className="bullets">
              {coachingLines(st).map((c) => (
                <li key={c.label}>
                  <i className={c.c} />
                  {c.label} — {c.t}
                </li>
              ))}
            </ul>
            <button className="link-btn" onClick={() => navigate(`/admin/sellers/${s.id}`)}>
              Profilni ochish →
            </button>
          </Card>
        ))}
      </div>
    </>
  )
}
