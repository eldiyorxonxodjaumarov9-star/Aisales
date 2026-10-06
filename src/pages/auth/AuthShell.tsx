import type { ReactNode } from 'react'
import { Icon, Logo } from '../../components/Icon'

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth-hero">
        <Logo />
        <div>
          <h2>
            Sotuv jarayonini
            <span>AI bilan nazorat qiling</span>
          </h2>
          <p>Leadlar, qo‘ng‘iroqlar, follow-up va sotuvchilar natijasi — bitta panelda.</p>
        </div>
        <ul>
          <li>
            <Icon name="check" size={18} /> Meta leadlari avtomatik CRMga tushadi
          </li>
          <li>
            <Icon name="check" size={18} /> Har qo‘ng‘iroq bo‘yicha AI tahlil va maslahat
          </li>
          <li>
            <Icon name="check" size={18} /> Sotuvchilar KPI va konversiyasi real vaqtda
          </li>
        </ul>
      </aside>
      <main className="auth-side">
        <div className="auth-card">
          <div className="auth-mobile-logo">
            <Logo />
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
