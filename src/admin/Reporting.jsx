import React, { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext'
import { C, st } from '../lib/design'
import { StatCard, EmptyState } from '../components/UI'

const PERIODS = [['month', 'Ce mois'], ['week', '7 jours'], ['day', "Aujourd'hui"], ['custom', 'Personnalisé']]

export default function Reporting() {
  const { data } = useApp()
  const [period, setPeriod] = useState('month')
  const [selModel, setSelModel] = useState('all')
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0,10) })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0,10))

  if (!data) return null
  const { models, modelRevenue, vaClicks, profiles } = data
  const vas = profiles.filter(p => p.role === 'va')
  const now = new Date()

  const range = useMemo(() => {
    if (period === 'day') { const d = now.toISOString().slice(0,10); return { from: d, to: d } }
    if (period === 'week') { const f = new Date(now); f.setDate(now.getDate()-7); return { from: f.toISOString().slice(0,10), to: now.toISOString().slice(0,10) } }
    if (period === 'month') { const f = new Date(now.getFullYear(), now.getMonth(), 1); return { from: f.toISOString().slice(0,10), to: now.toISOString().slice(0,10) } }
    return { from: dateFrom, to: dateTo }
  }, [period, dateFrom, dateTo])

  const inRange = d => d >= range.from && d <= range.to
  const filteredRev = modelRevenue.filter(r => inRange(r.date) && (selModel === 'all' || r.model_id === selModel))
  const filteredClics = vaClicks.filter(c => inRange(c.date) && (selModel === 'all' || c.model_id === selModel))

  const totalCA = filteredRev.reduce((a, r) => a + (Number(r.ca)||0), 0)
  const totalFans = filteredRev.reduce((a, r) => a + (Number(r.nouveaux_fans)||0), 0)
  const totalClics = filteredRev.reduce((a, r) => a + (Number(r.clics_total)||0), 0)
  const totalVues = filteredClics.reduce((a, c) => a + (c.vues || 0), 0)

  const clicsParVA = useMemo(() => vas.map(va => ({
    va,
    clics: filteredClics.filter(c => c.va_id === va.id).reduce((a,c) => a+(c.clics||0), 0),
  })).sort((a,b) => b.clics - a.clics), [vas, filteredClics])

  const caParModele = useMemo(() => models.map(m => ({
    model: m,
    ca: filteredRev.filter(r => r.model_id === m.id).reduce((a,r) => a+(Number(r.ca)||0), 0),
    fans: filteredRev.filter(r => r.model_id === m.id).reduce((a,r) => a+(Number(r.nouveaux_fans)||0), 0),
    clics: filteredRev.filter(r => r.model_id === m.id).reduce((a,r) => a+(Number(r.clics_total)||0), 0),
  })).filter(r => r.ca > 0 || r.clics > 0).sort((a,b) => b.ca - a.ca), [models, filteredRev, filteredClics])

  return (
    <div>
      <div style={{ ...st.card(16), marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {PERIODS.map(([val, label]) => (
            <button key={val} onClick={() => setPeriod(val)} style={st.btn(period === val ? 'primary' : 'ghost', 'sm')}>{label}</button>
          ))}
        </div>
        {period === 'custom' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...st.input, width: 140 }}/>
            <span style={{ color: C.sub }}>→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...st.input, width: 140 }}/>
          </div>
        )}
        <select value={selModel} onChange={e => setSelModel(e.target.value)} style={{ ...st.input, width: 160 }}>
          <option value="all">Tous les modèles</option>
          {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      <div style={{ ...st.g4, marginBottom: 20 }}>
        <StatCard label="CA" value={`$${totalCA.toLocaleString()}`} color={C.accent} icon="💵"/>
        <StatCard label="Nouveaux fans" value={totalFans.toLocaleString()} color={C.blue} icon="👥"/>
        <StatCard label="Clics totaux" value={totalClics.toLocaleString()} color={C.purple} icon="🖱️"/>
        <StatCard label="Vues totales" value={totalVues.toLocaleString()} color={C.green} icon="👁"/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={st.card(18)}>
          <div style={st.cTitle}>CA par modèle</div>
          {caParModele.length === 0
            ? <EmptyState icon="📊" title="Aucune donnée"/>
            : caParModele.map((r, i) => (
                <div key={r.model.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < caParModele.length-1 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={st.avatar(r.model.color || C.accent)}>{(r.model.name||'?')[0].toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{r.model.name}</div>
                    <div style={{ ...st.sub, color: C.sub }}>+{r.fans} fans · {r.clics.toLocaleString()} clics</div>
                  </div>
                  <div style={{ fontWeight: 800, color: C.accent }}>${r.ca.toLocaleString()}</div>
                </div>
              ))
          }
        </div>

        <div style={st.card(18)}>
          <div style={st.cTitle}>Clics par VA</div>
          {clicsParVA.filter(v => v.clics > 0).length === 0
            ? <EmptyState icon="🖱️" title="Aucune donnée"/>
            : clicsParVA.filter(v => v.clics > 0).map((v, i) => (
                <div key={v.va.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < clicsParVA.length-1 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={st.avatar(C.blue)}>{(v.va.name||'?')[0].toUpperCase()}</div>
                  <div style={{ flex: 1, fontWeight: 600, fontSize: 13, color: C.text }}>{v.va.name}</div>
                  <div style={{ fontWeight: 800, color: C.blue }}>{v.clics.toLocaleString()}</div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  )
}
