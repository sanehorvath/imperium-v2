import React from 'react'
import { useApp } from '../lib/AppContext'
import { C, st, ROLE_LABELS } from '../lib/design'
import { Spinner } from './UI'

const TITLES = {
  overview: 'Vue Générale', facturation: 'Facturation', equipe: 'Gestion Équipe',
  paliers: 'Paliers & Taux', categories: 'Catégories', comptes: 'Comptes',
  modeles: 'Modèles', media: 'Médiathèque', formation: 'Formation',
  stories: 'Stories de la Semaine', salaires: 'Salaires', reporting: 'Reporting',
  mon_profil: 'Mon Profil',
  va_accueil: 'Accueil', va_comptes: 'Mes Comptes', va_formation: 'Formation',
  va_media: 'Médiathèque', va_stories: 'Stories', va_modeles: 'Mes Modèles',
  va_paye: 'Ma Facturation', va_infos: 'Infos Personnelles', va_warns: 'Mes Avertissements',
  tl_comptes: 'Comptes', tl_equipe: 'Mon Équipe VA',
}

export default function Topbar({ page, isMobile, setSidebarOpen }) {
  const { profile, syncing, loadData } = useApp()
  const now = new Date()
  const monthLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const roleLabel = ROLE_LABELS[profile?.role] || 'VA'

  return (
    <div style={{
      height: 54,
      borderBottom: `1px solid ${C.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0,
      background: C.surface,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isMobile && (
          <button onClick={() => setSidebarOpen(v => !v)}
            style={{ ...st.btn('ghost', 'sm'), padding: '6px 8px' }}>☰</button>
        )}
        <div style={{ fontWeight: 700, fontSize: 15 }}>{TITLES[page] || 'Dashboard'}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={loadData}
          disabled={syncing}
          style={{
            ...st.btn('ghost', 'sm'),
            display: 'flex', alignItems: 'center', gap: 6,
            opacity: syncing ? 0.6 : 1,
          }}
        >
          {syncing ? <Spinner size={12} /> : <span>↻</span>}
          <span className="hide-mobile">{syncing ? 'Sync...' : 'Sync'}</span>
        </button>
        <span style={st.badge(profile?.role)}>{roleLabel}</span>
        <span className="hide-mobile" style={st.sub}>{monthLabel}</span>
      </div>
    </div>
  )
}
