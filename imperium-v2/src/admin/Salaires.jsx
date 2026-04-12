import React, { useMemo } from 'react'
import { useApp } from '../lib/AppContext'
import { calculateVAPay, calculateModelMarge } from '../lib/supabase'
import { C, st } from '../lib/design'
import { StatCard, EmptyState, Badge } from '../components/UI'

export default function Salaires() {
  const { data } = useApp()
  if (!data) return null

  const { models, modelRevenue, profiles, paliers, vaClicks, payroll } = data
  const vas = profiles.filter(p => p.role === 'va' || p.role === 'tl')
  const admins = profiles.filter(p => p.role === 'admin' || p.role === 'owner')

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const vaClicksThisMonth = vaClicks.filter(c => c.date?.startsWith(currentMonth))

  // Latest revenue per model
  const latestRevByModel = useMemo(() => Object.fromEntries(models.map(m => {
    const revs = modelRevenue.filter(r => r.model_id === m.id).sort((a, b) => b.date?.localeCompare(a.date))
    return [m.id, revs[0] || null]
  })), [models, modelRevenue])

  const totalCA = Object.values(latestRevByModel).reduce((a, r) => a + (r?.ca || 0), 0)

  // Calcul paie VAs
  const vaPays = useMemo(() => vas.map(va => {
    const pay = calculateVAPay(va, paliers, vaClicksThisMonth)
    let montant = 0
    if (pay.type === 'pct') {
      // % du CA des modèles assignés
      const assignedModelIds = Array.isArray(va.model_ids) ? va.model_ids : []
      const caAssigned = assignedModelIds.reduce((a, mid) => a + (latestRevByModel[mid]?.ca || 0), 0)
      montant = caAssigned * (va.pay_pct / 100)
    } else {
      montant = pay.montant || 0
    }
    return { va, pay, montant }
  }), [vas, paliers, vaClicksThisMonth, latestRevByModel])

  const totalVAPay = vaPays.reduce((a, v) => a + v.montant, 0)

  // Calcul paie modèles et chatting
  const modelBreakdowns = useMemo(() => models.map(m => {
    const rev = latestRevByModel[m.id]
    const mg = calculateModelMarge(m, rev, vas, paliers, vaClicksThisMonth)
    return { model: m, rev, mg }
  }), [models, latestRevByModel, vas, paliers, vaClicksThisMonth])

  const totalChatting = modelBreakdowns.reduce((a, { mg }) => a + (mg?.coutChatting || 0), 0)
  const totalSplitModele = modelBreakdowns.reduce((a, { mg }) => a + (mg ? mg.caBrut - mg.caAgence : 0), 0)
  const totalAdminPay = admins.reduce((a, adm) => a + Math.round(totalCA * ((adm.pct || 0) / 100)), 0)
  const totalCharges = totalVAPay + totalChatting + totalSplitModele + totalAdminPay
  const netAgence = totalCA - totalCharges

  return (
    <div>
      {/* KPIs */}
      <div style={{ ...st.g4, marginBottom: 24 }}>
        <StatCard label="CA Total" value={`$${totalCA.toLocaleString()}`} color={C.accent} icon="💵"/>
        <StatCard label="Total charges" value={`$${Math.round(totalCharges).toLocaleString()}`} color={C.red} icon="📤"/>
        <StatCard label="Net agence" value={`$${Math.round(netAgence).toLocaleString()}`} color={netAgence > 0 ? C.green : C.red} icon="💰"/>
        <StatCard label="Marge globale" value={totalCA > 0 ? `${Math.round((netAgence / totalCA) * 100)}%` : '—'} color={C.blue} icon="📈"/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Paie par modèle */}
        <div style={st.card(18)}>
          <div style={st.cTitle}>💅 Paie par modèle</div>
          {modelBreakdowns.length === 0
            ? <EmptyState icon="◆" title="Aucun modèle" sub="Ajoute des modèles"/>
            : modelBreakdowns.map(({ model, rev, mg }) => (
                <div key={model.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={st.avatar(model.color || C.accent)}>{(model.name || '?')[0].toUpperCase()}</div>
                    <div style={{ fontWeight: 700 }}>{model.name}</div>
                    <div style={{ marginLeft: 'auto', fontWeight: 800, color: C.accent }}>
                      ${(rev?.ca || 0).toLocaleString()} CA
                    </div>
                  </div>
                  {mg ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingLeft: 40 }}>
                      {[
                        { label: `Split modèle (${model.split_modele || 40}%)`, value: mg.caBrut - mg.caAgence, color: C.orange },
                        { label: `Chatting (${model.cout_chatting_type === 'pct' ? `${model.cout_chatting_valeur}%` : `$${model.cout_chatting_valeur}`})`, value: mg.coutChatting, color: C.purple },
                        { label: 'Coût VA', value: mg.coutVA, color: C.blue },
                        { label: 'Net agence', value: mg.net, color: mg.net > 0 ? C.green : C.red, bold: true },
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: C.sub }}>{row.label}</span>
                          <span style={{ color: row.color, fontWeight: row.bold ? 700 : 400 }}>
                            {row.label.startsWith('Net') ? '' : '−'}${Math.round(row.value).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.sub, marginTop: 2 }}>
                        <span>Marge</span>
                        <span style={{ color: mg.marge > 0 ? C.green : C.red, fontWeight: 700 }}>{mg.marge}%</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: C.muted, fontSize: 12, paddingLeft: 40 }}>Pas de données ce mois</div>
                  )}
                </div>
              ))
          }
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Paie VAs */}
          <div style={st.card(18)}>
            <div style={st.cTitle}>👥 Paie VAs</div>
            {vaPays.length === 0
              ? <EmptyState icon="👤" title="Aucun VA"/>
              : vaPays.map(({ va, pay, montant }) => (
                  <div key={va.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                    <div style={st.avatar(C.blue)}>{(va.name || '?')[0].toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{va.name}</div>
                      <div style={st.sub}>
                        {pay.type === 'pct' ? `${va.pay_pct}% du CA` : `${pay.clics?.toLocaleString() || 0} clics → ${pay.palier?.label || 'Hors palier'}`}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, color: C.green, fontSize: 15 }}>${Math.round(montant).toLocaleString()}</div>
                  </div>
                ))
            }
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, marginTop: 4, borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontWeight: 700 }}>Total VAs</span>
              <span style={{ fontWeight: 800, color: C.accent }}>${Math.round(totalVAPay).toLocaleString()}</span>
            </div>
          </div>

          {/* Paie admins */}
          {admins.length > 0 && (
            <div style={st.card(18)}>
              <div style={st.cTitle}>🎯 Paie équipe admin</div>
              {admins.map((adm, i) => {
                const montant = Math.round(totalCA * ((adm.pct || 0) / 100))
                return (
                  <div key={adm.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < admins.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <div style={st.avatar(C.accent)}>{(adm.name || '?')[0].toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{adm.name}</div>
                      <div style={st.sub}>{adm.pct || 0}% du CA</div>
                    </div>
                    <div style={{ fontWeight: 800, color: C.accent, fontSize: 15 }}>${montant.toLocaleString()}</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Résumé global */}
          <div style={{ ...st.card(18), background: C.accentDim, borderColor: C.accentGlow }}>
            <div style={st.cTitle}>📊 Résumé du mois</div>
            {[
              { label: 'CA brut total', value: totalCA, color: C.text },
              { label: 'Split modèles', value: -totalSplitModele, color: C.orange },
              { label: 'Chatting total', value: -totalChatting, color: C.purple },
              { label: 'Paie VAs', value: -totalVAPay, color: C.blue },
              { label: 'Paie admins', value: -totalAdminPay, color: C.accent },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: C.sub }}>{row.label}</span>
                <span style={{ color: row.color, fontWeight: 600 }}>
                  {row.value >= 0 ? '+' : ''}${Math.round(row.value).toLocaleString()}
                </span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 6, borderTop: `1px solid ${C.accentGlow}`, fontSize: 15, fontWeight: 800 }}>
              <span>NET AGENCE</span>
              <span style={{ color: netAgence > 0 ? C.green : C.red }}>${Math.round(netAgence).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
