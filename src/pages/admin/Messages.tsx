import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Button, Card, PageHeader, Segmented, StateBlock } from '../../components/ui'
import { useToast } from '../../components/toast'
import { useDemo } from '../../store/store'
import { fmtAgo } from '../../lib/format'

const KIND_ICON: Record<string, { icon: string; cls: string }> = {
  warning: { icon: 'clock', cls: 'badge-red' },
  lead: { icon: 'leads', cls: 'badge-blue' },
  ai: { icon: 'sparkle', cls: 'badge-purple' },
  sale: { icon: 'check', cls: 'badge-green' },
  integration: { icon: 'link', cls: 'badge-amber' },
  goal: { icon: 'target', cls: 'badge-cyan' },
}

export default function Messages() {
  const { state, actions } = useDemo()
  const navigate = useNavigate()
  const toast = useToast()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const unread = state.notifications.filter((n) => !n.read).length
  const list = state.notifications.filter((n) => filter === 'all' || !n.read)

  return (
    <>
      <PageHeader title="Xabarlar" subtitle="Bildirishnomalar va jamoa faoliyati" />
      <Card pad={false}>
        <div className="card-head" style={{ padding: '14px 16px', marginBottom: 0, flexWrap: 'wrap' }}>
          <div className="row wrap">
            <h3 className="card-title">Barcha bildirishnomalar</h3>
            <Segmented
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: `Barchasi ${state.notifications.length}` },
                { value: 'unread', label: `O‘qilmagan ${unread}` },
              ]}
            />
          </div>
          <Button
            variant="soft"
            size="sm"
            icon="check"
            disabled={!unread}
            onClick={() => {
              actions.markAllRead()
              toast('Barcha bildirishnomalar o‘qildi')
            }}
          >
            Barchasini o‘qilgan qilish
          </Button>
        </div>
        {list.length === 0 ? (
          <StateBlock kind="success" title="Hammasi o‘qilgan" text="Yangi bildirishnoma kelganda shu yerda ko‘rinadi." />
        ) : (
          <ul className="list" style={{ padding: '0 8px 8px' }}>
            {list.map((n) => {
              const k = KIND_ICON[n.kind] ?? KIND_ICON.lead
              return (
                <li key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`} style={{ alignItems: 'center' }}>
                  <span className={`badge ${k.cls}`} style={{ width: 36, height: 36, padding: 0, justifyContent: 'center', borderRadius: 10 }}>
                    <Icon name={k.icon} size={17} />
                  </span>
                  <button
                    className="grow"
                    style={{ border: 0, background: 'none', textAlign: 'left', padding: 0 }}
                    onClick={() => {
                      actions.markNotification(n.id, true)
                      if (n.link) navigate(n.link)
                    }}
                  >
                    <b>{n.title}</b>
                    <span>{n.detail}</span>
                  </button>
                  <span className="small muted nowrap hide-mobile">{fmtAgo(n.at)}</span>
                  <span className="notif-dot" style={{ marginTop: 0 }} />
                  <button className="icon-btn sm" title={n.read ? 'O‘qilmagan deb belgilash' : 'O‘qilgan deb belgilash'} aria-label={n.read ? `${n.title}: o‘qilmagan deb belgilash` : `${n.title}: o‘qilgan deb belgilash`} onClick={() => actions.markNotification(n.id, !n.read)}>
                    <Icon name={n.read ? 'mail' : 'check'} size={15} />
                  </button>
                  <button className="icon-btn sm" aria-label={`${n.title}: o‘chirish`} onClick={() => (actions.deleteNotification(n.id), toast('Bildirishnoma o‘chirildi', 'info'))}>
                    <Icon name="trash" size={15} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </>
  )
}
