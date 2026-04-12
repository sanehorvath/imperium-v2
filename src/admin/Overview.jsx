import React from 'react'
import { useApp } from '../lib/AppContext'
import { calculateModelMarge } from '../lib/supabase'
import { C, st } from '../lib/design'
import { StatCard, EmptyState } from '../components/UI'

export default function Overview() {
  const { data } = useApp()
  if (!data) return null

  const { models, modelRevenue, profiles, paliers, vaClicks, invoices } = data
  const vas = profiles.filter(p => p.role === 'va')
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const vaClicksThisMonth = vaClicks.filter(c => c.date?.startsWith(currentMonth))

  // Totaux globaux
  const latestRevByModel = Object.fromEntries(models.map(m => {
    const revs = modelRevenue.filter(r => r.model_id === m.id).sort((a, b) => b.date?.localeCompare(a.date))
    return [m.id, revs[0] || null]
  }))

  const totalCA = Object.values(latestRevByModel).reduce((a, r) => a + (r?.ca || 0), 0)
  const totalFans = Object.values(latestRevByModel).reduce((a, r) => a + (r?.nouveaux_fans || 0), 0)

  const marges = models.map(m => calculateModelMarge(m, latestRevByModel[m.id], vas, paliers, vaClicksThisMonth)).filter(Boolean)
  const totalNet = marges.reduce((a, mg) => a + mg.net, 0)
  const totalCharges = marges.reduce((a, mg) => a + mg.coutChatting + mg.coutVA, 0)

  const enRetard = invoices.filter(i => i.statut === 'en_retard')
  const facturesOuvertes = invoices.filter(i => i.statut !== 'payé')

  const noData = totalCA === 0

  return (
    <div>
      {/* KPIs */}
      <div style={{ ...st.g4, marginBottom: 20 }}>
        <StatCard label="CA Total" value={noData ? '—' : `$${totalCA.toLocaleString()}`} sub="tous modèles" color={C.accent} icon="💵"/>
        <StatCard label="Nouveaux fans" value={noData ? '—' : totalFans.toLocaleString()} sub="ce mois" color={C.blue} icon="👥"/>
        <StatCard label="Net agence" value={noData ? '—' : `$${Math.round(totalNet).toLocaleString()}`} sub="après charges" color={totalNet > 0 ? C.green : C.red} icon="📈"/>
        <StatCard label="Factures ouvertes" value={facturesOuvertes.length} sub={`${enRetard.length} en retard`} color={enRetard.length > 0 ? C.red : C.accent} icon="📋"/>
      </div>

      {/* Alerte factures en retard */}
      {enRetard.length > 0 && (
        <div style={{ background: C.redDim, border: `1px solid ${C.red}44`, borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 16 }}>⚠</span>
          <span style={{ fontSize: 13, color: C.red, fontWeight: 600 }}>
            {enRetard.length} facture{enRetard.length > 1 ? 's' : ''} en retard — {enRetard.map(i => i.libelle).join(', ')}
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Performance modèles */}
        <div style={st.card(18)}>
          <div style={st.cTitle}>Performance modèles</div>
          {models.length === 0
            ? <EmptyState icon="📊" title="Aucun modèle" sub="Ajoute des modèles dans l'onglet Modèles"/>
            : models.map((m, i) => {
                const rev = latestRevByModel[m.id]
                const mg = marges.find(mg => mg.caBrut === (rev?.ca || 0))
                return (
                  <div key={m.id} style={{
                    display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 0.8fr',
                    alignItems: 'center', padding: '10px 0',
                    borderBottom: i < models.length - 1 ? `1px solid ${C.border}` : 'none',
                    gap: 8,
                  }}>
                    <div style={st.row}>
                      <div style={st.avatar(m.color || C.accent)}>{(m.name || '?')[0].toUpperCase()}</div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: rev ? C.accent : C.muted, fontSize: 13 }}>
                      {rev ? `$${(rev.ca || 0).toLocaleString()}` : '—'}
                    </span>
                    <span style={{ color: C.sub, fontSize: 12 }}>
                      {rev ? `+${rev.nouveaux_fans || 0} fans` : '—'}
                    </span>
                    <span style={{ color: mg ? (mg.marge > 0 ? C.green : C.red) : C.muted, fontSize: 12, fontWeight: 600 }}>
                      {mg ? `${mg.marge}%` : '—'}
                    </span>
                  </div>
                )
              })
          }
        </div>

        {/* VAs actifs */}
        <div style={st.card(18)}>
          <div style={st.cTitle}>Activité VAs ce mois</div>
          {vas.length === 0
            ? <EmptyState icon="👤" title="Aucun VA" sub="Ajoute des VAs dans Gestion Équipe"/>
            : vas.map((va, i) => {
                const clics = vaClicksThisMonth.filter(c => c.va_id === va.id).reduce((a, c) => a + (c.clics || 0), 0)
                const payInfo = calculateModelMarge ? null : null
                return (
                  <div key={va.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 0',
                    borderBottom: i < vas.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}>
                    <div style={st.avatar(C.blue)}>{(va.name || '?')[0].toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{va.name}</div>
                      <div style={st.sub}>{clics.toLocaleString()} clics</div>
                    </div>
                    <div style={{ fontWeight: 700, color: C.accent, fontSize: 13 }}>
                      {va.pay_type === 'pct' ? `${va.pay_pct}%` : va.pay_type?.replace('palier_', 'Sys. ')?.toUpperCase()}
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>
    </div>
  )
}
