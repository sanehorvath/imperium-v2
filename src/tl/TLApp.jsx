import React, { useState, useEffect } from 'react'
import { useTheme } from '../lib/ThemeContext'
import { C, st } from '../lib/design'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import Comptes from '../admin/Comptes'
import MediaLibrary from '../admin/MediaLibrary'
import Stories from '../admin/Stories'
import MonProfil from '../admin/MonProfil'

const NAV_TL = [
  { section: 'Mon équipe', items: [
    { id: 'tl_comptes', label: 'Comptes',       icon: '◉' },
    { id: 'media',      label: 'Médiathèque',   icon: '▦' },
    { id: 'stories',    label: 'Stories',       icon: '◷' },
  ]},
  { section: 'Mon compte', items: [
    { id: 'mon_profil', label: 'Mon profil',    icon: '◈' },
  ]},
]

export default function TLApp() {
  const [page, setPage] = useState('tl_comptes')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { mode } = useTheme()

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  function renderPage() {
    switch (page) {
      case 'tl_comptes': return <Comptes isAdmin={false} isTL={true}/>
      case 'media':      return <MediaLibrary isAdmin={false}/>
      case 'stories':    return <Stories isAdmin={false}/>
      case 'mon_profil': return <MonProfil/>
      default:           return <Comptes isAdmin={false} isTL={true}/>
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, fontFamily: "'DM Sans', sans-serif", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 99px; }
        input, textarea, select { background: ${C.surface2} !important; border: 1px solid ${C.border} !important; border-radius: 8px; padding: 8px 12px; color: ${C.text} !important; font-size: 13px; font-family: 'DM Sans', sans-serif; outline: none; }
        input:focus, textarea:focus, select:focus { border-color: ${C.accent} !important; }
        select { appearance: none; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <Sidebar nav={NAV_TL} page={page} setPage={setPage} isMobile={isMobile} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <Topbar page={page} isMobile={isMobile} setSidebarOpen={setSidebarOpen}/>
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px 28px', background: C.bg }}>
          {renderPage()}
        </div>
      </div>
    </div>
  )
}
