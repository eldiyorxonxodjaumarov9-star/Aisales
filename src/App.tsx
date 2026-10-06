import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useDemo } from './store/store'
import { DemoProvider } from './store/DemoProvider'
import { ToastProvider } from './components/ToastProvider'
import { DialogsProvider } from './dialogs/DialogsProvider'
import { Button, StateBlock } from './components/ui'
import { PageLoader } from './components/PageLoader'
import AdminLayout from './layouts/AdminLayout'
import SellerLayout from './layouts/SellerLayout'

const Login = lazy(() => import('./pages/auth/Login'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))
const Invite = lazy(() => import('./pages/auth/Invite'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const Leads = lazy(() => import('./pages/admin/Leads'))
const LeadDetail = lazy(() => import('./pages/admin/LeadDetail'))
const Calls = lazy(() => import('./pages/admin/Calls'))
const CallAnalysis = lazy(() => import('./pages/admin/CallAnalysis'))
const Sellers = lazy(() => import('./pages/admin/Sellers'))
const SellerProfile = lazy(() => import('./pages/admin/SellerProfile'))
const AiAnalytics = lazy(() => import('./pages/admin/AiAnalytics'))
const Ads = lazy(() => import('./pages/admin/Ads'))
const Integrations = lazy(() => import('./pages/admin/Integrations'))
const MetaConnection = lazy(() => import('./pages/admin/MetaConnection'))
const Reports = lazy(() => import('./pages/admin/Reports'))
const CalendarPage = lazy(() => import('./pages/admin/Calendar'))
const Messages = lazy(() => import('./pages/admin/Messages'))
const SettingsPage = lazy(() => import('./pages/admin/Settings'))
const SystemStates = lazy(() => import('./pages/admin/SystemStates'))
const SellerHome = lazy(() => import('./pages/seller/Home'))
const SellerLeads = lazy(() => import('./pages/seller/LeadList'))
const SellerLeadDetail = lazy(() => import('./pages/seller/LeadDetail'))
const ActiveCall = lazy(() => import('./pages/seller/ActiveCall'))
const CallResult = lazy(() => import('./pages/seller/CallResult'))
const FollowupForm = lazy(() => import('./pages/seller/FollowupForm'))
const AiCoach = lazy(() => import('./pages/seller/AiCoach'))
const FollowupList = lazy(() => import('./pages/seller/FollowupList'))
const CallHistory = lazy(() => import('./pages/seller/CallHistory'))
const Statistics = lazy(() => import('./pages/seller/Statistics'))
const Profile = lazy(() => import('./pages/seller/Profile'))
const Transcript = lazy(() => import('./pages/seller/Transcript'))

function Denied({ home }: { home: string }) {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div className="card" style={{ maxWidth: 420, width: '100%' }}>
        <StateBlock kind="denied" title="Ruxsat cheklangan" text="Ushbu bo‘limni faqat administrator boshqaradi." action={<Button onClick={() => navigate(home)}>Bosh sahifaga</Button>} />
      </div>
    </div>
  )
}

function Guard({ role, children }: { role: 'admin' | 'seller'; children: ReactNode }) {
  const { state } = useDemo()
  const s = state.session
  if (!s || !state.sellers.some((u) => u.id === s.userId)) return <Navigate to="/login" replace />
  if (s.role !== role) return <Denied home={s.role === 'admin' ? '/admin' : '/seller'} />
  return <>{children}</>
}

function Home() {
  const { state } = useDemo()
  if (!state.session) return <Navigate to="/login" replace />
  return <Navigate to={state.session.role === 'admin' ? '/admin' : '/seller'} replace />
}

export default function App() {
  return (
    <DemoProvider>
      <ToastProvider>
        <BrowserRouter>
          <DialogsProvider>
            <Suspense fallback={<PageLoader full />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/invite" element={<Invite />} />
                <Route
                  path="/admin"
                  element={
                    <Guard role="admin">
                      <AdminLayout />
                    </Guard>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="leads" element={<Leads />} />
                  <Route path="leads/:id" element={<LeadDetail />} />
                  <Route path="calls" element={<Calls />} />
                  <Route path="calls/:id" element={<CallAnalysis />} />
                  <Route path="sellers" element={<Sellers />} />
                  <Route path="sellers/:id" element={<SellerProfile />} />
                  <Route path="ai" element={<AiAnalytics />} />
                  <Route path="ads" element={<Ads />} />
                  <Route path="integrations" element={<Integrations />} />
                  <Route path="integrations/meta" element={<MetaConnection />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="messages" element={<Messages />} />
                  <Route path="settings" element={<Navigate to="/admin/settings/company" replace />} />
                  <Route path="settings/:section" element={<SettingsPage />} />
                  <Route path="states" element={<SystemStates />} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Route>
                <Route
                  path="/seller"
                  element={
                    <Guard role="seller">
                      <SellerLayout />
                    </Guard>
                  }
                >
                  <Route index element={<SellerHome />} />
                  <Route path="leads" element={<SellerLeads />} />
                  <Route path="leads/:id" element={<SellerLeadDetail />} />
                  <Route path="result/:callId" element={<CallResult />} />
                  <Route path="followups" element={<FollowupList />} />
                  <Route path="followups/new" element={<FollowupForm />} />
                  <Route path="followups/:fid" element={<FollowupForm />} />
                  <Route path="coach/:callId" element={<AiCoach />} />
                  <Route path="calls" element={<CallHistory />} />
                  <Route path="transcript/:callId" element={<Transcript />} />
                  <Route path="stats" element={<Statistics />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="*" element={<Navigate to="/seller" replace />} />
                </Route>
                <Route
                  path="/seller/call/:leadId"
                  element={
                    <Guard role="seller">
                      <ActiveCall />
                    </Guard>
                  }
                />
                <Route path="*" element={<Home />} />
              </Routes>
            </Suspense>
          </DialogsProvider>
        </BrowserRouter>
      </ToastProvider>
    </DemoProvider>
  )
}
