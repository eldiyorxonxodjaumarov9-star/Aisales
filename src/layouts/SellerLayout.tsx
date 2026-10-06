import { Suspense, useEffect, type ReactNode } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { PageLoader } from '../components/PageLoader'

const TABS = [
  { to: '/seller', icon: 'leads', label: 'Leadlar', match: (p: string) => p === '/seller' || p.startsWith('/seller/leads') || p.startsWith('/seller/followups') },
  { to: '/seller/calls', icon: 'phone', label: 'Qo‘ng‘iroq', match: (p: string) => /^\/seller\/(calls|coach|transcript|result)/.test(p) },
  { to: '/seller/stats', icon: 'chart', label: 'Statistika', match: (p: string) => p.startsWith('/seller/stats') },
  { to: '/seller/profile', icon: 'user', label: 'Profil', match: (p: string) => p.startsWith('/seller/profile') },
]

export default function SellerLayout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return (
    <div className="seller-shell">
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
      <nav className="seller-nav" aria-label="Sotuvchi menyusi">
        {TABS.map((t) => (
          <Link key={t.to} to={t.to} className={t.match(pathname) ? 'active' : ''} aria-current={t.match(pathname) ? 'page' : undefined}>
            <Icon name={t.icon} size={22} />
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}

export function SellerPage({ title, sub, back, action, children }: { title: ReactNode; sub?: ReactNode; back?: string | boolean; action?: ReactNode; children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <>
      <header className="seller-top">
        {back && (
          <button className="icon-btn" aria-label="Orqaga" onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))} style={{ marginLeft: -8 }}>
            <Icon name="chevronLeft" size={22} />
          </button>
        )}
        <div className="grow">
          <h1>{title}</h1>
          {sub && <div className="sub">{sub}</div>}
        </div>
        {action}
      </header>
      <div className="seller-content">{children}</div>
    </>
  )
}
