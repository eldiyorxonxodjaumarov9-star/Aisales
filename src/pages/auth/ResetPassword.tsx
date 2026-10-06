import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, Field, Input, StateBlock } from '../../components/ui'
import { isValidEmail } from '../../lib/format'
import { AuthShell } from './AuthShell'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [phase, setPhase] = useState<'form' | 'sending' | 'done'>('form')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!isValidEmail(email.trim())) return setError('To‘g‘ri email kiriting')
    setError('')
    setPhase('sending')
    setTimeout(() => setPhase('done'), 700)
  }

  return (
    <AuthShell>
      {phase === 'done' ? (
        <StateBlock
          kind="success"
          title="So‘rov qabul qilindi"
          text={`Demo rejim: ${email.trim()} manziliga hech qanday xat yuborilmadi. Haqiqiy tizimda bu yerga tiklash havolasi keladi.`}
          action={
            <div className="stack-sm" style={{ width: '100%' }}>
              <Link to="/login" className="btn btn-primary btn-md btn-block">
                Kirish sahifasiga qaytish
              </Link>
              <Button variant="ghost" onClick={() => setPhase('form')}>
                Boshqa email kiritish
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <h1>Parolni tiklash</h1>
          <p>Email manzilingizni kiriting — tiklash havolasini yuboramiz (demo: xat yuborilmaydi)</p>
          <form className="form-stack" onSubmit={submit} noValidate>
            <Field label="Email" error={error}>
              <Input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            </Field>
            <Button type="submit" size="lg" block disabled={phase === 'sending'}>
              {phase === 'sending' ? 'Yuborilmoqda…' : 'Havolani yuborish'}
            </Button>
            <Link to="/login" className="link-btn" style={{ textAlign: 'center' }}>
              ← Kirish sahifasiga qaytish
            </Link>
          </form>
        </>
      )}
    </AuthShell>
  )
}
