import React, { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext'
import { calculateVAPay, calculateModelMarge } from '../lib/supabase'
import { C, st } from '../lib/design'
import { StatCard, EmptyState } from '../components/UI'

const PERIODS = [['month', 'Ce mois'], ['week', '7 jours'], ['day', "Aujourd'hui"], ['custom', 'Personnalisé']]

export default function Salaires() {
  const { data } = useApp()
  const [period, setPeriod] = useState('month')
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0,10) })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0,10))

  if (!data) return null
  const { models, modelRevenue, profiles, paliers, vaClicks, payroll } = data
  const vas = profiles.filter(p => p.role === 'va' || p.role === 'tl')
  const admins = profiles.filter(p => p.role === 'admin' || p.role === 'owner')
  const now = new Date()

  const range = useMemo(() => {
    if (period === 'day') { const d = now.toISOString().slice(0,10); return { from: d, to: d } }
    if (period === 'week') { const f = new Date(now); f.setDate(now.getDate()-7); return { from: f.toISOString().slice(0,10), to: now.toISOString().slice(0,10) } }
    if (period === 'month') { const f = new Date(now.getFullYear(), now.getMonth(), 1); return { from: f.toISOString().slice(0,10), to: now.toISOString().slice(0,10) } }
    return { from: dateFrom, to: dateTo }
  }, [period, dateFrom, dateTo])

  const inRange = d => d >= range.from && d <= range.to
  const filteredRev = modelRevenue.filter(r => inRange(r.date))
  const filteredClics = vaClicks.filter(c => inRange(c.date))

  const latestRevByModel = useMemo(() => Object.fromEntries(models.map(m => {
    const revs = filteredRev.filter(r => r.model_id === m.id).sort((a,b) => b.date?.localeCompare(a.date))
    return [m.id, revs[0] || null]
  })), [models, filteredRev])

  const totalCA = filteredRev.reduce((a, r) => a + (Number(r.ca)||0), 0)

  const vaPays = useMemo(() => vas.map(va => {
    const pay = calculateVAPay(va, paliers, filteredClics)
    let montant = 0
    if (pay.type === 'pct') {
      const assignedModelIds = Array.isArray(va.model_ids) ? va.model_ids : []
      const caAssigned = assignedModelIds.reduce((a, mid) => a + filteredRev.filter(r => r.model_id === mid).reduce((b,r) => b + (Number(r.ca)||0), 0), 0)
      montant = caAssigned * ((va.pay_pct||0) / 100)
    } else {
      montant = pay.montant || 0
    }
    return { va, pay, montant }
  }), [vas, paliers, filteredClics, filteredRev])

  const totalVAPay = vaPays.reduce((a, v) => a + v.montant, 0)

  const modelBreakdowns = useMemo(() => models.map(m => {
    const rev = latestRevByModel[m.id]
    const mg = calculateModelMarge(m, rev, vas, paliers, filteredClics)
    return { model: m, rev, mg }
  }), [models, latestRevByModel, vas, paliers, filteredClics])

  const totalChatting = modelBreakdowns.reduce((a, { mg }) => a + (mg?.coutChatting||0), 0)
  const totalSplitModele = modelBreakdowns.reduce((a, { mg }) => a + (mg ? mg.caBrut - mg.caAgence : 0), 0)
  const totalAdminPay = admins.reduce((a, adm) => a + Math.round(totalCA * ((adm.pct||0)/100)), 0)
  const totalCharges = totalVAPay + totalChatting + totalSplitModele + totalAdminPay
  const netAgence = totalCA - totalCharges

  return (
    <div>
      {/* Period filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {PERIODS.map(([val, label]) => (
          <button key={val} onClick={() => setPeriod(val)} style={st.btn(period === val ? 'primary' : 'ghost', 'sm')}>{label}</button>
        ))}
        {period === 'custom' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...st.input, width: 140 }}/>
            <span style={{ color: C.sub }}>→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...st.input, width: 140 }}/>
          </div>
        )}
      </div>

      <div style={{ ...st.g4, marginBottom: 24 }}>
        <StatCard label="CA Total" value={`$${totalCA.toLocaleString()}`} color={C.accent} icon="💵"/>
        <StatCard label="Total charges" value={`$${Math.round(totalCharges).toLocaleString()}`} color={C.red} icon="📤"/>
        <StatCard label="Net agence" value={`$${Math.round(netAgence).toLocaleString()}`} color={netAgence > 0 ? C.green : C.red} icon="💰"/>
        <StatCard label="Marge globale" value={totalCA > 0 ? `${Math.round((netAgence/totalCA)*100)}%` : '—'} color={C.blue} icon="📈"/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={st.card(18)}>
          <div style={st.cTitle}>💅 Paie par modèle</div>
          {modelBreakdowns.length === 0
            ? <EmptyState icon="◆" title="Aucun modèle"/>
            : modelBreakdowns.map(({ model, rev, mg }) => (
                <div key={model.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={st.avatar(model.color||C.accent)}>{(model.name||'?')[0].toUpperCase()}</div>
                    <div style={{ fontWeight: 700 }}>{model.name}</div>
                    <div style={{ marginLeft: 'auto', fontWeight: 800, color: C.accent }}>${(rev?.ca||0).toLocaleString()} CA</div>
                  </div>
                  {mg ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingLeft: 40 }}>
                      {[
                        { label: model.split_type === 'fixe' ? `Split modèle (fixe $${model.split_modele})` : `Split modèle (${model.split_modele||40}%)`, value: mg.caBrut - mg.caAgence, color: C.orange },
                        { label: `Chatting (${model.cout_chatting_valeur||22}%)`, value: mg.coutChatting, color: C.purple },
                        { label: 'Coût VA', value: mg.coutVA, color: C.blue },
                        { label: 'Net agence', value: mg.net, color: mg.net > 0 ? C.green : C.red, bold: true },
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: C.sub }}>{row.label}</span>
                          <span style={{ color: row.color, fontWeight: row.bold ? 700 : 400 }}>${Math.round(Math.abs(row.value)).toLocaleString()}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.sub, marginTop: 2 }}>
                        <span>Marge</span>
                        <span style={{ color: mg.marge > 0 ? C.green : C.red, fontWeight: 700 }}>{mg.marge}%</span>
                      </div>
                    </div>
                  ) : <div style={{ color: C.muted, fontSize: 12, paddingLeft: 40 }}>Pas de données</div>}
                </div>
              ))
          }
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={st.card(18)}>
            <div style={st.cTitle}>👥 Paie VAs</div>
            {vaPays.length === 0
              ? <EmptyState icon="👤" title="Aucun VA"/>
              : vaPays.map(({ va, pay, montant }) => (
                  <div key={va.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                    <div style={st.avatar(C.blue)}>{(va.name||'?')[0].toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{va.name}</div>
                      <div style={st.sub}>{pay.type === 'pct' ? `${va.pay_pct}% du CA` : `${(pay.clics||0).toLocaleString()} clics`}</div>
                    </div>
                    <div style={{ fontWeight: 800, color: C.green, fontSize: 15 }}>${Math.round(montant).toLocaleString()}</div>
                  </div>
                ))
            }
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontWeight: 700 }}>Total VAs</span>
              <span style={{ fontWeight: 800, color: C.accent }}>${Math.round(totalVAPay).toLocaleString()}</span>
            </div>
          </div>

          <div style={{ ...st.card(18), background: C.accentDim, borderColor: C.accentGlow }}>
            <div style={st.cTitle}>📊 Résumé</div>
            {[
              { label: 'CA brut', value: totalCA, color: C.text },
              { label: 'Split modèles', value: -totalSplitModele, color: C.orange },
              { label: 'Chatting', value: -totalChatting, color: C.purple },
              { label: 'Paie VAs', value: -totalVAPay, color: C.blue },
              { label: 'Paie admins', value: -totalAdminPay, color: C.accent },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: C.sub }}>{row.label}</span>
                <span style={{ color: row.color, fontWeight: 600 }}>{row.value >= 0 ? '+' : ''}${Math.round(row.value).toLocaleString()}</span>
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
