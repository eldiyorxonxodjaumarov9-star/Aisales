import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Badge, Button, Card, DemoTag, Field, Input, PageHeader, Select, StateBlock, Toggle } from '../../components/ui'
import { useToast } from '../../components/toast'
import { useDemo } from '../../store/store'
import { fmtTime, isSameDay } from '../../lib/format'
import { useNow } from '../../lib/useNow'

export default function MetaConnection() {
  const { state, actions } = useDemo()
  const navigate = useNavigate()
  const toast = useToast()
  const [f, setF] = useState(state.settings.meta)
  const [check, setCheck] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [syncing, setSyncing] = useState(false)
  const ig = state.integrations.find((i) => i.id === 'instagram')!
  const fb = state.integrations.find((i) => i.id === 'facebook')!
  const anyConnected = ig.connected || fb.connected
  const now = useNow()
  const today = state.leads.filter((l) => isSameDay(l.createdAt, new Date(now)) && ['Instagram', 'Facebook', 'Lead Ads'].includes(l.source)).length
  const lastSync = [ig.lastSync, fb.lastSync].filter(Boolean).sort().pop()
  const dirty = JSON.stringify(f) !== JSON.stringify(state.settings.meta)
  const sellers = state.sellers.filter((s) => s.role === 'seller' && s.status === 'active')

  return (
    <>
      <PageHeader
        back={
          <button className="back-link" onClick={() => navigate('/admin/integrations')}>
            <Icon name="chevronLeft" size={14} /> Integratsiyalar
          </button>
        }
        title="Meta ulanishi"
        subtitle="Facebook / Instagram Lead Ads sozlamalari"
        actions={<DemoTag />}
      />
      <div className="dash-row-3">
        <Card title="Meta Connection">
          <div className="row wrap mb">
            <span className="row" style={{ gap: 8 }}>
              <Toggle checked={ig.connected} label="Instagram ulanishi" onChange={(v) => (actions.setIntegration('instagram', v), toast(`Instagram ${v ? 'ulandi' : 'uzildi'} (demo)`, 'info'))} />
              <Badge tone={ig.connected ? 'green' : 'gray'}>Instagram · {ig.connected ? 'Connected' : 'Disconnected'}</Badge>
            </span>
            <span className="row" style={{ gap: 8 }}>
              <Toggle checked={fb.connected} label="Facebook ulanishi" onChange={(v) => (actions.setIntegration('facebook', v), toast(`Facebook ${v ? 'ulandi' : 'uzildi'} (demo)`, 'info'))} />
              <Badge tone={fb.connected ? 'green' : 'gray'}>Facebook · {fb.connected ? 'Connected' : 'Disconnected'}</Badge>
            </span>
          </div>
          <div className="form-grid">
            <Field label="Business akkaunt">
              <Input value={state.settings.company.name} readOnly />
            </Field>
            <Field label="Facebook sahifasi">
              <Select value={f.page} onChange={(e) => setF({ ...f, page: e.target.value })} options={['SalesAI Demo', 'Demo Company Uz'].map((v) => ({ value: v, label: v }))} />
            </Field>
            <Field label="Instagram akkaunt">
              <Select value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} options={['@salesai_demo', '@democompany_uz'].map((v) => ({ value: v, label: v }))} />
            </Field>
            <Field label="Lead forma">
              <Select value={f.form} onChange={(e) => setF({ ...f, form: e.target.value })} options={['Professional paket — ariza', 'Bepul konsultatsiya', 'Biznes paket — so‘rov'].map((v) => ({ value: v, label: v }))} />
            </Field>
            <Field label="Taqsimlash usuli">
              <Select
                value={f.distribution}
                onChange={(e) => setF({ ...f, distribution: e.target.value as typeof f.distribution })}
                options={[
                  { value: 'auto', label: 'Avtomatik taqsimlash' },
                  { value: 'fixed', label: 'Standart sotuvchiga' },
                  { value: 'manual', label: 'Qo‘lda (biriktirilmagan)' },
                ]}
              />
            </Field>
            <Field label="Standart sotuvchi">
              <Select value={f.defaultSeller} disabled={f.distribution !== 'fixed'} onChange={(e) => setF({ ...f, defaultSeller: e.target.value })} options={sellers.map((s) => ({ value: s.id, label: s.name }))} />
            </Field>
            <Field label="Lead maydonlari" className="span-2">
              <Input value="Ism → ism · telefon → telefon · email → email" readOnly />
            </Field>
          </div>
          {check !== 'idle' && (
            <div style={{ marginTop: 14 }}>
              {check === 'loading' && <StateBlock kind="loading" title="Tekshirilmoqda" text="Demo ulanish holati tekshirilmoqda…" />}
              {check === 'ok' && <div className="soft-box text-green strong">Ulanish holati: sog‘lom (demo tekshiruv)</div>}
              {check === 'error' && (
                <StateBlock kind="error" title="Ulanish xatosi" text="Instagram va Facebook uzilgan. Avval kamida bittasini yoqing." action={<Button variant="soft" onClick={() => setCheck('idle')}>Qayta urinish</Button>} />
              )}
            </div>
          )}
          <div className="form-foot">
            <Button
              variant="secondary"
              disabled={check === 'loading'}
              onClick={() => {
                setCheck('loading')
                setTimeout(() => setCheck(anyConnected ? 'ok' : 'error'), 1000)
              }}
            >
              Ulanishni tekshirish
            </Button>
            <Button
              disabled={!dirty}
              onClick={() => {
                actions.updateSettings('meta', f)
                toast('Meta sozlamalari saqlandi')
              }}
            >
              Saqlash
            </Button>
            {dirty && <span className="dirty-hint">Saqlanmagan o‘zgarishlar bor</span>}
          </div>
        </Card>
        <div className="stack" style={{ gap: 14 }}>
          <Card title="Sinxronlash">
            <div style={{ fontSize: 34, fontWeight: 700, color: 'var(--blue)' }}>{today}</div>
            <p className="muted">Bugun qabul qilingan leadlar</p>
            <p className="small muted" style={{ marginTop: 10 }}>Oxirgi sinxronlash: {lastSync ? fmtTime(lastSync) : '—'}</p>
            <p className={`small strong ${anyConnected ? 'text-green' : 'text-red'}`}>Ulanish holati: {anyConnected ? 'sog‘lom' : 'uzilgan'}</p>
            <Button
              variant="soft"
              block
              icon="refresh"
              style={{ marginTop: 14 }}
              disabled={syncing || !anyConnected}
              onClick={() => {
                setSyncing(true)
                setTimeout(() => {
                  const n = actions.syncIntegration('meta')
                  setSyncing(false)
                  toast(n ? `${n} ta demo lead qabul qilindi va taqsimlandi` : 'Yangi lead yo‘q')
                }, 1000)
              }}
            >
              {syncing ? 'Sinxronlanmoqda…' : 'Qayta sinxronlash'}
            </Button>
          </Card>
          <Card title="Xavfsiz ulanish">
            <p className="muted">Akkaunt Meta orqali ulanadi. Parol ushbu CRM ichida kiritilmaydi. Ruxsat va token holati shu sahifada nazorat qilinadi.</p>
            <p className="small muted" style={{ marginTop: 8 }}>Demo rejimda Meta’ga hech qanday so‘rov yuborilmaydi.</p>
          </Card>
        </div>
      </div>
    </>
  )
}
