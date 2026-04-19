import React, { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext'
import { calculateModelMarge, calculateVAPay } from '../lib/supabase'
import { C, st } from '../lib/design'
import { StatCard, EmptyState } from '../components/UI'

const PERIODS = [['month', 'Ce mois'], ['week', '7 jours'], ['day', "Aujourd'hui"], ['custom', 'Personnalisé']]

export default function Overview() {
  const { data } = useApp()
  const [period, setPeriod] = useState('month')
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0,10) })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0,10))

  if (!data) return null
  const { models, modelRevenue, profiles, paliers, vaClicks, invoices } = data
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

  // CA total
  const totalCA = filteredRev.reduce((a, r) => a + (Number(r.ca)||0), 0)
  const totalFans = filteredRev.reduce((a, r) => a + (Number(r.nouveaux_fans)||0), 0)
  const totalClics = filteredRev.reduce((a, r) => a + (Number(r.clics_total)||0), 0)

  // Charges modèles (split)
  const totalSplitModele = models.reduce((a, m) => {
    const revs = filteredRev.filter(r => r.model_id === m.id)
    const ca = revs.reduce((b, r) => b + (Number(r.ca)||0), 0)
    if (m.split_type === 'fixe') {
      // Fixe par mois : compter combien de mois dans la période
      const days = Math.max(1, (new Date(range.to) - new Date(range.from)) / (1000*60*60*24))
      const months = Math.max(1, Math.round(days / 30))
      return a + (Number(m.split_modele)||0) * months
    }
    return a + ca * ((Number(m.split_modele)||40) / 100)
  }, 0)

  // Charges chatting
  const totalChatting = models.reduce((a, m) => {
    const ca = filteredRev.filter(r => r.model_id === m.id).reduce((b, r) => b + (Number(r.ca)||0), 0)
    return a + ca * ((Number(m.cout_chatting_valeur)||22) / 100)
  }, 0)

  // Charges VAs
  const filteredClics = vaClicks.filter(c => inRange(c.date))
  const totalVAPay = vas.reduce((a, va) => {
    const pay = calculateVAPay(va, paliers, filteredClics)
    if (pay.type === 'pct') {
      const assignedIds = Array.isArray(va.model_ids) ? va.model_ids : []
      const ca = assignedIds.reduce((b, mid) => b + filteredRev.filter(r => r.model_id === mid).reduce((c2, r) => c2 + (Number(r.ca)||0), 0), 0)
      return a + ca * ((Number(va.pay_pct)||0) / 100)
    }
    return a + (pay.montant || 0)
  }, 0)

  // Factures payées dans la période (date_paiement dans range)
  const facturesPeriode = invoices.filter(i => i.statut === 'payé' && inRange(i.date_paiement))
  const totalFactures = facturesPeriode.reduce((a, i) => a + (Number(i.montant)||0), 0)

  const totalCharges = totalSplitModele + totalChatting + totalVAPay + totalFactures
  const netAgence = totalCA - totalCharges
  const marge = totalCA > 0 ? Math.round((netAgence / totalCA) * 100) : 0

  const enRetard = invoices.filter(i => i.statut === 'en_retard')

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

      {/* KPIs */}
      <div style={{ ...st.g4, marginBottom: 16 }}>
        <StatCard label="CA Total" value={totalCA > 0 ? `$${totalCA.toLocaleString()}` : '—'} sub="tous modèles" color={C.accent} icon="💵"/>
        <StatCard label="Total charges" value={totalCharges > 0 ? `$${Math.round(totalCharges).toLocaleString()}` : '—'} sub="modèles + chatting + VAs + factures" color={C.red} icon="📤"/>
        <StatCard label="Net agence" value={`$${Math.round(netAgence).toLocaleString()}`} sub="après toutes charges" color={netAgence >= 0 ? C.green : C.red} icon="💰"/>
        <StatCard label="Marge" value={totalCA > 0 ? `${marge}%` : '—'} sub="net / CA brut" color={marge > 20 ? C.green : marge > 0 ? C.orange : C.red} icon="📈"/>
      </div>

      {/* Charges detail */}
      <div style={{ ...st.card(14), marginBottom: 16, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Modèles', value: totalSplitModele, color: C.orange },
          { label: 'Chatting', value: totalChatting, color: C.purple },
          { label: 'VAs', value: totalVAPay, color: C.blue },
          { label: 'Factures', value: totalFactures, color: C.red },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }}/>
            <span style={{ fontSize: 12, color: C.sub }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color }}>${Math.round(value).toLocaleString()}</span>
          </div>
        ))}
      </div>

      {enRetard.length > 0 && (
        <div style={{ background: C.redDim, border: `1px solid ${C.red}44`, borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span>⚠</span>
          <span style={{ fontSize: 13, color: C.red, fontWeight: 600 }}>{enRetard.length} facture{enRetard.length > 1 ? 's' : ''} en retard — {enRetard.map(i => i.libelle).join(', ')}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={st.card(18)}>
          <div style={st.cTitle}>Performance modèles</div>
          {models.length === 0
            ? <EmptyState icon="📊" title="Aucun modèle"/>
            : models.map((m, i) => {
                const ca = filteredRev.filter(r => r.model_id === m.id).reduce((a,r) => a+(Number(r.ca)||0), 0)
                const fans = filteredRev.filter(r => r.model_id === m.id).reduce((a,r) => a+(Number(r.nouveaux_fans)||0), 0)
                const clics = filteredRev.filter(r => r.model_id === m.id).reduce((a,r) => a+(Number(r.clics_total)||0), 0)
                return (
                  <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', alignItems: 'center', padding: '9px 0', borderBottom: i < models.length-1 ? `1px solid ${C.border}` : 'none', gap: 8 }}>
                    <div style={st.row}>
                      <div style={st.avatar(m.color||C.accent)}>{(m.name||'?')[0].toUpperCase()}</div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: C.accent, fontSize: 12 }}>${ca.toLocaleString()}</span>
                    <span style={{ color: C.blue, fontSize: 12 }}>+{fans} fans</span>
                    <span style={{ color: C.purple, fontSize: 12 }}>{clics.toLocaleString()} clics</span>
                  </div>
                )
              })
          }
        </div>

        <div style={st.card(18)}>
          <div style={st.cTitle}>Clics par modèle</div>
          {models.length === 0
            ? <EmptyState icon="🖱️" title="Aucune donnée"/>
            : (() => {
                const totalC = filteredRev.reduce((a,r) => a+(Number(r.clics_total)||0), 0)
                return models.map((m, i) => {
                  const clics = filteredRev.filter(r => r.model_id === m.id).reduce((a,r) => a+(Number(r.clics_total)||0), 0)
                  const pct = totalC > 0 ? Math.round((clics/totalC)*100) : 0
                  return (
                    <div key={m.id} style={{ padding: '8px 0', borderBottom: i < models.length-1 ? `1px solid ${C.border}` : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={st.row}>
                          <div style={st.avatar(m.color||C.accent)}>{(m.name||'?')[0].toUpperCase()}</div>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</span>
                        </div>
                        <span style={{ fontWeight: 800, color: C.purple }}>{clics.toLocaleString()}</span>
                      </div>
                      <div style={{ background: C.border, borderRadius: 99, height: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: m.color||C.purple, borderRadius: 99 }}/>
                      </div>
                    </div>
                  )
                })
              })()
          }
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${C.border}`, marginTop: 4 }}>
            <span style={{ fontSize: 12, color: C.sub }}>Total</span>
            <span style={{ fontWeight: 800, color: C.purple }}>{totalClics.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
