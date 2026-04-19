import React, { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext'
import { calculateVAPay } from '../lib/supabase'
import { C, st } from '../lib/design'
import { EmptyState } from '../components/UI'

const PERIODS = [['month', 'Ce mois'], ['week', '7 jours'], ['day', "Aujourd'hui"], ['custom', 'Personnalisé']]

export default function Salaires() {
  const { data } = useApp()
  const [period, setPeriod] = useState('month')
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0,10) })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0,10))

  if (!data) return null
  const { models, modelRevenue, profiles, paliers, vaClicks } = data
  const vas = profiles.filter(p => p.role === 'va' || p.role === 'tl')
  const now = new Date()

  const range = useMemo(() => {
    if (period === 'day') { const d = now.toISOString().slice(0,10); return { from: d, to: d } }
    if (period === 'week') { const f = new Date(now); f.setDate(now.getDate()-7); return { from: f.toISOString().slice(0,10), to: now.toISOString().slice(0,10) } }
    if (period === 'month') { const f = new Date(now.getFullYear(), now.getMonth(), 1); return { from: f.toISOString().slice(0,10), to: now.toISOString().slice(0,10) } }
    return { from: dateFrom, to: dateTo }
  }, [period, dateFrom, dateTo])

  const inRange = d => d && d >= range.from && d <= range.to
  const filteredRev = modelRevenue.filter(r => inRange(r.date))
  const filteredClics = vaClicks.filter(c => inRange(c.date))

  // --- MODÈLES ---
  const modelCosts = models.map(m => {
    const ca = filteredRev.filter(r => r.model_id === m.id).reduce((a,r) => a+(Number(r.ca)||0), 0)
    const chatting = ca * ((Number(m.cout_chatting_valeur)||22) / 100)
    let salaire = 0
    if (m.split_type === 'fixe') {
      const days = Math.max(1, (new Date(range.to) - new Date(range.from)) / (1000*60*60*24))
      const months = Math.max(1, Math.round(days / 30))
      salaire = (Number(m.split_modele)||0) * months
    } else {
      salaire = ca * ((Number(m.split_modele)||40) / 100)
    }
    return { model: m, ca, salaire, chatting }
  })

  const totalSalairesModeles = modelCosts.reduce((a, m) => a + m.salaire, 0)
  const totalChatting = modelCosts.reduce((a, m) => a + m.chatting, 0)

  // --- VAs ---
  const vaCosts = vas.map(va => {
    const pay = calculateVAPay(va, paliers, filteredClics)
    let montant = 0
    if (pay.type === 'pct') {
      const assignedIds = Array.isArray(va.model_ids) ? va.model_ids : []
      const ca = assignedIds.reduce((a, mid) => a + filteredRev.filter(r => r.model_id === mid).reduce((b,r) => b+(Number(r.ca)||0), 0), 0)
      montant = ca * ((Number(va.pay_pct)||0) / 100)
    } else {
      montant = pay.montant || 0
    }
    return { va, pay, montant }
  })

  const totalVAs = vaCosts.reduce((a, v) => a + v.montant, 0)
  const totalCharges = totalSalairesModeles + totalChatting + totalVAs

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

      {/* Big 3 cost KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Coût modèles', value: totalSalairesModeles, color: C.orange, icon: '◆', sub: 'salaires + splits' },
          { label: 'Coût chatting', value: totalChatting, color: C.purple, icon: '💬', sub: '% du CA' },
          { label: 'Coût VAs', value: totalVAs, color: C.blue, icon: '👥', sub: 'paliers + %' },
        ].map(({ label, value, color, icon, sub }) => (
          <div key={label} style={{ ...st.card(20), borderLeft: `3px solid ${color}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{icon} {label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1.1, marginBottom: 4 }}>${Math.round(value).toLocaleString()}</div>
            <div style={{ fontSize: 11, color: C.sub }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{ ...st.card(16), marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.accentDim, borderColor: C.accentGlow }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Total charges</div>
        <div style={{ fontWeight: 900, fontSize: 22, color: C.accent }}>${Math.round(totalCharges).toLocaleString()}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Modèles detail */}
        <div style={st.card(18)}>
          <div style={st.cTitle}>◆ Détail modèles</div>
          {modelCosts.length === 0
            ? <EmptyState icon="◆" title="Aucun modèle"/>
            : modelCosts.map((mc, i) => (
                <div key={mc.model.id} style={{ padding: '12px 0', borderBottom: i < modelCosts.length-1 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={st.avatar(mc.model.color||C.accent)}>{(mc.model.name||'?')[0].toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{mc.model.name}</div>
                      <div style={{ fontSize: 11, color: C.sub }}>CA : ${mc.ca.toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ paddingLeft: 40, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: C.sub }}>
                        {mc.model.split_type === 'fixe' ? `Salaire fixe` : `Split ${mc.model.split_modele||40}%`}
                      </span>
                      <span style={{ color: C.orange, fontWeight: 600 }}>${Math.round(mc.salaire).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: C.sub }}>Chatting {mc.model.cout_chatting_valeur||22}%</span>
                      <span style={{ color: C.purple, fontWeight: 600 }}>${Math.round(mc.chatting).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))
          }
        </div>

        {/* VAs detail */}
        <div style={st.card(18)}>
          <div style={st.cTitle}>👥 Détail VAs</div>
          {vaCosts.length === 0
            ? <EmptyState icon="👤" title="Aucun VA"/>
            : vaCosts.map(({ va, pay, montant }, i) => (
                <div key={va.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < vaCosts.length-1 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={st.avatar(C.blue)}>{(va.name||'?')[0].toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{va.name}</div>
                    <div style={{ fontSize: 11, color: C.sub }}>
                      {pay.type === 'pct' ? `${va.pay_pct}% du CA` : `${(pay.clics||0).toLocaleString()} clics · ${pay.palier?.label || 'Hors palier'}`}
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: C.blue, fontSize: 16 }}>${Math.round(montant).toLocaleString()}</div>
                </div>
              ))
          }
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, marginTop: 4, borderTop: `1px solid ${C.border}`, fontWeight: 700 }}>
            <span>Total VAs</span>
            <span style={{ color: C.blue }}>${Math.round(totalVAs).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
