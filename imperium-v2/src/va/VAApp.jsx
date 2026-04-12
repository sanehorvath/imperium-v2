import React, { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext'
import { C, st } from '../lib/design'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import VAAccueil from './VAAccueil'
import Comptes from '../admin/Comptes'
import Formation from '../admin/Formation'
import MediaLibrary from '../admin/MediaLibrary'
import Stories from '../admin/Stories'
import MonProfil from '../admin/MonProfil'

const NAV_VA = [
  { section: 'Mon espace', items: [
    { id: 'va_accueil',   label: 'Accueil',         icon: '◈' },
    { id: 'va_comptes',   label: 'Mes comptes',      icon: '◉' },
    { id: 'va_formation', label: 'Formation',        icon: '▣' },
    { id: 'va_media',     label: 'Médiathèque',      icon: '▦' },
    { id: 'va_stories',   label: 'Stories semaine',  icon: '◷' },
  ]},
  { section: 'Mon compte', items: [
    { id: 'va_infos',     label: 'Infos perso',      icon: '◈' },
    { id: 'va_warns',     label: 'Mes avertissements', icon: '⚠' },
  ]},
]

export default function VAApp() {
  const [page, setPage] = useState('va_accueil')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile } = useApp()

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  function renderPage() {
    switch (page) {
      case 'va_accueil':   return <VAAccueil />
      case 'va_comptes':   return <Comptes isAdmin={false} />
      case 'va_formation': return <Formation isAdmin={false} />
      case 'va_media':     return <MediaLibrary isAdmin={false} />
      case 'va_stories':   return <Stories isAdmin={false} />
      case 'va_infos':     return <MonProfil />
      case 'va_warns':     return <VAWarns />
      default:             return <VAAccueil />
    }
  }

  return (
    <div style={{
      display: 'flex', height: '100vh',
      background: C.bg, fontFamily: "'DM Sans', sans-serif", color: C.text,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 99px; }
        input, textarea, select { background: ${C.surface2}; border: 1px solid ${C.border}; border-radius: 8px; padding: 8px 12px; color: ${C.text}; font-size: 13px; font-family: 'DM Sans', sans-serif; outline: none; }
        input:focus, textarea:focus, select:focus { border-color: ${C.accent}; }
        select { appearance: none; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .hide-mobile { }
        @media(max-width:768px) { .hide-mobile { display: none !important; } }
      `}</style>

      <Sidebar nav={NAV_VA} page={page} setPage={setPage} isMobile={isMobile} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <Topbar page={page} isMobile={isMobile} setSidebarOpen={setSidebarOpen}/>
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px 28px' }}>
          {renderPage()}
        </div>
      </div>
    </div>
  )
}

function VAWarns() {
  const { data, profile } = useApp()
  const warns = (data?.vaWarns || []).filter(w => w.va_id === profile?.id)
  return (
    <div>
      <div style={{ ...st.card(18) }}>
        <div style={{ ...st.cTitle, marginBottom: 16 }}>Mes avertissements</div>
        {warns.length === 0
          ? <div style={{ color: C.green, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>✓ Aucun avertissement</div>
          : warns.map(w => (
              <div key={w.id} style={{ ...st.card2(14), marginBottom: 8, borderLeft: `3px solid ${w.niveau === 'grave' ? C.red : C.orange}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{w.motif}</span>
                  <span style={{ fontSize: 11, color: C.sub }}>{w.date}</span>
                </div>
                <span style={{ fontSize: 11, color: w.niveau === 'grave' ? C.red : C.orange, fontWeight: 600 }}>
                  {w.niveau === 'grave' ? '⚠ Avertissement grave' : '⚡ Avertissement'}
                </span>
              </div>
            ))
        }
      </div>
    </div>
  )
}
