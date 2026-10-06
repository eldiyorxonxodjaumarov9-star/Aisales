import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Icon, Logo } from '../components/Icon'
import { Avatar, Button, DemoTag, Input, Popover } from '../components/ui'
import { useDemo } from '../store/store'
import { addDays, dayKey, fmtAgo, fmtRange, startOfDay } from '../lib/format'
import { ResetDemoModal } from '../components/ResetDemo'
import { PageLoader } from '../components/PageLoader'
import { useNow } from '../lib/useNow'

const NAV = [
  { to: '/admin', icon: 'dashboard', label: 'Dashboard', end: true },
  { to: '/admin/leads', icon: 'leads', label: 'Leadlar' },
  { to: '/admin/calls', icon: 'phone', label: 'Qo‘ng‘iroqlar' },
  { to: '/admin/sellers', icon: 'user', label: 'Sotuvchilar' },
  { to: '/admin/ai', icon: 'ai', label: 'AI tahlil' },
  { to: '/admin/ads', icon: 'megaphone', label: 'Reklamalar' },
  { to: '/admin/integrations', icon: 'link', label: 'Integratsiyalar' },
  { to: '/admin/reports', icon: 'chart', label: 'Hisobotlar' },
  { to: '/admin/calendar', icon: 'calendar', label: 'Kalendar' },
  { to: '/admin/messages', icon: 'message', label: 'Xabarlar' },
  { to: '/admin/settings', icon: 'settings', label: 'Sozlamalar' },
]

export default function AdminLayout() {
  const { state } = useDemo()
  const [drawer, setDrawer] = useState(false)
  const location = useLocation()
  const unread = state.notifications.filter((n) => !n.read).length
  const [path, setPath] = useState(location.pathname)
  if (path !== location.pathname) {
    setPath(location.pathname)
    setDrawer(false)
  }

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  useEffect(() => {
    if (!drawer) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawer])

  return (
    <div className={`admin-shell ${drawer ? 'drawer-open' : ''}`}>
      <aside className="sidebar" aria-label="Asosiy menyu">
        <div className="row-between">
          <Logo />
          <button className="icon-btn show-mobile" style={{ color: '#fff' }} aria-label="Menyuni yopish" onClick={() => setDrawer(false)}>
            <Icon name="x" />
          </button>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              <Icon name={n.icon} size={17} />
              {n.label}
              {n.to === '/admin/messages' && unread > 0 && <span className="nav-badge">{unread}</span>}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/admin/settings/company" className="side-company">
          <Avatar name={state.settings.company.name.replace(/\s.*/, '')} size={32} tone="dark" />
          <div className="grow">
            <b className="ellipsis">{state.settings.company.name}</b>
            <span>Admin kabineti</span>
          </div>
        </NavLink>
      </aside>
      <div className="drawer-backdrop" onClick={() => setDrawer(false)} />
      <div className="main">
        <Topbar onMenu={() => setDrawer(true)} unread={unread} />
        <main className="content" id="main">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Mobil menyu">
        <NavLink to="/admin" end>
          <Icon name="dashboard" size={20} />
          Bosh
        </NavLink>
        <NavLink to="/admin/leads">
          <Icon name="leads" size={20} />
          Leadlar
        </NavLink>
        <NavLink to="/admin/calls">
          <Icon name="phone" size={20} />
          Qo‘ng‘iroq
        </NavLink>
        <NavLink to="/admin/reports">
          <Icon name="chart" size={20} />
          Statistika
        </NavLink>
        <button type="button" onClick={() => setDrawer(true)}>
          <Icon name="menu" size={20} />
          Menyu
        </button>
      </nav>
    </div>
  )
}

function Topbar({ onMenu, unread }: { onMenu: () => void; unread: number }) {
  const { state, actions } = useDemo()
  const navigate = useNavigate()
  const [resetOpen, setResetOpen] = useState(false)
  const me = state.sellers.find((s) => s.id === state.session?.userId)
  return (
    <header className="topbar">
      <ResetDemoModal open={resetOpen} onClose={() => setResetOpen(false)} />
      <button className="icon-btn menu-btn" aria-label="Menyuni ochish" onClick={onMenu}>
        <Icon name="menu" />
      </button>
      <GlobalSearch />
      <div className="topbar-spacer hide-mobile" />
      <RangePicker />
      <div className="notif-btn-wrap">
        <Popover
          trigger={(_, toggle) => (
            <button className="icon-btn" aria-label={`Bildirishnomalar, ${unread} ta o‘qilmagan`} onClick={toggle}>
              <Icon name="bell" />
              {unread > 0 && <span className="dot-badge">{unread}</span>}
            </button>
          )}
          className="notif-pop"
        >
          {(close) => (
            <>
              <div className="notif-pop-head">
                <b>Bildirishnomalar</b>
                <button className="link-btn" disabled={!unread} onClick={() => actions.markAllRead()}>
                  Barchasini o‘qilgan qilish
                </button>
              </div>
              <div className="notif-pop-list">
                {state.notifications.slice(0, 6).map((n) => (
                  <button
                    key={n.id}
                    className={`notif-item ${n.read ? '' : 'unread'}`}
                    onClick={() => {
                      actions.markNotification(n.id, true)
                      close()
                      if (n.link) navigate(n.link)
                    }}
                  >
                    <span className="notif-dot" />
                    <div className="grow">
                      <b>{n.title}</b>
                      <span>{n.detail}</span>
                      <span className="small"> · {fmtAgo(n.at)}</span>
                    </div>
                  </button>
                ))}
                {!state.notifications.length && <p className="muted small" style={{ padding: 12 }}>Bildirishnoma yo‘q</p>}
              </div>
              <div style={{ padding: '6px 14px 12px' }}>
                <Button
                  variant="soft"
                  size="sm"
                  block
                  onClick={() => {
                    close()
                    navigate('/admin/messages')
                  }}
                >
                  Barchasini ko‘rish
                </Button>
              </div>
            </>
          )}
        </Popover>
      </div>
      <Popover
        trigger={(_, toggle) => (
          <button className="user-btn" onClick={toggle} aria-label="Profil menyusi">
            <Avatar name={me?.name ?? 'Admin'} size={34} />
            <div className="user-meta">
              <b>{me?.name ?? 'Admin'}</b>
              <span>{me?.title ?? 'Boshqaruvchi'}</span>
            </div>
          </button>
        )}
      >
        {(close) => (
          <div className="menu">
            <div style={{ padding: '8px 10px' }} className="row-between">
              <span className="small muted">{me?.email}</span>
              <DemoTag />
            </div>
            <hr />
            <button onClick={() => (close(), navigate('/admin/settings/security'))}>
              <Icon name="shield" size={16} /> Profil va xavfsizlik
            </button>
            <button onClick={() => (close(), navigate('/admin/settings/company'))}>
              <Icon name="settings" size={16} /> Sozlamalar
            </button>
            <button onClick={() => (close(), navigate('/admin/states'))}>
              <Icon name="info" size={16} /> Tizim holatlari
            </button>
            <button
              onClick={() => {
                close()
                setResetOpen(true)
              }}
            >
              <Icon name="refresh" size={16} /> Demo ma’lumotlarni tiklash
            </button>
            <hr />
            <button
              className="danger"
              onClick={() => {
                close()
                actions.logout()
                navigate('/login')
              }}
            >
              <Icon name="logout" size={16} /> Chiqish
            </button>
          </div>
        )}
      </Popover>
    </header>
  )
}

function GlobalSearch() {
  const { state } = useDemo()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [focus, setFocus] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (s.length < 2) return []
    const digits = s.replace(/\D/g, '')
    const leads = state.leads
      .filter((l) => l.name.toLowerCase().includes(s) || l.id.toLowerCase().includes(s) || (digits.length >= 3 && l.phone.replace(/\D/g, '').includes(digits)))
      .slice(0, 5)
      .map((l) => ({ group: 'Leadlar', title: l.name, sub: `${l.phone} · ${l.id}`, to: `/admin/leads/${l.id}` }))
    const sellers = state.sellers
      .filter((x) => x.role === 'seller' && x.name.toLowerCase().includes(s))
      .slice(0, 3)
      .map((x) => ({ group: 'Sotuvchilar', title: x.name, sub: x.email, to: `/admin/sellers/${x.id}` }))
    const leadIds = new Set(state.leads.filter((l) => l.name.toLowerCase().includes(s)).map((l) => l.id))
    const calls = state.calls
      .filter((c) => leadIds.has(c.leadId) && c.aiStatus === 'ready')
      .slice(0, 3)
      .map((c) => ({ group: 'Qo‘ng‘iroqlar', title: state.leads.find((l) => l.id === c.leadId)?.name ?? c.id, sub: `${new Date(c.startedAt).toLocaleDateString('uz-UZ')} · AI tahlil`, to: `/admin/calls/${c.id}` }))
    return [...leads, ...sellers, ...calls]
  }, [q, state.leads, state.sellers, state.calls])

  useEffect(() => {
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const go = (to: string) => {
    navigate(to)
    setOpen(false)
    setQ('')
  }
  return (
    <div className="top-search" ref={ref}>
      <Icon name="search" />
      <Input
        type="search"
        placeholder="Lead, mijoz yoki qo‘ng‘iroq qidirish..."
        aria-label="Global qidiruv"
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
          setFocus(0)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') setFocus((f) => Math.min(results.length - 1, f + 1))
          if (e.key === 'ArrowUp') setFocus((f) => Math.max(0, f - 1))
          if (e.key === 'Enter') {
            if (results[focus]) go(results[focus].to)
            else if (q.trim()) go(`/admin/leads?q=${encodeURIComponent(q.trim())}`)
          }
          if (e.key === 'Escape') setOpen(false)
        }}
      />
      {open && q.trim().length >= 2 && (
        <div className="search-results" role="listbox">
          {results.length === 0 && <p className="muted small" style={{ padding: 10 }}>“{q}” bo‘yicha hech narsa topilmadi</p>}
          {results.map((r, i) => (
            <div key={r.to + i}>
              {(i === 0 || results[i - 1].group !== r.group) && <div className="group">{r.group}</div>}
              <button className={i === focus ? 'focus' : ''} onMouseEnter={() => setFocus(i)} onClick={() => go(r.to)}>
                <Avatar name={r.title} size={28} />
                <div className="grow">
                  <div className="strong ellipsis">{r.title}</div>
                  <div className="small muted ellipsis">{r.sub}</div>
                </div>
              </button>
            </div>
          ))}
          {results.length > 0 && (
            <button onClick={() => go(`/admin/leads?q=${encodeURIComponent(q.trim())}`)}>
              <Icon name="search" size={16} />
              <span className="small text-blue strong">Leadlar ro‘yxatida barchasini ko‘rish</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function RangePicker() {
  const { state, actions } = useDemo()
  const [from, setFrom] = useState(state.range.from)
  const [to, setTo] = useState(state.range.to)
  const [err, setErr] = useState('')
  const now = useNow()
  const today = startOfDay(new Date(now))
  const presets = [
    { label: 'Bugun', from: dayKey(today), to: dayKey(today) },
    { label: 'Oxirgi 7 kun', from: dayKey(addDays(today, -6)), to: dayKey(today) },
    { label: 'Oxirgi 14 kun', from: dayKey(addDays(today, -13)), to: dayKey(today) },
    { label: 'Oxirgi 30 kun', from: dayKey(addDays(today, -29)), to: dayKey(today) },
  ]
  return (
    <Popover
      trigger={(_, toggle) => (
        <button
          className="range-btn"
          onClick={() => {
            setFrom(state.range.from)
            setTo(state.range.to)
            setErr('')
            toggle()
          }}
          aria-label={`Davr: ${fmtRange(state.range.from, state.range.to)}`}
        >
          <Icon name="calendar" size={15} />
          <span className="range-text">{fmtRange(state.range.from, state.range.to)}</span>
        </button>
      )}
      className="range-pop"
    >
      {(close) => (
        <div>
          <div className="range-presets">
            {presets.map((p) => (
              <Button
                key={p.label}
                size="sm"
                variant={state.range.from === p.from && state.range.to === p.to ? 'primary' : 'secondary'}
                onClick={() => {
                  actions.setRange({ from: p.from, to: p.to })
                  close()
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <label className="field">
              <span className="field-label">Boshlanish</span>
              <Input type="date" value={from} max={dayKey(today)} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">Tugash</span>
              <Input type="date" value={to} max={dayKey(today)} onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>
          {err && <p className="field-error" style={{ marginTop: 6 }}>{err}</p>}
          <Button
            block
            size="sm"
            style={{ marginTop: 12 }}
            onClick={() => {
              if (!from || !to || from > to) return setErr('Sana oralig‘i noto‘g‘ri')
              actions.setRange({ from, to })
              close()
            }}
          >
            Qo‘llash
          </Button>
        </div>
      )}
    </Popover>
  )
}
