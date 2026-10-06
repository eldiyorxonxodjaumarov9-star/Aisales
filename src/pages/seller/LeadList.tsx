import { useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Button, StateBlock } from '../../components/ui'
import { SellerPage } from '../../layouts/SellerLayout'
import { useDemo } from '../../store/store'
import { useDialogs } from '../../dialogs/Dialogs'
import { LeadCard } from './common'
import { useMe } from './useMe'

export default function SellerLeads() {
  const { state } = useDemo()
  const me = useMe()
  const dialogs = useDialogs()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const status = params.get('status') ?? ''
  const set = (k: string, v: string) => {
    const n = new URLSearchParams(params)
    if (v) n.set(k, v)
    else n.delete(k)
    setParams(n, { replace: true })
  }
  const mine = state.leads.filter((l) => l.sellerId === me.id)
  const s = q.trim().toLowerCase()
  const searched = mine.filter((l) => !s || l.name.toLowerCase().includes(s) || l.phone.replace(/\D/g, '').includes(s.replace(/\D/g, '') || '§'))
  const list = searched.filter((l) => !status || l.status === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const chips = [
    { key: '', label: 'Barchasi' },
    { key: 'new', label: 'Yangi' },
    { key: 'contacted', label: 'Aloqada' },
    { key: 'followup', label: 'Follow-up' },
    { key: 'interested', label: 'Qiziqmoqda' },
    { key: 'won', label: 'Sotilgan' },
  ]
  return (
    <SellerPage
      title="Mening leadlarim"
      action={
        <button className="icon-btn" aria-label="Lead qo‘shish" onClick={() => dialogs.addLead()}>
          <Icon name="plus" size={22} />
        </button>
      }
    >
      <label className="input-icon">
        <Icon name="search" size={16} />
        <input className="input" style={{ height: 44, borderRadius: 12 }} type="search" placeholder="Mijozni qidirish..." aria-label="Mijozni qidirish" value={q} onChange={(e) => set('q', e.target.value)} />
      </label>
      <div className="chips" role="tablist">
        {chips.map((c) => (
          <button key={c.key || 'all'} role="tab" aria-selected={status === c.key} className={`chip ${status === c.key ? 'active' : ''}`} onClick={() => set('status', c.key)}>
            {c.label} <b>{c.key ? searched.filter((l) => l.status === c.key).length : searched.length}</b>
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="m-card">
          <StateBlock kind="empty" title="Lead topilmadi" text={q || status ? 'Qidiruv yoki filtrni o‘zgartiring.' : 'Sizga hali lead biriktirilmagan.'} action={(q || status) && <Button variant="soft" onClick={() => setParams({}, { replace: true })}>Tozalash</Button>} />
        </div>
      ) : (
        list.map((l) => <LeadCard key={l.id} lead={l} mode="status" />)
      )}
    </SellerPage>
  )
}
