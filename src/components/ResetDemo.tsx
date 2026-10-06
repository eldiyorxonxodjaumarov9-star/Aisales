import { Button, Modal } from './ui'
import { useToast } from './toast'
import { useDemo } from '../store/store'

export function ResetDemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { actions } = useDemo()
  const toast = useToast()
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Demo ma’lumotlarni tiklash"
      width={460}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button
            variant="danger"
            icon="refresh"
            onClick={() => {
              actions.resetDemo()
              toast('Demo ma’lumotlar boshlang‘ich holatga qaytdi', 'info')
              onClose()
            }}
          >
            Tiklash
          </Button>
        </>
      }
    >
      <p className="muted">Barcha lokal o‘zgarishlar (leadlar, follow-up, sozlamalar, bildirishnomalar) o‘chiriladi va boshlang‘ich demo ma’lumotlar qayta yuklanadi. Joriy sessiya saqlanadi.</p>
    </Modal>
  )
}
