import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, PageHeader, StateBlock } from '../../components/ui'
import { useDemo } from '../../store/store'
import { useDialogs } from '../../dialogs/Dialogs'

export default function SystemStates() {
  const { state } = useDemo()
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const [loading, setLoading] = useState(false)
  const [errorPhase, setErrorPhase] = useState<'error' | 'loading' | 'ok'>('error')
  const queued = state.calls.filter((c) => c.aiStatus === 'queued').length
  const lastLead = state.leads[0]

  return (
    <>
      <PageHeader title="Tizim holatlari" subtitle="Bo‘sh · yuklanish · xato · AI navbati · muvaffaqiyat · ruxsat yo‘q — ilovada ishlatiladigan holatlar" />
      <div className="states-grid">
        <Card>
          <StateBlock kind="empty" title="Hali lead yo‘q" text="Birinchi leadni qo‘shing yoki Meta hisobini ulang." action={<Button icon="plus" onClick={() => dialogs.addLead((id) => navigate(`/admin/leads/${id}`))}>Lead qo‘shish</Button>} />
        </Card>
        <Card>
          {loading ? (
            <StateBlock kind="loading" title="Ma’lumotlar yuklanmoqda" text="Natijalar bir necha soniyada paydo bo‘ladi." action={<span className="small muted">Yuklanmoqda...</span>} />
          ) : (
            <StateBlock
              kind="loading"
              title="Ma’lumotlar yuklanmoqda"
              text="Yuklanish holatini ko‘rish uchun bosing."
              action={
                <Button
                  variant="soft"
                  onClick={() => {
                    setLoading(true)
                    setTimeout(() => setLoading(false), 1600)
                  }}
                >
                  Yuklanishni ko‘rsatish
                </Button>
              }
            />
          )}
        </Card>
        <Card>
          {errorPhase === 'error' && (
            <StateBlock
              kind="error"
              title="Ulanish xatosi"
              text="Ma’lumotlarni olishning imkoni bo‘lmadi."
              action={
                <Button
                  variant="soft"
                  onClick={() => {
                    setErrorPhase('loading')
                    setTimeout(() => setErrorPhase('ok'), 1200)
                  }}
                >
                  Qayta urinish
                </Button>
              }
            />
          )}
          {errorPhase === 'loading' && <StateBlock kind="loading" title="Qayta urinilmoqda" text="Lokal ma’lumot qayta o‘qilmoqda…" />}
          {errorPhase === 'ok' && <StateBlock kind="success" title="Ulanish tiklandi" text="Ma’lumotlar muvaffaqiyatli yuklandi." action={<Button variant="secondary" onClick={() => setErrorPhase('error')}>Xatoni qayta ko‘rsatish</Button>} />}
        </Card>
        <Card>
          <StateBlock kind="queue" title="AI tahlili navbatda" text={`Audio qabul qilindi. Tahlil holati avtomatik yangilanadi. Hozir navbatda: ${queued} ta.`} action={<Button variant="soft" onClick={() => navigate('/admin/calls')}>Navbatni ko‘rish</Button>} />
        </Card>
        <Card>
          <StateBlock kind="success" title="Muvaffaqiyatli saqlandi" text="Leadga follow-up va mas’ul sotuvchi biriktirildi." action={lastLead && <Button variant="soft" onClick={() => navigate(`/admin/leads/${lastLead.id}`)}>Leadni ochish</Button>} />
        </Card>
        <Card>
          <StateBlock kind="denied" title="Ruxsat cheklangan" text="Ushbu bo‘limni faqat administrator boshqaradi." action={<Button variant="soft" onClick={() => navigate('/admin')}>Bosh sahifaga</Button>} />
        </Card>
      </div>
    </>
  )
}
