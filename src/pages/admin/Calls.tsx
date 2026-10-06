import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Badge, Button, Card, PageHeader, Pagination, ResultBadge, Select, StateBlock } from '../../components/ui'
import { RESULT_META } from '../../lib/meta'
import { useDemo } from '../../store/store'
import { useDialogs } from '../../dialogs/Dialogs'
import { fmtDateTime, fmtDuration } from '../../lib/format'

const PER_PAGE = 8

export default function Calls() {
  const { state } = useDemo()
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const [q, setQ] = useState('')
  const [seller, setSeller] = useState('')
  const [result, setResult] = useState('')
  const [ai, setAi] = useState('')
  const [page, setPage] = useState(1)
  const leadName = (id: string) => state.leads.find((l) => l.id === id)?.name ?? id
  const sellerName = (id: string) => state.sellers.find((s) => s.id === id)?.name.split(' ')[0] ?? '—'

  const s = q.trim().toLowerCase()
  const list = state.calls.filter(
    (c) =>
      (!s || leadName(c.leadId).toLowerCase().includes(s)) &&
      (!seller || c.sellerId === seller) &&
      (!result || c.result === result) &&
      (!ai || c.aiStatus === ai),
  )
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE))
  const cur = Math.min(page, pages)
  const reset = (fn: () => void) => {
    fn()
    setPage(1)
  }

  return (
    <>
      <PageHeader
        title="Qo‘ng‘iroqlar"
        subtitle="Audio, transkript va AI tahlilini ko‘rib chiqing"
        actions={
          <Button variant="secondary" icon="download" onClick={() => dialogs.exportData({ dataset: 'calls' })}>
            Eksport
          </Button>
        }
      />
      <div className="toolbar">
        <label className="input-icon">
          <Icon name="search" size={16} />
          <input className="input" type="search" placeholder="Mijozni qidirish..." aria-label="Mijozni qidirish" value={q} onChange={(e) => reset(() => setQ(e.target.value))} />
        </label>
        <Select className="half" aria-label="Sotuvchi" value={seller} onChange={(e) => reset(() => setSeller(e.target.value))} options={[{ value: '', label: 'Barcha sotuvchilar' }, ...state.sellers.filter((s) => s.role === 'seller').map((s) => ({ value: s.id, label: s.name }))]} />
        <Select className="half" aria-label="Natija" value={result} onChange={(e) => reset(() => setResult(e.target.value))} options={[{ value: '', label: 'Barcha natijalar' }, ...Object.entries(RESULT_META).map(([value, m]) => ({ value, label: m.label }))]} />
        <Select
          aria-label="AI holati"
          value={ai}
          onChange={(e) => reset(() => setAi(e.target.value))}
          options={[
            { value: '', label: 'AI holati: barchasi' },
            { value: 'ready', label: 'Tayyor' },
            { value: 'queued', label: 'Navbatda' },
            { value: 'none', label: 'Tahlil yo‘q' },
          ]}
        />
      </div>
      <Card title="Qo‘ng‘iroqlar ro‘yxati" subtitle={`${list.length} ta qo‘ng‘iroq`} pad={false}>
        {list.length === 0 ? (
          <StateBlock kind="empty" title="Qo‘ng‘iroq topilmadi" text="Filtrlarni o‘zgartirib ko‘ring." action={<Button variant="soft" onClick={() => reset(() => (setQ(''), setSeller(''), setResult(''), setAi('')))}>Filtrlarni tozalash</Button>} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Mijoz</th>
                  <th>Sotuvchi</th>
                  <th>Sana / vaqt</th>
                  <th>Davomiylik</th>
                  <th>Natija</th>
                  <th>AI holati</th>
                </tr>
              </thead>
              <tbody>
                {list.slice((cur - 1) * PER_PAGE, cur * PER_PAGE).map((c) => (
                  <tr key={c.id} className="row-link" onClick={() => navigate(c.aiStatus === 'ready' ? `/admin/calls/${c.id}` : `/admin/leads/${c.leadId}`)}>
                    <td className="strong">{leadName(c.leadId)}</td>
                    <td>{sellerName(c.sellerId)}</td>
                    <td>{fmtDateTime(c.startedAt)}</td>
                    <td>{fmtDuration(c.duration)}</td>
                    <td>
                      <ResultBadge result={c.result} />
                    </td>
                    <td>{c.aiStatus === 'ready' ? <Badge tone="green">Tayyor</Badge> : c.aiStatus === 'queued' ? <Badge tone="purple">Navbatda…</Badge> : <Badge tone="gray">—</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {list.length > 0 && <Pagination page={cur} total={list.length} perPage={PER_PAGE} onChange={setPage} label={`${list.length} ta natija · ${cur}/${pages}`} />}
      </Card>
    </>
  )
}
