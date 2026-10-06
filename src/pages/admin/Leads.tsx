import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Avatar, Badge, Button, Card, PageHeader, Pagination, Popover, Segmented, Select, StateBlock, StatusBadge } from '../../components/ui'
import { tempOf } from '../../lib/meta'
import { useToast } from '../../components/toast'
import { useDemo } from '../../store/store'
import { useDialogs } from '../../dialogs/Dialogs'
import { SOURCES } from '../../store/seed'
import { STATUS_HEX } from '../../store/metrics'
import type { Lead } from '../../store/types'
import { fmtNum, fmtRelativeDay, fmtTime } from '../../lib/format'

const PER_PAGE = 8
type SortKey = 'createdAt' | 'name' | 'score'

export function ScoreCell({ score }: { score: number }) {
  const color = score >= 80 ? '#13AC80' : score >= 60 ? '#F6B755' : '#E84C61'
  return (
    <span className="score">
      {score}
      <span className="score-bar">
        <span style={{ width: `${score}%`, background: color }} />
      </span>
    </span>
  )
}

export function StatusPicker({ lead, compact }: { lead: Lead; compact?: boolean }) {
  const { state, actions } = useDemo()
  const toast = useToast()
  const dialogs = useDialogs()
  return (
    <Popover
      align="left"
      trigger={(_, toggle) => (
        <button
          type="button"
          className="th-sort"
          onClick={(e) => {
            e.stopPropagation()
            toggle()
          }}
          aria-label={`Statusni o‘zgartirish: ${lead.name}`}
        >
          <StatusBadge status={lead.status} />
          {!compact && <Icon name="chevronDown" size={13} className="muted" />}
        </button>
      )}
    >
      {(close) => (
        <div className="menu" onClick={(e) => e.stopPropagation()}>
          {state.statuses.map((s) => (
            <button
              key={s.key}
              onClick={() => {
                close()
                if (s.key === lead.status) return
                if (s.key === 'won') {
                  dialogs.sale(lead.id)
                  return
                }
                actions.setLeadStatus(lead.id, s.key)
                toast(`${lead.name}: ${s.label}`)
              }}
            >
              <span className="status-swatch" style={{ background: STATUS_HEX[s.color] }} />
              {s.label}
              {s.key === lead.status && <Icon name="check" size={14} className="text-blue" style={{ marginLeft: 'auto' }} />}
            </button>
          ))}
        </div>
      )}
    </Popover>
  )
}

export default function Leads() {
  const { state } = useDemo()
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const [params, setParams] = useSearchParams()
  const [selected, setSelected] = useState<string[]>([])
  const q = params.get('q') ?? ''
  const source = params.get('source') ?? ''
  const status = params.get('status') ?? ''
  const seller = params.get('seller') ?? ''
  const campaign = params.get('campaign') ?? ''
  const view = (params.get('view') as 'table' | 'kanban') ?? 'table'
  const sort = (params.get('sort') as SortKey) ?? 'createdAt'
  const dir = params.get('dir') === 'asc' ? 'asc' : 'desc'
  const page = Number(params.get('page') ?? 1)

  const setParam = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    if (!('page' in patch)) next.delete('page')
    setParams(next, { replace: true })
  }

  const base = useMemo(() => {
    const s = q.trim().toLowerCase()
    const digits = s.replace(/\D/g, '')
    return state.leads.filter(
      (l) =>
        (!s || l.name.toLowerCase().includes(s) || l.id.toLowerCase().includes(s) || (digits.length >= 3 && l.phone.replace(/\D/g, '').includes(digits))) &&
        (!source || l.source === source) &&
        (!campaign || l.campaignId === campaign) &&
        (!seller || (seller === 'none' ? !l.sellerId : l.sellerId === seller)),
    )
  }, [state.leads, q, source, seller, campaign])

  const filtered = useMemo(() => {
    const list = base.filter((l) => !status || l.status === status)
    const m = dir === 'asc' ? 1 : -1
    return [...list].sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : sort === 'score' ? a.score - b.score : a.createdAt.localeCompare(b.createdAt)) * m)
  }, [base, status, sort, dir])

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const cur = Math.min(page, pages)
  const pageItems = filtered.slice((cur - 1) * PER_PAGE, cur * PER_PAGE)
  const sellerName = (id: string | null) => state.sellers.find((s) => s.id === id)?.name.split(' ')[0] ?? '—'
  const anyFilter = !!(q || source || status || seller || campaign)
  const tabs = [{ key: '', label: 'Barchasi' }, ...state.statuses.filter((s) => ['new', 'contacted', 'interested', 'followup'].includes(s.key)).map((s) => ({ key: s.key, label: s.label }))]
  if (status && !tabs.some((t) => t.key === status)) tabs.push({ key: status, label: state.statuses.find((s) => s.key === status)?.label ?? status })

  const toggleSort = (k: SortKey) => setParam({ sort: k, dir: sort === k && dir === 'desc' ? 'asc' : 'desc' })
  const sortIcon = (k: SortKey) => (sort === k ? <Icon name={dir === 'asc' ? 'chevronUp' : 'chevronDown'} size={12} /> : null)
  const allOnPage = pageItems.length > 0 && pageItems.every((l) => selected.includes(l.id))

  return (
    <>
      <PageHeader
        title={view === 'kanban' ? 'Leadlar — Kanban' : 'Leadlar'}
        subtitle={view === 'kanban' ? 'Bosqichlar bo‘yicha kuzatish · jadval / kanban' : 'Leadlarni filtrlash, taqsimlash va sotuv bosqichlarini boshqarish'}
        actions={
          <>
            <Segmented
              value={view}
              onChange={(v) => setParam({ view: v === 'table' ? '' : v })}
              options={[
                { value: 'table', label: <span className="row" style={{ gap: 6 }}><Icon name="table" size={14} />Jadval</span> },
                { value: 'kanban', label: <span className="row" style={{ gap: 6 }}><Icon name="kanban" size={14} />Kanban</span> },
              ]}
            />
            <Button variant="secondary" icon="download" onClick={() => dialogs.exportData({ dataset: 'leads', leadIds: filtered.map((l) => l.id) })}>
              Eksport
            </Button>
            <Button icon="plus" onClick={() => dialogs.addLead()}>
              Lead qo‘shish
            </Button>
          </>
        }
      />

      <div className="toolbar">
        <label className="input-icon">
          <Icon name="search" size={16} />
          <input className="input" type="search" placeholder="Mijozni qidirish..." aria-label="Mijozni qidirish" value={q} onChange={(e) => setParam({ q: e.target.value })} />
        </label>
        <Select className="half" aria-label="Manba" value={source} onChange={(e) => setParam({ source: e.target.value })} options={[{ value: '', label: 'Barcha manbalar' }, ...SOURCES.map((s) => ({ value: s, label: s }))]} />
        <Select className="half" aria-label="Status" value={status} onChange={(e) => setParam({ status: e.target.value })} options={[{ value: '', label: 'Barcha statuslar' }, ...state.statuses.map((s) => ({ value: s.key, label: s.label }))]} />
        <Select
          aria-label="Sotuvchi"
          value={seller}
          onChange={(e) => setParam({ seller: e.target.value })}
          options={[{ value: '', label: 'Barcha sotuvchilar' }, { value: 'none', label: 'Biriktirilmagan' }, ...state.sellers.filter((s) => s.role === 'seller').map((s) => ({ value: s.id, label: s.name }))]}
        />
        {campaign && (
          <Badge tone="purple">
            {state.campaigns.find((c) => c.id === campaign)?.name}
            <button className="icon-btn sm" aria-label="Kampaniya filtrini olib tashlash" onClick={() => setParam({ campaign: '' })}>
              <Icon name="x" size={12} />
            </button>
          </Badge>
        )}
        {anyFilter && (
          <Button variant="ghost" size="sm" onClick={() => setParams(view === 'kanban' ? { view } : {}, { replace: true })}>
            Filtrlarni tozalash
          </Button>
        )}
      </div>

      {view === 'kanban' ? (
        <Kanban leads={filtered} />
      ) : (
        <>
          <div className="chips mb" role="tablist" aria-label="Status bo‘yicha">
            {tabs.map((t) => (
              <button key={t.key || 'all'} role="tab" aria-selected={status === t.key} className={`chip ${status === t.key ? 'active' : ''}`} onClick={() => setParam({ status: t.key })}>
                {t.label} <b>{fmtNum(t.key ? base.filter((l) => l.status === t.key).length : base.length)}</b>
              </button>
            ))}
          </div>
          <Card title="Barcha leadlar" pad={false} subtitle={`${filtered.length} ta natija`}>
            {filtered.length === 0 ? (
              <StateBlock
                kind="empty"
                title={anyFilter ? 'Natija topilmadi' : 'Hali lead yo‘q'}
                text={anyFilter ? 'Filtr yoki qidiruv shartlarini o‘zgartiring.' : 'Birinchi leadni qo‘shing yoki Meta hisobini ulang.'}
                action={
                  anyFilter ? (
                    <Button variant="soft" onClick={() => setParams({}, { replace: true })}>
                      Filtrlarni tozalash
                    </Button>
                  ) : (
                    <Button icon="plus" onClick={() => dialogs.addLead()}>
                      Lead qo‘shish
                    </Button>
                  )
                }
              />
            ) : (
              <>
                <div className="table-wrap hide-mobile">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: 36 }}>
                          <input
                            type="checkbox"
                            aria-label="Sahifadagi barcha leadlarni tanlash"
                            checked={allOnPage}
                            onChange={() => setSelected(allOnPage ? selected.filter((id) => !pageItems.some((l) => l.id === id)) : [...new Set([...selected, ...pageItems.map((l) => l.id)])])}
                          />
                        </th>
                        <th>
                          <button className={`th-sort ${sort === 'name' ? 'active' : ''}`} onClick={() => toggleSort('name')}>
                            Mijoz {sortIcon('name')}
                          </button>
                        </th>
                        <th>Telefon</th>
                        <th>Manba</th>
                        <th>Sotuvchi</th>
                        <th>Status</th>
                        <th>
                          <button className={`th-sort ${sort === 'score' ? 'active' : ''}`} onClick={() => toggleSort('score')}>
                            AI ball {sortIcon('score')}
                          </button>
                        </th>
                        <th>
                          <button className={`th-sort ${sort === 'createdAt' ? 'active' : ''}`} onClick={() => toggleSort('createdAt')}>
                            Qo‘shilgan {sortIcon('createdAt')}
                          </button>
                        </th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((l) => (
                        <tr key={l.id} className={`row-link ${selected.includes(l.id) ? 'selected' : ''}`} onClick={() => navigate(`/admin/leads/${l.id}`)}>
                          <td onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" aria-label={`${l.name}ni tanlash`} checked={selected.includes(l.id)} onChange={() => setSelected((s) => (s.includes(l.id) ? s.filter((x) => x !== l.id) : [...s, l.id]))} />
                          </td>
                          <td>
                            <div className="person">
                              <Avatar name={l.name} size={30} />
                              <span className="person-name">{l.name}</span>
                            </div>
                          </td>
                          <td>{l.phone}</td>
                          <td>{l.source}</td>
                          <td>{l.sellerId ? sellerName(l.sellerId) : <span className="muted">Biriktirilmagan</span>}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <StatusPicker lead={l} />
                          </td>
                          <td>
                            <ScoreCell score={l.score} />
                          </td>
                          <td className="muted">{fmtRelativeDay(l.createdAt)}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <RowMenu lead={l} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="list show-mobile" style={{ padding: '0 12px' }}>
                  {pageItems.map((l) => (
                    <li key={l.id} className="list-row" style={{ alignItems: 'flex-start' }}>
                      <input type="checkbox" style={{ marginTop: 10 }} aria-label={`${l.name}ni tanlash`} checked={selected.includes(l.id)} onChange={() => setSelected((s) => (s.includes(l.id) ? s.filter((x) => x !== l.id) : [...s, l.id]))} />
                      <button className="grow" style={{ border: 0, background: 'none', textAlign: 'left', padding: 0 }} onClick={() => navigate(`/admin/leads/${l.id}`)}>
                        <div className="strong">{l.name}</div>
                        <div className="small muted">
                          {l.phone} · {l.source} · {sellerName(l.sellerId)}
                        </div>
                        <div className="row" style={{ marginTop: 6 }}>
                          <Badge tone={tempOf(l.score).tone}>AI {l.score}</Badge>
                        </div>
                      </button>
                      <div className="stack-sm" style={{ alignItems: 'flex-end' }}>
                        <StatusPicker lead={l} compact />
                        <RowMenu lead={l} />
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {selected.length > 0 && (
              <div className="bulk-bar">
                <b>{selected.length} ta tanlandi</b>
                <Button size="sm" icon="user" onClick={() => dialogs.assign(selected, () => setSelected([]))}>
                  Sotuvchiga biriktirish
                </Button>
                <Button size="sm" variant="secondary" icon="download" onClick={() => dialogs.exportData({ dataset: 'leads', leadIds: selected })}>
                  Eksport
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
                  Bekor qilish
                </Button>
              </div>
            )}
            {filtered.length > 0 && <Pagination page={cur} total={filtered.length} perPage={PER_PAGE} onChange={(p) => setParam({ page: String(p) })} label={`${filtered.length} ta natija · ${cur}/${pages} sahifa`} />}
          </Card>
        </>
      )}
    </>
  )
}

function RowMenu({ lead }: { lead: Lead }) {
  const navigate = useNavigate()
  const dialogs = useDialogs()
  return (
    <Popover
      trigger={(_, toggle) => (
        <button className="icon-btn sm" aria-label={`${lead.name} amallari`} onClick={toggle}>
          <Icon name="more" size={18} />
        </button>
      )}
    >
      {(close) => (
        <div className="menu">
          <button onClick={() => (close(), navigate(`/admin/leads/${lead.id}`))}>
            <Icon name="eye" size={16} /> Ochish
          </button>
          <button onClick={() => (close(), dialogs.editLead(lead))}>
            <Icon name="edit" size={16} /> Tahrirlash
          </button>
          <button onClick={() => (close(), dialogs.assign([lead.id]))}>
            <Icon name="user" size={16} /> Sotuvchiga biriktirish
          </button>
          <button onClick={() => (close(), dialogs.followup({ leadId: lead.id }))}>
            <Icon name="calendar" size={16} /> Follow-up qo‘yish
          </button>
          {lead.status !== 'won' && (
            <button onClick={() => (close(), dialogs.sale(lead.id))}>
              <Icon name="check" size={16} /> Sotuvni yakunlash
            </button>
          )}
        </div>
      )}
    </Popover>
  )
}

function Kanban({ leads }: { leads: Lead[] }) {
  const { state, actions } = useDemo()
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const toast = useToast()
  const [dragId, setDragId] = useState<string | null>(null)
  const [over, setOver] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const nextFu = (leadId: string) => state.followups.filter((f) => f.leadId === leadId && !f.done).sort((a, b) => a.due.localeCompare(b.due))[0]
  const sellerName = (id: string | null) => state.sellers.find((s) => s.id === id)?.name.split(' ')[0] ?? 'Biriktirilmagan'
  const move = (lead: Lead, to: string) => {
    if (lead.status === to) return
    if (to === 'won') {
      dialogs.sale(lead.id)
      return
    }
    actions.setLeadStatus(lead.id, to)
    toast(`${lead.name} → ${state.statuses.find((s) => s.key === to)?.label}`)
  }
  return (
    <div className="kanban" aria-label="Kanban doskasi">
      {state.statuses.map((st, si) => {
        const items = leads.filter((l) => l.status === st.key)
        const shown = expanded[st.key] ? items : items.slice(0, 6)
        return (
          <section
            key={st.key}
            className={`kanban-col ${over === st.key ? 'drop' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(st.key)
            }}
            onDragLeave={() => setOver((o) => (o === st.key ? null : o))}
            onDrop={(e) => {
              e.preventDefault()
              const id = e.dataTransfer.getData('text/plain') || dragId
              const lead = state.leads.find((l) => l.id === id)
              if (lead) move(lead, st.key)
              setOver(null)
              setDragId(null)
            }}
            aria-label={`${st.label} ustuni`}
          >
            <header className="kanban-head">
              <span>
                <span className="bar" style={{ background: STATUS_HEX[st.color] }} />
                {st.label}
              </span>
              <span className="count">{items.length}</span>
            </header>
            <div className="kanban-cards">
              {shown.map((l) => {
                const fu = nextFu(l.id)
                return (
                  <article
                    key={l.id}
                    className={`kcard ${dragId === l.id ? 'dragging' : ''}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', l.id)
                      e.dataTransfer.effectAllowed = 'move'
                      setDragId(l.id)
                    }}
                    onDragEnd={() => {
                      setDragId(null)
                      setOver(null)
                    }}
                  >
                    <button className="kcard-title" style={{ border: 0, background: 'none', padding: 0, textAlign: 'left' }} onClick={() => navigate(`/admin/leads/${l.id}`)}>
                      {l.name}
                    </button>
                    <span className="kcard-meta">
                      {l.source} · {l.product.replace(' paket', '')}
                    </span>
                    <span className="kcard-meta">AI ball: <b className={l.score >= 80 ? 'text-green' : l.score >= 60 ? 'text-amber' : 'text-red'}>{l.score}</b></span>
                    <div className="kcard-foot">
                      <span className="kcard-meta ellipsis">
                        {sellerName(l.sellerId)}
                        {fu ? ` · ${fmtRelativeDay(fu.due).replace(/, .*/, '')} ${fmtTime(fu.due)}` : ''}
                      </span>
                      <span className="kcard-move">
                        <button className="icon-btn sm" disabled={si === 0} aria-label={`${l.name}: oldingi bosqich`} onClick={() => move(l, state.statuses[si - 1].key)}>
                          <Icon name="chevronLeft" size={14} />
                        </button>
                        <button className="icon-btn sm" disabled={si === state.statuses.length - 1} aria-label={`${l.name}: keyingi bosqich`} onClick={() => move(l, state.statuses[si + 1].key)}>
                          <Icon name="chevronRight" size={14} />
                        </button>
                      </span>
                    </div>
                  </article>
                )
              })}
              {items.length > 6 && (
                <button className="kanban-more" onClick={() => setExpanded((x) => ({ ...x, [st.key]: !x[st.key] }))}>
                  {expanded[st.key] ? 'Kamroq ko‘rsatish' : `Yana ${items.length - 6} ta`}
                </button>
              )}
              {items.length === 0 && <p className="muted small" style={{ textAlign: 'center', padding: 16 }}>Bu yerga sudrab tashlang</p>}
            </div>
          </section>
        )
      })}
    </div>
  )
}
