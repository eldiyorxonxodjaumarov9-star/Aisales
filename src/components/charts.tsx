import { useState } from 'react'
import { fmtNum, fmtShortDay, fromDayKey } from '../lib/format'

export interface Series {
  label: string
  color: string
  data: number[]
}

export function LineChart({ days, series, height = 220 }: { days: string[]; series: Series[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 560
  const H = height
  const padL = 34
  const padB = 26
  const padT = 10
  const max = Math.max(4, ...series.flatMap((s) => s.data))
  const step = Math.ceil(max / 4)
  const top = step * 4
  const x = (i: number) => padL + (i / Math.max(1, days.length - 1)) * (W - padL - 12)
  const y = (v: number) => padT + (1 - v / top) * (H - padT - padB)
  const labelEvery = Math.ceil(days.length / 8)
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="img" aria-label="Dinamika grafigi" onMouseLeave={() => setHover(null)}>
        {[0, 1, 2, 3, 4].map((k) => (
          <g key={k}>
            <line x1={padL} x2={W - 8} y1={y(k * step)} y2={y(k * step)} stroke="#E5EBF4" />
            <text x={padL - 8} y={y(k * step) + 4} textAnchor="end" className="chart-tick">
              {k * step}
            </text>
          </g>
        ))}
        {days.map((d, i) =>
          i % labelEvery === 0 || i === days.length - 1 ? (
            <text key={d} x={x(i)} y={H - 6} textAnchor="middle" className="chart-tick">
              {fmtShortDay(fromDayKey(d))}
            </text>
          ) : null,
        )}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB} stroke="#C2CDDF" strokeDasharray="3 3" />}
        {series.map((s) => (
          <g key={s.label}>
            <polyline fill="none" stroke={s.color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" points={s.data.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
            {s.data.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 4.5 : 3} fill={s.color} stroke="#fff" strokeWidth="1.5" />
            ))}
          </g>
        ))}
        {days.map((d, i) => (
          <rect key={d} x={x(i) - (W - padL) / days.length / 2} y={0} width={(W - padL) / days.length} height={H - padB} fill="transparent" onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} />
        ))}
      </svg>
      {hover !== null && (
        <div className="chart-tip" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <strong>{fmtShortDay(fromDayKey(days[hover]))}</strong>
          {series.map((s) => (
            <span key={s.label}>
              <i style={{ background: s.color }} /> {s.label}: {s.data[hover]}
            </span>
          ))}
        </div>
      )}
      <Legend items={series.map((s) => ({ label: s.label, color: s.color }))} />
    </div>
  )
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="legend">
      {items.map((i) => (
        <span key={i.label}>
          <i style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  )
}

export function Donut({ items, center, sub, size = 150, onSelect }: { items: { label: string; value: number; color: string }[]; center: string; sub: string; size?: number; onSelect?: (label: string) => void }) {
  const total = items.reduce((a, i) => a + i.value, 0)
  const r = 52
  const c = 2 * Math.PI * r
  let acc = 0
  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox="0 0 140 140" role="img" aria-label={`${sub}: ${center}`}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#EDF2FF" strokeWidth="18" />
        {total > 0 &&
          items.map((i) => {
            const len = (i.value / total) * c
            const el = (
              <circle
                key={i.label}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={i.color}
                strokeWidth="18"
                strokeDasharray={`${Math.max(0, len - 1.5)} ${c}`}
                strokeDashoffset={-acc}
                transform="rotate(-90 70 70)"
                className={onSelect ? 'donut-seg' : ''}
                onClick={() => onSelect?.(i.label)}
              >
                <title>{`${i.label}: ${i.value}`}</title>
              </circle>
            )
            acc += len
            return el
          })}
        <text x="70" y="70" textAnchor="middle" className="donut-center">
          {center}
        </text>
        <text x="70" y="88" textAnchor="middle" className="donut-sub">
          {sub}
        </text>
      </svg>
      <ul className="donut-legend">
        {items.map((i) => (
          <li key={i.label}>
            <button type="button" disabled={!onSelect} onClick={() => onSelect?.(i.label)}>
              <i style={{ background: i.color }} />
              <span>{i.label}</span>
              <b>{total ? Math.round((i.value / total) * 100) : 0}%</b>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Funnel({ steps, onSelect }: { steps: { label: string; value: number; pct: number; color: string }[]; onSelect?: (i: number) => void }) {
  return (
    <div className="funnel">
      {steps.map((s, i) => (
        <button type="button" key={s.label} className="funnel-step" onClick={() => onSelect?.(i)} disabled={!onSelect}>
          <span className="funnel-shape" style={{ background: s.color, color: s.label === 'Taklif' ? '#17243B' : '#fff' }}>
            <b>{fmtNum(s.value)}</b>
            <small>{s.label}</small>
          </span>
          <span className="funnel-pct">{s.pct.toFixed(1)}%</span>
        </button>
      ))}
    </div>
  )
}

export function BarList({ items, max }: { items: { label: string; value: number; color?: string; suffix?: string }[]; max?: number }) {
  const m = max ?? Math.max(1, ...items.map((i) => i.value))
  return (
    <ul className="barlist">
      {items.map((i) => (
        <li key={i.label}>
          <div className="barlist-row">
            <span>{i.label}</span>
            <b>
              {i.value}
              {i.suffix ?? ''}
            </b>
          </div>
          <div className="progress" style={{ height: 7 }}>
            <span className="progress-bar" style={{ width: `${(i.value / m) * 100}%`, background: i.color ?? '#245CFF' }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
