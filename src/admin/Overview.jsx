import React, { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext'
import { calculateModelMarge } from '../lib/supabase'
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
  const vas = profiles.filter(p => p.role === 'va')
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
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const vaClicksThisMonth = vaClicks.filter(c => c.date?.startsWith(currentMonth))

  const totalCA = filteredRev.reduce((a, r) => a + (Number(r.ca)||0), 0)
  const totalFans = filteredRev.reduce((a, r) => a + (Number(r.nouveaux_fans)||0), 0)
  const totalClics = filteredRev.reduce((a, r) => a + (Number(r.clics_total)||0), 0)

  const latestRevByModel = useMemo(() => Object.fromEntries(models.map(m => {
    const revs = filteredRev.filter(r => r.model_id === m.id).sort((a,b) => b.date?.localeCompare(a.date))
    return [m.id, revs[0] || null]
  })), [models, filteredRev])

  const marges = models.map(m => calculateModelMarge(m, latestRevByModel[m.id], vas, paliers, vaClicksThisMonth)).filter(Boolean)
  const totalNet = marges.reduce((a, mg) => a + mg.net, 0)
  const enRetard = invoices.filter(i => i.statut === 'en_retard')
  const facturesOuvertes = invoices.filter(i => i.statut !== 'payé')
  const noData = totalCA === 0

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
      <div style={{ ...st.g4, marginBottom: 20 }}>
        <StatCard label="CA Total" value={noData ? '—' : `$${totalCA.toLocaleString()}`} sub="tous modèles" color={C.accent} icon="💵"/>
        <StatCard label="Nouveaux fans" value={noData ? '—' : totalFans.toLocaleString()} sub="période sélectionnée" color={C.blue} icon="👥"/>
        <StatCard label="Clics totaux" value={noData ? '—' : totalClics.toLocaleString()} sub="tous comptes" color={C.purple} icon="🖱️"/>
        <StatCard label="Net agence" value={noData ? '—' : `$${Math.round(totalNet).toLocaleString()}`} sub="après charges" color={totalNet > 0 ? C.green : C.red} icon="📈"/>
      </div>

      {enRetard.length > 0 && (
        <div style={{ background: C.redDim, border: `1px solid ${C.red}44`, borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 16 }}>⚠</span>
          <span style={{ fontSize: 13, color: C.red, fontWeight: 600 }}>{enRetard.length} facture{enRetard.length > 1 ? 's' : ''} en retard — {enRetard.map(i => i.libelle).join(', ')}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={st.card(18)}>
          <div style={st.cTitle}>Performance modèles</div>
          {models.length === 0
            ? <EmptyState icon="📊" title="Aucun modèle"/>
            : models.map((m, i) => {
                const rev = latestRevByModel[m.id]
                const mg = calculateModelMarge(m, rev, vas, paliers, vaClicksThisMonth)
                return (
                  <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 0.8fr', alignItems: 'center', padding: '10px 0', borderBottom: i < models.length-1 ? `1px solid ${C.border}` : 'none', gap: 8 }}>
                    <div style={st.row}>
                      <div style={st.avatar(m.color || C.accent)}>{(m.name||'?')[0].toUpperCase()}</div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: rev ? C.accent : C.muted, fontSize: 13 }}>{rev ? `$${(rev.ca||0).toLocaleString()}` : '—'}</span>
                    <span style={{ color: C.sub, fontSize: 12 }}>{rev ? `+${rev.nouveaux_fans||0}` : '—'}</span>
                    <span style={{ color: mg ? (mg.marge > 0 ? C.green : C.red) : C.muted, fontSize: 12, fontWeight: 600 }}>{mg ? `${mg.marge}%` : '—'}</span>
                  </div>
                )
              })
          }
        </div>
        <div style={st.card(18)}>
          <div style={st.cTitle}>Clics par modèle</div>
          {models.length === 0
            ? <EmptyState icon="🖱️" title="Aucune donnée"/>
            : models.map((m, i) => {
                const clics = filteredRev.filter(r => r.model_id === m.id).reduce((a,r) => a + (Number(r.clics_total)||0), 0)
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < models.length-1 ? `1px solid ${C.border}` : 'none' }}>
                    <div style={st.avatar(m.color || C.accent)}>{(m.name||'?')[0].toUpperCase()}</div>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div></div>
                    <div style={{ fontWeight: 800, color: C.purple }}>{clics.toLocaleString()}</div>
                  </div>
                )
              })
          }
        </div>
      </div>
    </div>
  )
}
