import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Field, Input, StateBlock } from '../../components/ui'
import { useDemo } from '../../store/store'
import { isValidEmail } from '../../lib/format'
import { AuthShell } from './AuthShell'

export default function Invite() {
  const [params] = useSearchParams()
  const { state, actions } = useDemo()
  const navigate = useNavigate()
  const [name, setName] = useState(params.get('name') ?? '')
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [again, setAgain] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const invited = state.sellers.find((s) => s.email === email.trim().toLowerCase())
  const company = state.settings.company.name

  if (!params.get('email'))
    return (
      <AuthShell>
        <StateBlock kind="error" title="Taklif havolasi noto‘g‘ri" text="Havola to‘liq emas yoki muddati o‘tgan. Administratordan yangi taklif so‘rang." action={<Link to="/login" className="btn btn-primary btn-md">Kirish sahifasi</Link>} />
      </AuthShell>
    )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const err: Record<string, string> = {}
    if (name.trim().length < 3) err.name = 'Ism familiyani kiriting'
    if (!isValidEmail(email.trim())) err.email = 'Email noto‘g‘ri'
    if (invited?.status === 'blocked') err.email = 'Bu hisob bloklangan'
    if (password.length < 8) err.password = 'Kamida 8 ta belgi'
    if (again !== password) err.again = 'Parollar mos emas'
    setErrors(err)
    if (Object.keys(err).length) return
    const session = actions.acceptInvite({ name, email })
    setPassword('')
    setAgain('')
    navigate(session.role === 'admin' ? '/admin' : '/seller', { replace: true })
  }

  return (
    <AuthShell>
      <h1>Jamoaga qo‘shiling</h1>
      <p>
        {company} sizni SalesAI’ga sotuvchi sifatida taklif qildi. Demo: parol saqlanmaydi.
      </p>
      <form className="form-stack" onSubmit={submit} noValidate>
        <Field label="Ism familiya" error={errors.name}>
          <Input value={name} autoComplete="name" onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input type="email" value={email} readOnly={!!params.get('email')} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Parol yarating" error={errors.password}>
          <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Parolni takrorlang" error={errors.again}>
          <Input type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
        </Field>
        <Button type="submit" size="lg" block>
          Taklifni qabul qilish
        </Button>
        <Link to="/login" className="link-btn" style={{ textAlign: 'center' }}>
          Hisobim bor — kirish
        </Link>
      </form>
    </AuthShell>
  )
}
