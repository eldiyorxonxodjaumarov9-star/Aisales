import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Badge, Button, Card, Input, Modal, PageHeader, Select } from '../../components/ui'
import { useToast } from '../../components/toast'
import { useDemo } from '../../store/store'
import { useDialogs } from '../../dialogs/Dialogs'
import type { FollowUp } from '../../store/types'
import { useNow } from '../../lib/useNow'
import { MONTHS, WEEKDAYS_SHORT, addDays, dayKey, fmtRelativeDay, fmtTime, fromDayKey, startOfDay } from '../../lib/format'

const HOURS = Array.from({ length: 11 }, (_, i) => 8 + i)
const KIND_LABEL: Record<FollowUp['kind'], string> = { followup: 'Follow-up', call: 'Qo‘ng‘iroq', offer: 'Taklif', task: 'Vazifa' }
const KIND_CLASS: Record<FollowUp['kind'], string> = { followup: '', call: 'purple', offer: 'amber', task: 'green' }

function weekStart(d: Date) {
  const x = startOfDay(d)
  const wd = (x.getDay() + 6) % 7
  return addDays(x, -wd)
}

export default function CalendarPage() {
  const { state, actions } = useDemo()
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const toast = useToast()
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()))
  const [seller, setSeller] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const now = useNow()
  const isOverdue = (f: FollowUp) => !f.done && new Date(f.due).getTime() < now
  const start = weekStart(anchor)
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const end = addDays(start, 7)
  const todayKey = dayKey(new Date(now))
  const events = state.followups.filter((f) => (!seller || f.sellerId === seller) && new Date(f.due) >= start && new Date(f.due) < end)
  const leadName = (id: string) => state.leads.find((l) => l.id === id)?.name ?? id
  const sellerName = (id: string) => state.sellers.find((s) => s.id === id)?.name ?? '—'
  const at = (d: Date, h: number) => events.filter((f) => dayKey(f.due) === dayKey(d) && (h === 8 ? new Date(f.due).getHours() <= 8 : h === 18 ? new Date(f.due).getHours() >= 18 : new Date(f.due).getHours() === h)).sort((a, b) => a.due.localeCompare(b.due))
  const label = `${start.getDate()} – ${addDays(start, 6).getDate()} ${MONTHS[addDays(start, 6).getMonth()]} ${addDays(start, 6).getFullYear()}`
  const selectedDay = dayKey(anchor)
  const dayEvents = state.followups.filter((f) => (!seller || f.sellerId === seller) && dayKey(f.due) === selectedDay).sort((a, b) => a.due.localeCompare(b.due))
  const overdueCount = state.followups.filter((f) => isOverdue(f) && (!seller || f.sellerId === seller)).length
  const current = state.followups.find((f) => f.id === openId)
  const cls = (f: FollowUp) => `cal-event ${KIND_CLASS[f.kind]} ${f.done ? 'done' : ''} ${isOverdue(f) ? 'overdue' : ''}`

  return (
    <>
      <PageHeader
        title="Kalendar"
        subtitle="Follow-up va rejalashtirilgan qo‘ng‘iroqlar"
        actions={
          <Button icon="plus" onClick={() => dialogs.followup({ date: selectedDay >= todayKey ? selectedDay : todayKey })}>
            Vazifa qo‘shish
          </Button>
        }
      />
      <Card pad={false}>
        <div className="card-head" style={{ padding: '14px 16px', marginBottom: 0, flexWrap: 'wrap' }}>
          <div>
            <h3 className="card-title">{label}</h3>
            <p className="card-sub">
              Hafta ko‘rinishi · Asia/Tashkent · {events.length} ta vazifa {overdueCount > 0 && <span className="text-red"> · {overdueCount} ta kechikkan</span>}
            </p>
          </div>
          <div className="row wrap">
            <Select aria-label="Sotuvchi" value={seller} onChange={(e) => setSeller(e.target.value)} options={[{ value: '', label: 'Barcha sotuvchilar' }, ...state.sellers.filter((s) => s.role === 'seller').map((s) => ({ value: s.id, label: s.name }))]} />
            <Input type="date" aria-label="Sanaga o‘tish" value={selectedDay} onChange={(e) => e.target.value && setAnchor(fromDayKey(e.target.value))} style={{ width: 150 }} />
            <div className="row" style={{ gap: 4 }}>
              <button className="icon-btn" aria-label="Oldingi hafta" onClick={() => setAnchor(addDays(anchor, -7))}>
                <Icon name="chevronLeft" />
              </button>
              <Button size="sm" variant="secondary" onClick={() => setAnchor(startOfDay(new Date()))}>
                Bugun
              </Button>
              <button className="icon-btn" aria-label="Keyingi hafta" onClick={() => setAnchor(addDays(anchor, 7))}>
                <Icon name="chevronRight" />
              </button>
            </div>
          </div>
        </div>
        <div className="cal-wrap desktop-only">
          <div className="cal" role="grid" aria-label="Haftalik kalendar">
            <div className="cal-head" />
            {days.map((d) => (
              <button key={dayKey(d)} className={`cal-head ${dayKey(d) === todayKey ? 'today' : ''}`} onClick={() => setAnchor(d)} style={{ cursor: 'pointer' }}>
                {WEEKDAYS_SHORT[d.getDay()]}
                <b>{d.getDate()}</b>
              </button>
            ))}
            {HOURS.map((h) => (
              <div key={h} style={{ display: 'contents' }}>
                <div className="cal-hour">{h}:00</div>
                {days.map((d) => {
                  const items = at(d, h)
                  return (
                    <div
                      key={dayKey(d) + h}
                      className={`cal-cell ${dayKey(d) === todayKey ? 'today' : ''}`}
                      role="gridcell"
                      onClick={(e) => {
                        if (e.target !== e.currentTarget) return
                        if (dayKey(d) < todayKey) return toast('O‘tgan kunga vazifa qo‘shib bo‘lmaydi', 'info')
                        dialogs.followup({ date: dayKey(d) })
                      }}
                      title={dayKey(d) >= todayKey ? 'Vazifa qo‘shish uchun bosing' : undefined}
                    >
                      {items.slice(0, 2).map((f) => (
                        <button key={f.id} className={cls(f)} onClick={() => setOpenId(f.id)}>
                          <b>{leadName(f.leadId).split(' ')[0]}</b> <small>{fmtTime(f.due)} · {sellerName(f.sellerId).split(' ')[0]}</small>
                        </button>
                      ))}
                      {items.length > 2 && (
                        <button className="link-btn small" onClick={() => setAnchor(d)}>
                          +{items.length - 2}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="agenda" style={{ padding: '0 14px 14px' }}>
          <div className="chips" style={{ marginBottom: 12 }}>
            {days.map((d) => (
              <button key={dayKey(d)} className={`chip ${dayKey(d) === selectedDay ? 'active' : ''}`} onClick={() => setAnchor(d)}>
                {WEEKDAYS_SHORT[d.getDay()]} {d.getDate()}
              </button>
            ))}
          </div>
          {dayEvents.length === 0 && <p className="muted">Bu kunda vazifa yo‘q.</p>}
          <div className="stack">
            {dayEvents.map((f) => (
              <button key={f.id} className={cls(f)} style={{ whiteSpace: 'normal', padding: 10 }} onClick={() => setOpenId(f.id)}>
                <b>
                  {fmtTime(f.due)} · {leadName(f.leadId)}
                </b>
                <br />
                <small>
                  {KIND_LABEL[f.kind]} · {sellerName(f.sellerId)} · {f.note}
                </small>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {current && (
        <Modal
          open
          onClose={() => setOpenId(null)}
          title={`${KIND_LABEL[current.kind]}: ${leadName(current.leadId)}`}
          width={460}
          footer={
            <>
              <Button variant="secondary" onClick={() => (setOpenId(null), navigate(`/admin/leads/${current.leadId}`))}>
                Leadni ochish
              </Button>
              <Button variant="secondary" onClick={() => (setOpenId(null), dialogs.followup({ followupId: current.id }))}>
                Ko‘chirish
              </Button>
              <Button
                variant={current.done ? 'secondary' : 'success'}
                icon="check"
                onClick={() => {
                  actions.toggleFollowupDone(current.id)
                  toast(current.done ? 'Vazifa qayta ochildi' : 'Vazifa bajarildi')
                }}
              >
                {current.done ? 'Qayta ochish' : 'Bajarildi'}
              </Button>
            </>
          }
        >
          <dl className="info-list" style={{ margin: 0 }}>
            <div>
              <dt>Vaqt</dt>
              <dd>
                {fmtRelativeDay(current.due)} {isOverdue(current) && <Badge tone="red">Kechikkan</Badge>} {current.done && <Badge tone="green">Bajarilgan</Badge>}
              </dd>
            </div>
            <div>
              <dt>Mas’ul sotuvchi</dt>
              <dd>{sellerName(current.sellerId)}</dd>
            </div>
            <div>
              <dt>Eslatma</dt>
              <dd>{current.reminder} daqiqa oldin</dd>
            </div>
            <div>
              <dt>Izoh</dt>
              <dd>{current.note}</dd>
            </div>
          </dl>
        </Modal>
      )}
    </>
  )
}
