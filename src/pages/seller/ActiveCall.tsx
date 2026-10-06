import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Button, StateBlock } from '../../components/ui'
import { useDemo } from '../../store/store'
import { useMe } from './useMe'
import { fmtDuration, initials } from '../../lib/format'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']

export default function ActiveCall() {
  const { leadId } = useParams()
  const { state, actions } = useDemo()
  const me = useMe()
  const navigate = useNavigate()
  const lead = state.leads.find((l) => l.id === leadId)
  const [phase, setPhase] = useState<'ringing' | 'live'>('ringing')
  const [sec, setSec] = useState(0)
  const [muted, setMuted] = useState(false)
  const [speaker, setSpeaker] = useState(false)
  const [keypad, setKeypad] = useState(false)
  const [dtmf, setDtmf] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setPhase('live'), 2200)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => {
    if (phase !== 'live') return
    const t = setInterval(() => setSec((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  const hangup = () => {
    if (!lead) return
    const id = actions.createCall(lead.id, me.id, phase === 'live' ? sec : 0)
    navigate(`/seller/result/${id}`, { replace: true })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (keypad && KEYS.includes(e.key)) setDtmf((d) => (d + e.key).slice(-16))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [keypad])

  if (!lead)
    return (
      <div className="seller-shell" style={{ padding: 20 }}>
        <StateBlock kind="error" title="Lead topilmadi" text="Qo‘ng‘iroq uchun lead mavjud emas." action={<Button onClick={() => navigate('/seller/leads')}>Leadlarim</Button>} />
      </div>
    )

  return (
    <main className="call-screen" aria-label="Demo qo‘ng‘iroq">
      <div className="call-screen-top">
        <button className="icon-btn" style={{ color: '#fff' }} aria-label="Qo‘ng‘iroqni tugatish va orqaga" onClick={hangup}>
          <Icon name="chevronLeft" size={22} />
        </button>
        <h1>Qo‘ng‘iroq</h1>
        <span className="demo-tag" style={{ marginLeft: 'auto' }}>Demo</span>
      </div>
      <div className={`call-avatar ${phase === 'ringing' ? 'ringing' : ''}`}>{initials(lead.name)}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{lead.name}</div>
      <div style={{ color: '#b8c6e0', marginTop: 6 }}>{lead.phone}</div>
      <div className="call-timer" aria-live="polite">
        {phase === 'ringing' ? 'Ulanmoqda…' : fmtDuration(sec)}
      </div>
      <div className="small" style={{ color: '#8fa3c7', marginTop: 6 }}>
        {phase === 'ringing' ? 'Simulyatsiya · haqiqiy qo‘ng‘iroq qilinmaydi' : muted ? 'Mikrofon o‘chirilgan' : 'Suhbat davom etmoqda · audio yozilmaydi'}
      </div>

      {keypad ? (
        <>
          <div className="dtmf" aria-live="polite">{dtmf || ' '}</div>
          <div className="keypad" role="group" aria-label="Klaviatura">
            {KEYS.map((k) => (
              <button key={k} onClick={() => setDtmf((d) => (d + k).slice(-16))} aria-label={`Tugma ${k}`}>
                {k}
              </button>
            ))}
          </div>
        </>
      ) : null}

      <div className="call-controls">
        <button className={`call-ctrl ${muted ? 'on' : ''}`} aria-pressed={muted} onClick={() => setMuted((m) => !m)}>
          <span>
            <Icon name={muted ? 'micOff' : 'mic'} size={22} />
          </span>
          {muted ? 'Ovoz o‘chiq' : 'Mikrofon'}
        </button>
        <button className={`call-ctrl ${keypad ? 'on' : ''}`} aria-pressed={keypad} onClick={() => setKeypad((k) => !k)}>
          <span>
            <Icon name="keypad" size={22} />
          </span>
          Klaviatura
        </button>
        <button className={`call-ctrl ${speaker ? 'on' : ''}`} aria-pressed={speaker} onClick={() => setSpeaker((s) => !s)}>
          <span>
            <Icon name="speaker" size={22} />
          </span>
          Dinamik
        </button>
      </div>
      {phase === 'live' && (
        <button className="link-btn" style={{ color: '#8fb0ff', marginTop: 22 }} onClick={() => setSec((s) => s + 60)}>
          Demo: suhbatni +1 daqiqaga tezlatish
        </button>
      )}
      <button className="hangup" aria-label="Qo‘ng‘iroqni yakunlash" onClick={hangup}>
        <Icon name="phoneOff" size={26} />
      </button>
    </main>
  )
}
