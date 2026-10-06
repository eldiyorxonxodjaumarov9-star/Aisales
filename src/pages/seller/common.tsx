import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Avatar, Badge, StatusBadge } from '../../components/ui'
import { tempOf } from '../../lib/meta'
import type { Lead } from '../../store/types'

export function LeadCard({ lead, mode = 'temp' }: { lead: Lead; mode?: 'temp' | 'status' }) {
  const navigate = useNavigate()
  const t = tempOf(lead.score)
  return (
    <div className="lead-card">
      <button className="row" style={{ flex: 1, minWidth: 0, border: 0, background: 'none', padding: 0, textAlign: 'left' }} onClick={() => navigate(`/seller/leads/${lead.id}`)}>
        <Avatar name={lead.name} size={40} />
        <div className="grow" style={{ minWidth: 0 }}>
          <b className="ellipsis">{lead.name}</b>
          <span className="ellipsis">
            {lead.source} · {lead.product}
          </span>
          <div>{mode === 'temp' ? <Badge tone={t.tone}>{t.label}</Badge> : <StatusBadge status={lead.status} />}</div>
        </div>
      </button>
      <button className="call-fab" aria-label={`${lead.name}ga qo‘ng‘iroq qilish`} onClick={() => navigate(`/seller/call/${lead.id}`)}>
        <Icon name="phone" size={20} />
      </button>
    </div>
  )
}
