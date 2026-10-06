import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Badge, Button, Card, DemoTag, Modal, PageHeader } from '../../components/ui'
import { useToast } from '../../components/toast'
import { useDemo } from '../../store/store'
import type { Integration } from '../../store/types'
import { fmtAgo, fmtDateTime } from '../../lib/format'
import { useNow } from '../../lib/useNow'

const ICONS: Record<string, string> = { instagram: 'instagram', facebook: 'facebook', sip: 'phone', telegram: 'telegram', email: 'mail', webhook: 'code' }

export default function Integrations() {
  const { state, actions } = useDemo()
  const navigate = useNavigate()
  const toast = useToast()
  const [manage, setManage] = useState<string | null>(null)
  const [log, setLog] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const dayAgo = useNow() - 86400000
  const recentLeads = state.leads.filter((l) => new Date(l.createdAt).getTime() > dayAgo && (l.source === 'Instagram' || l.source === 'Facebook' || l.source === 'Lead Ads')).length
  const errors = state.syncLog.filter((s) => !s.ok && new Date(s.at).getTime() > dayAgo).length
  const open = (it: Integration) => {
    if (it.id === 'instagram' || it.id === 'facebook') navigate('/admin/integrations/meta')
    else if (it.id === 'sip' && !it.connected) navigate('/admin/settings/telephony')
    else setManage(it.id)
  }
  const current = state.integrations.find((i) => i.id === manage)
  const sync = (id: string) => {
    setSyncing(id)
    setTimeout(() => {
      const n = actions.syncIntegration(id)
      setSyncing(null)
      toast(n ? `${n} ta demo lead qabul qilindi` : 'Sinxronlash yakunlandi (demo)')
    }, 900)
  }

  return (
    <>
      <PageHeader title="Integratsiyalar" subtitle="Meta, telefoniya va xabarlar kanallarini ulang" actions={<DemoTag />} />
      <div className="grid cols-3 mb">
        {state.integrations.map((it) => (
          <Card key={it.id} className="integration-card">
            <div className="row-between">
              <div className="row">
                <span className="int-icon">
                  <Icon name={ICONS[it.id] ?? 'link'} size={20} />
                </span>
                <b style={{ fontSize: 14 }}>{it.name}</b>
              </div>
              <Badge tone={it.connected ? 'green' : 'gray'}>{it.connected ? (it.id === 'webhook' ? 'Faol' : 'Ulangan') : 'Ulanmagan'}</Badge>
            </div>
            <p className="muted">{it.description}</p>
            <p className="small muted">{it.connected && it.lastSync ? `Oxirgi sinxronlash: ${fmtAgo(it.lastSync)}` : 'Sozlash talab qilinadi'}</p>
            <div className="row-between">
              <button className="link-btn" onClick={() => open(it)}>
                {it.connected ? 'Boshqarish →' : 'Sozlash →'}
              </button>
              {it.connected && (
                <Button size="sm" variant="soft" icon="refresh" disabled={syncing === it.id} onClick={() => sync(it.id)}>
                  {syncing === it.id ? 'Sinxronlanmoqda…' : 'Sinxronlash'}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <div className="row-between wrap">
          <div>
            <b style={{ fontSize: 15 }}>Integratsiya holati</b>
            <p className="muted" style={{ marginTop: 4 }}>
              Oxirgi 24 soat: {recentLeads} ta lead qabul qilindi · {errors} ta xato · navbat: {state.calls.filter((c) => c.aiStatus === 'queued').length}
            </p>
          </div>
          <Button variant="secondary" icon="history" onClick={() => setLog(true)}>
            Sinxronlash jurnali
          </Button>
        </div>
      </Card>

      {current && (
        <Modal
          open
          onClose={() => setManage(null)}
          title={current.name}
          width={480}
          footer={
            <>
              <Button variant="secondary" onClick={() => setManage(null)}>
                Yopish
              </Button>
              {current.connected ? (
                <Button
                  variant="danger"
                  onClick={() => {
                    actions.setIntegration(current.id, false)
                    toast(`${current.name} uzildi (demo)`, 'info')
                  }}
                >
                  Ulanishni uzish
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    actions.setIntegration(current.id, true)
                    toast(`${current.name} demo rejimda ulandi`)
                  }}
                >
                  Demo ulash
                </Button>
              )}
            </>
          }
        >
          <div className="stack">
            <div className="row">
              <Badge tone={current.connected ? 'green' : 'gray'}>{current.connected ? 'Ulangan' : 'Ulanmagan'}</Badge>
              <DemoTag />
            </div>
            <p className="muted">{current.description}</p>
            <div className="soft-box small">
              Bu simulyatsiya: tashqi xizmatga so‘rov yuborilmaydi, token yoki kalit so‘ralmaydi. Holat faqat brauzerdagi demo ma’lumotda saqlanadi.
            </div>
            {current.lastSync && <p className="small muted">Oxirgi sinxronlash: {fmtDateTime(current.lastSync)}</p>}
            {current.connected && (
              <Button variant="soft" icon="refresh" disabled={syncing === current.id} onClick={() => sync(current.id)}>
                Hozir sinxronlash
              </Button>
            )}
          </div>
        </Modal>
      )}

      <Modal open={log} onClose={() => setLog(false)} title="Sinxronlash jurnali">
        <ul className="list">
          {state.syncLog.slice(0, 20).map((s) => (
            <li key={s.id} className="list-row">
              <Icon name={s.ok ? 'check' : 'alert'} size={16} className={s.ok ? 'text-green' : 'text-red'} />
              <div className="grow">
                <div className="strong">{s.integration}</div>
                <div className="small muted">{s.message}</div>
              </div>
              <span className="small muted nowrap">{fmtAgo(s.at)}</span>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  )
}
