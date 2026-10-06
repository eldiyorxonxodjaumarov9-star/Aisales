import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Avatar, Button, Field, Input } from '../../components/ui'
import { useDemo } from '../../store/store'
import { isValidEmail } from '../../lib/format'
import { AuthShell } from './AuthShell'

export default function Login() {
  const { state, actions } = useDemo()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  if (state.session) return <Navigate to={state.session.role === 'admin' ? '/admin' : '/seller'} replace />

  const enter = (userId: string) => {
    const u = state.sellers.find((s) => s.id === userId)!
    actions.login({ role: u.role, userId: u.id })
    navigate(u.role === 'admin' ? '/admin' : '/seller', { replace: true })
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const err: Record<string, string> = {}
    const em = email.trim().toLowerCase()
    if (!isValidEmail(em)) err.email = 'To‘g‘ri email kiriting'
    if (password.length < 6) err.password = 'Parol kamida 6 ta belgi'
    const user = state.sellers.find((s) => s.email === em)
    if (!err.email && !user) err.email = 'Bunday foydalanuvchi demo ma’lumotlarda yo‘q'
    else if (user?.status === 'blocked') err.email = 'Hisob bloklangan. Administratorga murojaat qiling'
    else if (user?.status === 'invited') err.email = 'Taklif hali qabul qilinmagan — taklif havolasini oching'
    setErrors(err)
    if (Object.keys(err).length || !user) return
    setBusy(true)
    setPassword('')
    setTimeout(() => enter(user.id), 500)
  }

  return (
    <AuthShell>
      <h1>Xush kelibsiz</h1>
      <p>Hisobingizga kiring · demo rejim, parol tekshirilmaydi va saqlanmaydi</p>
      <form className="form-stack" onSubmit={submit} noValidate>
        <Field label="Email" error={errors.email}>
          <Input type="email" autoComplete="username" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Parol" error={errors.password}>
          <div style={{ position: 'relative' }}>
            <Input type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingRight: 64 }} />
            <button type="button" className="link-btn" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }} onClick={() => setShow((s) => !s)} aria-label={show ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}>
              {show ? 'Yashirish' : 'Ko‘rsatish'}
            </button>
          </div>
        </Field>
        <div className="row-between small">
          <span className="muted">admin@example.com yoki aziz@example.com</span>
          <Link to="/reset-password" className="link-btn">
            Parolni unutdingizmi?
          </Link>
        </div>
        <Button type="submit" size="lg" block disabled={busy}>
          {busy ? 'Kirilmoqda…' : 'Kirish'}
        </Button>
      </form>
      <div className="divider">yoki demo rol bilan kiring</div>
      <div className="demo-roles">
        <button type="button" className="demo-role" onClick={() => enter('u-admin')}>
          <Avatar name="Admin" size={32} tone="dark" />
          <span>
            <b>Demo Admin</b>
            <span>To‘liq boshqaruv paneli</span>
          </span>
        </button>
        <button type="button" className="demo-role" onClick={() => enter('s1')}>
          <Avatar name="Aziz Ismoilov" size={32} />
          <span>
            <b>Demo Sotuvchi</b>
            <span>Aziz · mobil kabinet</span>
          </span>
        </button>
      </div>
    </AuthShell>
  )
}
