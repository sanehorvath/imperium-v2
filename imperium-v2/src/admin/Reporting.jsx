import React, { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext'
import { C, st } from '../lib/design'
import { StatCard, EmptyState } from '../components/UI'

export default function Reporting() {
  const { data } = useApp()
  const [period, setPeriod] = useState('month') // 'day' | 'week' | 'month' | 'custom'
  const [selModel, setSelModel] = useState('all')
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1)
    return d.toISOString().slice(0, 10)
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10))

  if (!data) return null
  const { models, modelRevenue, vaClicks, profiles, accountStats, accounts } = data
  const vas = profiles.filter(p => p.role === 'va')

  // Compute date range
  const now = new Date()
  const ranges = useMemo(() => {
    if (period === 'day') {
      const d = now.toISOString().slice(0, 10)
      return { from: d, to: d }
    }
    if (period === 'week') {
      const from = new Date(now); from.setDate(now.getDate() - 7)
      return { from: from.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) }
    }
    if (period === 'month') {
      const from = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: from.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) }
    }
    return { from: dateFrom, to: dateTo }
  }, [period, dateFrom, dateTo])

  const inRange = (date) => date >= ranges.from && date <= ranges.to

  // Filter data
  const filteredRevenue = modelRevenue.filter(r => inRange(r.date) && (selModel === 'all' || r.model_id === selModel))
  const filteredClics = vaClicks.filter(c => inRange(c.date) && (selModel === 'all' || c.model_id === selModel))

  // Totals
  const totalCA = filteredRevenue.reduce((a, r) => a + (r.ca || 0), 0)
  const totalFans = filteredRevenue.reduce((a, r) => a + (r.nouveaux_fans || 0), 0)
  const totalClics = filteredClics.reduce((a, c) => a + (c.clics || 0), 0)
  const totalVues = filteredClics.reduce((a, c) => a + (c.vues || 0), 0)

  // Clics par VA
  const clicsParVA = useMemo(() => vas.map(va => ({
    va,
    clics: filteredClics.filter(c => c.va_id === va.id).reduce((a, c) => a + (c.clics || 0), 0),
    vues: filteredClics.filter(c => c.va_id === va.id).reduce((a, c) => a + (c.vues || 0), 0),
  })).sort((a, b) => b.clics - a.clics), [vas, filteredClics])

  // CA par modèle
  const caParModele = useMemo(() => models.map(m => ({
    model: m,
    ca: filteredRevenue.filter(r => r.model_id === m.id).reduce((a, r) => a + (r.ca || 0), 0),
    fans: filteredRevenue.filter(r => r.model_id === m.id).reduce((a, r) => a + (r.nouveaux_fans || 0), 0),
    clics: filteredClics.filter(c => c.model_id === m.id).reduce((a, c) => a + (c.clics || 0), 0),
  })).filter(r => r.ca > 0 || r.clics > 0).sort((a, b) => b.ca - a.ca), [models, filteredRevenue, filteredClics])

  // Timeline
  const timeline = useMemo(() => {
    const days = {}
    filteredRevenue.forEach(r => {
      if (!days[r.date]) days[r.date] = { date: r.date, ca: 0, fans: 0, clics: 0 }
      days[r.date].ca += r.ca || 0
      days[r.date].fans += r.nouveaux_fans || 0
    })
    filteredClics.forEach(c => {
      if (!days[c.date]) days[c.date] = { date: c.date, ca: 0, fans: 0, clics: 0 }
      days[c.date].clics += c.clics || 0
    })
    return Object.values(days).sort((a, b) => b.date.localeCompare(a.date))
  }, [filteredRevenue, filteredClics])

  return (
    <div>
      {/* Filters */}
      <div style={{ ...st.card(16), marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['day', 'Aujourd\'hui'], ['week', '7 jours'], ['month', 'Ce mois'], ['custom', 'Personnalisé']].map(([val, label]) => (
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

      {/* KPIs */}
      <div style={{ ...st.g4, marginBottom: 20 }}>
        <StatCard label="CA" value={`$${totalCA.toLocaleString()}`} color={C.accent} icon="💵"/>
        <StatCard label="Nouveaux fans" value={totalFans.toLocaleString()} color={C.blue} icon="👥"/>
        <StatCard label="Clics totaux" value={totalClics.toLocaleString()} color={C.green} icon="🖱️"/>
        <StatCard label="Vues totales" value={totalVues.toLocaleString()} color={C.purple} icon="👁"/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* CA par modèle */}
        <div style={st.card(18)}>
          <div style={st.cTitle}>CA par modèle</div>
          {caParModele.length === 0
            ? <EmptyState icon="📊" title="Aucune donnée" sub="pour cette période"/>
            : caParModele.map(({ model, ca, fans, clics }) => (
                <div key={model.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                  <div style={st.avatar(model.color || C.accent)}>{(model.name || '?')[0].toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{model.name}</div>
                    <div style={st.sub}>+{fans} fans · {clics.toLocaleString()} clics</div>
                  </div>
                  <div style={{ fontWeight: 800, color: C.accent }}>${ca.toLocaleString()}</div>
                </div>
              ))
          }
        </div>

        {/* Clics par VA */}
        <div style={st.card(18)}>
          <div style={st.cTitle}>Clics par VA</div>
          {clicsParVA.filter(v => v.clics > 0).length === 0
            ? <EmptyState icon="🖱️" title="Aucune donnée" sub="pour cette période"/>
            : clicsParVA.filter(v => v.clics > 0).map(({ va, clics, vues }) => (
                <div key={va.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                  <div style={st.avatar(C.blue)}>{(va.name || '?')[0].toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{va.name}</div>
                    <div style={st.sub}>{vues.toLocaleString()} vues</div>
                  </div>
                  <div style={{ fontWeight: 800, color: C.blue }}>{clics.toLocaleString()}</div>
                </div>
              ))
          }
        </div>
      </div>

      {/* Timeline */}
      <div style={st.card(18)}>
        <div style={st.cTitle}>Timeline ({timeline.length} jours)</div>
        {timeline.length === 0
          ? <EmptyState icon="📅" title="Aucune donnée" sub="pour cette période"/>
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 8 }}>
              {timeline.map(day => (
                <div key={day.date} style={{ ...st.card2(12), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    <div style={st.sub}>{day.clics.toLocaleString()} clics · +{day.fans} fans</div>
                  </div>
                  {day.ca > 0 && <div style={{ fontWeight: 800, color: C.accent }}>${day.ca.toLocaleString()}</div>}
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  )
}
