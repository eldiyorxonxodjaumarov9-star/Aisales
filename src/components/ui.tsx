import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'
import { initials } from '../lib/format'
import { RESULT_META, type Tone } from '../lib/meta'
import { useDemo } from '../store/store'

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft' | 'success'

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  block,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg'; icon?: string; block?: boolean }) {
  return (
    <button type="button" className={`btn btn-${variant} btn-${size} ${block ? 'btn-block' : ''} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} />}
      {children}
    </button>
  )
}

export function IconButton({ icon, label, className = '', badge, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: string; label: string; badge?: number }) {
  return (
    <button type="button" className={`icon-btn ${className}`} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={18} />
      {badge ? <span className="dot-badge">{badge > 9 ? '9+' : badge}</span> : null}
    </button>
  )
}

export function Card({ title, subtitle, action, children, className = '', pad = true }: { title?: ReactNode; subtitle?: ReactNode; action?: ReactNode; children?: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`card ${pad ? '' : 'card-flush'} ${className}`}>
      {(title || action) && (
        <header className="card-head">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-sub">{subtitle}</p>}
          </div>
          {action && <div className="card-action">{action}</div>}
        </header>
      )}
      {children}
    </section>
  )
}

export type { Tone }

export function Badge({ tone = 'blue', children, className = '' }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={`badge badge-${tone} ${className}`}>{children}</span>
}

export function StatusBadge({ status }: { status: string }) {
  const { state } = useDemo()
  const st = state.statuses.find((s) => s.key === status)
  return <Badge tone={st?.color ?? 'gray'}>{st?.label ?? status}</Badge>
}

export function ResultBadge({ result }: { result: string }) {
  const m = RESULT_META[result] ?? { label: result, tone: 'gray' as Tone }
  return <Badge tone={m.tone}>{m.label}</Badge>
}

export function Avatar({ name, size = 36, tone = 'blue' }: { name: string; size?: number; tone?: 'blue' | 'purple' | 'green' | 'dark' }) {
  return (
    <span className={`avatar avatar-${tone}`} style={{ width: size, height: size, fontSize: Math.max(10, size * 0.32) }} aria-hidden="true">
      {initials(name)}
    </span>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 560,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.classList.add('modal-open')
    const t = setTimeout(() => {
      const el = ref.current?.querySelector<HTMLElement>('input:not([type=hidden]),select,textarea,button:not(.modal-x)')
      el?.focus()
    }, 30)
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('modal-open')
      prev?.focus?.()
    }
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} style={{ maxWidth: width }} ref={ref}>
        <header className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn modal-x" aria-label="Yopish" onClick={onClose}>
            <Icon name="x" />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}

export function Field({ label, error, hint, children, className = '' }: { label: string; error?: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={`field ${error ? 'has-error' : ''} ${className}`}>
      <span className="field-label">{label}</span>
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`input ${props.className ?? ''}`} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={`input textarea ${props.className ?? ''}`} />
}

export function Select({ options, className = '', ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  return (
    <span className={`select-wrap ${className}`}>
      <select {...rest} className="input select">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="chevronDown" size={16} className="select-chev" />
    </span>
  )
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} className={`toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
      <span className="toggle-knob" />
    </button>
  )
}

export function Segmented<T extends string>({ value, onChange, options, className = '' }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string }) {
  return (
    <div className={`segmented ${className}`} role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} className={value === o.value ? 'active' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Pagination({ page, total, perPage, onChange, label }: { page: number; total: number; perPage: number; onChange: (p: number) => void; label?: string }) {
  const pages = Math.max(1, Math.ceil(total / perPage))
  const list: (number | '…')[] = []
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) list.push(p)
    else if (list[list.length - 1] !== '…') list.push('…')
  }
  return (
    <div className="pagination">
      <span className="muted small">{label ?? `${total} ta natija`}</span>
      <div className="pager">
        <button type="button" aria-label="Oldingi sahifa" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <Icon name="chevronLeft" size={14} />
        </button>
        {list.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="pager-gap">…</span>
          ) : (
            <button type="button" key={p} className={p === page ? 'active' : ''} aria-current={p === page ? 'page' : undefined} onClick={() => onChange(p)}>
              {p}
            </button>
          ),
        )}
        <button type="button" aria-label="Keyingi sahifa" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          <Icon name="chevronRight" size={14} />
        </button>
      </div>
    </div>
  )
}

export function StateBlock({
  kind,
  title,
  text,
  action,
}: {
  kind: 'empty' | 'loading' | 'error' | 'queue' | 'success' | 'denied'
  title: string
  text: string
  action?: ReactNode
}) {
  const icon = { empty: 'leads', loading: 'refresh', error: 'alert', queue: 'clock', success: 'check', denied: 'lock' }[kind]
  return (
    <div className={`state-block state-${kind}`}>
      <span className="state-icon">{kind === 'loading' ? <span className="spinner" /> : <Icon name={icon} size={26} />}</span>
      <h4>{title}</h4>
      <p>{text}</p>
      {action}
    </div>
  )
}

export function Progress({ value, tone = 'blue', height = 6 }: { value: number; tone?: Tone; height?: number }) {
  return (
    <div className="progress" style={{ height }} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <span className={`progress-bar bg-${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function Popover({ trigger, children, align = 'right', className = '' }: { trigger: (open: boolean, toggle: () => void) => ReactNode; children: (close: () => void) => ReactNode; align?: 'left' | 'right'; className?: string }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const pop = useRef<HTMLDivElement>(null)
  const close = () => setOpen(false)
  const toggle = () => {
    setPos(null)
    setOpen((o) => !o)
  }

  useEffect(() => {
    if (!open) return
    const place = () => {
      const anchor = ref.current?.getBoundingClientRect()
      const el = pop.current
      if (!anchor || !el) return
      const w = el.offsetWidth
      const h = el.offsetHeight
      const vw = window.innerWidth
      const vh = window.innerHeight
      let left = align === 'right' ? anchor.right - w : anchor.left
      left = Math.max(8, Math.min(left, vw - w - 8))
      let top = anchor.bottom + 6
      if (top + h > vh - 8 && anchor.top - h - 6 > 8) top = anchor.top - h - 6
      setPos({ top, left })
    }
    place()
    const raf = requestAnimationFrame(place)
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!ref.current?.contains(t) && !pop.current?.contains(t)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onScroll = (e: Event) => {
      if (pop.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open, align])

  return (
    <div className="popover-wrap" ref={ref}>
      {trigger(open, toggle)}
      {open &&
        createPortal(
          <div ref={pop} className={`popover ${className}`} style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999, visibility: pos ? 'visible' : 'hidden' }}>
            {children(close)}
          </div>,
          document.body,
        )}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions, back }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; back?: ReactNode }) {
  return (
    <div className="page-head">
      <div className="page-head-text">
        {back}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}

export function KpiCard({ label, value, delta, invert, spark, onClick }: { label: string; value: ReactNode; delta?: number; invert?: boolean; spark?: number[]; onClick?: () => void }) {
  const good = delta === undefined ? true : invert ? delta <= 0 : delta >= 0
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag type={onClick ? 'button' : undefined} className={`kpi card ${onClick ? 'clickable' : ''}`} onClick={onClick}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
      {delta !== undefined && (
        <span className={`kpi-delta ${good ? 'up' : 'down'}`}>
          {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
        </span>
      )}
      {spark && <Sparkline data={spark} color={good ? '#13AC80' : '#E84C61'} />}
    </Tag>
  )
}

export function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(1, ...data)
  const min = Math.min(...data)
  const pts = data.map((v, i) => `${(i / Math.max(1, data.length - 1)) * 60},${22 - ((v - min) / Math.max(1, max - min)) * 20}`)
  return (
    <svg className="kpi-spark" width="62" height="26" viewBox="-1 -1 62 26" aria-hidden="true">
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function DemoTag() {
  return <span className="demo-tag" title="Lokal demo — tashqi xizmatga ulanmagan">Demo</span>
}
