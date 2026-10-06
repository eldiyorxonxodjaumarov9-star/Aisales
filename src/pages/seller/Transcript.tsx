import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AudioPlayer } from '../../components/AudioPlayer'
import { Badge, Button, StateBlock } from '../../components/ui'
import { SellerPage } from '../../layouts/SellerLayout'
import { useDemo } from '../../store/store'
import { Transcript as TranscriptView } from '../admin/CallAnalysis'
import { fmtDuration } from '../../lib/format'

export default function Transcript() {
  const { callId } = useParams()
  const { state } = useDemo()
  const navigate = useNavigate()
  const [time, setTime] = useState(0)
  const [seek, setSeek] = useState<{ t: number; key: number }>()
  const call = state.calls.find((c) => c.id === callId)
  const lead = state.leads.find((l) => l.id === call?.leadId)
  const seller = state.sellers.find((s) => s.id === call?.sellerId)

  return (
    <SellerPage title="Audio va transkript" sub={call ? `${lead?.name} · ${fmtDuration(call.duration)}` : undefined} back>
      {!call || !call.analysis ? (
        <div className="m-card">
          <StateBlock kind={call?.aiStatus === 'queued' ? 'queue' : 'empty'} title={call?.aiStatus === 'queued' ? 'Transkript tayyorlanmoqda' : 'Transkript mavjud emas'} text="AI tahlili tayyor bo‘lgach transkript shu yerda ko‘rinadi." action={<Button variant="soft" onClick={() => navigate('/seller/calls')}>Qo‘ng‘iroqlar</Button>} />
        </div>
      ) : (
        <div className="m-card">
          <AudioPlayer id={call.id} duration={call.duration} onTime={setTime} seek={seek} />
          <div className="row wrap" style={{ margin: '12px 0 6px', gap: 6 }}>
            <Badge tone="blue">O‘zbekcha</Badge>
            <span className="small muted">Namunaviy audio · demo transkript</span>
          </div>
          <TranscriptView a={call.analysis} time={time} onSeek={(t) => setSeek({ t, key: Date.now() })} sellerName={seller?.name.split(' ')[0] ?? 'Sotuvchi'} />
        </div>
      )}
    </SellerPage>
  )
}
