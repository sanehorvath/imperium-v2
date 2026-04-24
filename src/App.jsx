import React from 'react'
import { AppProvider, useApp } from './lib/AppContext'
import { ThemeProvider } from './lib/ThemeContext'
import Login from './auth/Login'
import AdminApp from './admin/AdminApp'
import VAApp from './va/VAApp'
import TLApp from './tl/TLApp'
import RecruitForm from './pages/RecruitForm'
import { C } from './lib/design'

function Router() {
  const path = window.location.pathname
  if (path === '/recruter' || path.startsWith('/recruter/')) {
    return <RecruitForm />
  }
  return <AuthRouter />
}

function AuthRouter() {
  const { user, profile, loading } = useApp()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.sub, letterSpacing: '0.2em', marginBottom: 6 }}>AGENCY</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 16 }}>IMPERIUM</div>
          <div style={{ width: 24, height: 24, margin: '0 auto', border: `2px solid ${C.accent}33`, borderTop: `2px solid ${C.accent}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!user || !profile) return <Login />

  switch (profile.role) {
    case 'owner': case 'admin': return <AdminApp />
    case 'tl': return <TLApp />
    case 'va': default: return <VAApp />
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <Router />
      </AppProvider>
    </ThemeProvider>
  )
}
