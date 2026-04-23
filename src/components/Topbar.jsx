import React from 'react'
import { useApp } from '../lib/AppContext'
import { useTheme } from '../lib/ThemeContext'
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
  const { mode, toggle, isDark } = useTheme()
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
        <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{TITLES[page] || 'Dashboard'}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Sync button */}
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

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggle}
          title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
          style={{
            ...st.btn('ghost', 'sm'),
            padding: '5px 10px',
            fontSize: 15,
            border: `1px solid ${C.border}`,
          }}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        <span style={st.badge(profile?.role)}>{roleLabel}</span>
        <span className="hide-mobile" style={{ ...st.sub, color: C.sub }}>{monthLabel}</span>
      </div>
    </div>
  )
}
