import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from './Icon'
import { sampleAudioUrl } from '../lib/audio'
import { fmtDuration } from '../lib/format'
import { hashString } from '../store/analysis'

const SPEEDS = [1, 1.25, 1.5, 2, 0.75]

export function AudioPlayer({ id, duration, onTime, seek }: { id: string; duration: number; onTime?: (t: number) => void; seek?: { t: number; key: number } }) {
  const audio = useRef<HTMLAudioElement>(null)
  const url = useRef<string | null>(null)
  const handledSeek = useRef<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [speed, setSpeed] = useState(1)
  const bars = useMemo(() => {
    const out: number[] = []
    for (let i = 0, h = hashString(id); i < 64; i++) {
      h = (h * 1103515245 + 12345) >>> 0
      out.push(25 + (h % 75))
    }
    return out
  }, [id])

  const prepare = useCallback(
    (a: HTMLAudioElement) => {
      if (a.src) return
      url.current ??= sampleAudioUrl(duration)
      a.src = url.current
    },
    [duration],
  )

  useEffect(() => {
    if (!seek || handledSeek.current === seek.key) return
    handledSeek.current = seek.key
    const a = audio.current
    if (!a) return
    prepare(a)
    const go = () => {
      a.currentTime = Math.min(seek.t, duration - 0.5)
      setTime(a.currentTime)
      a.play().catch(() => {})
    }
    if (a.readyState >= 1) go()
    else a.addEventListener('loadedmetadata', go, { once: true })
  }, [seek, duration, prepare])

  useEffect(() => {
    const a = audio.current
    if (!a) return
    a.defaultPlaybackRate = speed
    a.playbackRate = speed
  }, [speed])

  const toggle = () => {
    const a = audio.current
    if (!a) return
    prepare(a)
    if (a.paused) a.play().catch(() => {})
    else a.pause()
  }
  const seekTo = (ratio: number) => {
    const a = audio.current
    if (!a) return
    const t = Math.max(0, Math.min(duration, ratio * duration))
    prepare(a)
    const go = () => {
      a.currentTime = t
      setTime(t)
      onTime?.(t)
    }
    if (a.readyState >= 1) go()
    else a.addEventListener('loadedmetadata', go, { once: true })
  }
  const pct = duration ? time / duration : 0

  return (
    <div className="player">
      <audio
        ref={audio}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime
          setTime(t)
          onTime?.(t)
        }}
      />
      <button className="play-btn" onClick={toggle} aria-label={playing ? 'Pauza' : 'Ijro etish'}>
        <Icon name={playing ? 'pause' : 'play'} size={18} />
      </button>
      <div
        className="wave"
        role="slider"
        tabIndex={0}
        aria-label="Audio pozitsiyasi"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(time)}
        aria-valuetext={`${fmtDuration(time)} / ${fmtDuration(duration)}`}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          seekTo((e.clientX - r.left) / r.width)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') seekTo((time + 5) / duration)
          if (e.key === 'ArrowLeft') seekTo((time - 5) / duration)
          if (e.key === ' ') {
            e.preventDefault()
            toggle()
          }
        }}
      >
        {bars.map((b, i) => (
          <span key={i} className={i / bars.length <= pct ? 'on' : ''} style={{ height: `${b}%` }} />
        ))}
      </div>
      <div className="player-meta">
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {fmtDuration(time)} / {fmtDuration(duration)}
        </span>
        <button className="speed-btn" onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])} aria-label={`Tezlik ${speed}x, o‘zgartirish`}>
          {speed}×
        </button>
      </div>
    </div>
  )
}
