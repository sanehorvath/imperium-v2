import React, { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext'
import { C, st } from '../lib/design'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

// Admin pages
import Overview from './Overview'
import Salaires from './Salaires'
import Reporting from './Reporting'
import GestionEquipe from './GestionEquipe'
import Facturation from './Facturation'
import AdminModeles from './AdminModeles'
import MediaLibrary from './MediaLibrary'
import Formation from './Formation'
import Stories from './Stories'
import AdminCategories from './AdminCategories'
import PaliersConfig from './PaliersConfig'
import Comptes from './Comptes'
import MonProfil from './MonProfil'

const NAV_ADMIN = [
  { section: 'Admin', items: [
    { id: 'overview',    label: 'Vue générale',   icon: '◈' },
    { id: 'salaires',    label: 'Salaires',        icon: '💰' },
    { id: 'reporting',   label: 'Reporting',       icon: '📊' },
    { id: 'facturation', label: 'Facturation',     icon: '◎' },
    { id: 'equipe',      label: 'Gestion Équipe',  icon: '◐' },
    { id: 'paliers',     label: 'Paliers & Taux',  icon: '⊟' },
    { id: 'categories',  label: 'Catégories',      icon: '⊞' },
  ]},
  { section: 'Contenu', items: [
    { id: 'comptes',     label: 'Comptes',         icon: '◉' },
    { id: 'modeles',     label: 'Modèles',         icon: '◆' },
    { id: 'media',       label: 'Médiathèque',     icon: '▦' },
    { id: 'formation',   label: 'Formation',       icon: '▣' },
    { id: 'stories',     label: 'Stories',         icon: '◷' },
  ]},
  { section: 'Mon compte', items: [
    { id: 'mon_profil',  label: 'Mon profil',      icon: '◈' },
  ]},
]

export default function AdminApp() {
  const [page, setPage] = useState('overview')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data } = useApp()

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  function renderPage() {
    if (!data) return <div style={{ padding: 40, color: C.sub, textAlign: 'center' }}>Chargement...</div>

    const props = { data, isAdmin: true }

    switch (page) {
      case 'overview':    return <Overview />
      case 'salaires':    return <Salaires />
      case 'reporting':   return <Reporting />
      case 'facturation': return <Facturation />
      case 'equipe':      return <GestionEquipe />
      case 'paliers':     return <PaliersConfig />
      case 'categories':  return <AdminCategories />
      case 'comptes':     return <Comptes isAdmin={true} />
      case 'modeles':     return <AdminModeles />
      case 'media':       return <MediaLibrary isAdmin={true} />
      case 'formation':   return <Formation isAdmin={true} />
      case 'stories':     return <Stories isAdmin={true} />
      case 'mon_profil':  return <MonProfil />
      default:            return <Overview />
    }
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: C.bg,
      fontFamily: "'DM Sans', sans-serif",
      color: C.text,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 99px; }
        input, textarea, select { background: ${C.surface2}; border: 1px solid ${C.border}; border-radius: 8px; padding: 8px 12px; color: ${C.text}; font-size: 13px; font-family: 'DM Sans', sans-serif; outline: none; }
        input:focus, textarea:focus, select:focus { border-color: ${C.accent}; }
        select { appearance: none; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .hide-mobile { }
        @media(max-width:768px) { .hide-mobile { display: none !important; } }
      `}</style>

      <Sidebar
        nav={NAV_ADMIN}
        page={page}
        setPage={setPage}
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <Topbar page={page} isMobile={isMobile} setSidebarOpen={setSidebarOpen} />
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px 28px' }}>
          {renderPage()}
        </div>
      </div>
    </div>
  )
}
