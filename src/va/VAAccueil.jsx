import React, { useMemo } from 'react'
import { useApp } from '../lib/AppContext'
import { calculateVAPay } from '../lib/supabase'
import { C, st } from '../lib/design'
import { StatCard } from '../components/UI'

export default function VAAccueil() {
  const { data, profile } = useApp()
  if (!data || !profile) return null

  const { paliers, vaClicks, modelRevenue, models } = data
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const vaClicksThisMonth = vaClicks.filter(c => c.va_id === profile.id && c.date?.startsWith(currentMonth))
  const totalClics = vaClicksThisMonth.reduce((a, c) => a + (c.clics || 0), 0)

  const pay = useMemo(() => calculateVAPay(profile, paliers, vaClicks.filter(c => c.date?.startsWith(currentMonth))), [profile, paliers, vaClicks])

  let montantEstime = 0
  if (pay.type === 'pct') {
    const assignedModelIds = Array.isArray(profile.model_ids) ? profile.model_ids : []
    const caTotal = assignedModelIds.reduce((a, mid) => {
      const revs = modelRevenue.filter(r => r.model_id === mid && r.date?.startsWith(currentMonth))
      return a + revs.reduce((b, r) => b + (r.ca || 0), 0)
    }, 0)
    montantEstime = caTotal * ((profile.pay_pct || 0) / 100)
  } else {
    montantEstime = pay.montant || 0
  }

  let nextPalier = null, progressPct = 0
  if (pay.type !== 'pct' && pay.palier) {
    const systeme = profile.pay_type === 'palier_a' ? 'A' : 'B'
    const allPaliers = paliers.filter(p => p.systeme === systeme).sort((a, b) => a.clics_min - b.clics_min)
    const currentIdx = allPaliers.findIndex(p => p.id === pay.palier?.id)
    nextPalier = allPaliers[currentIdx + 1] || null
    if (pay.palier && nextPalier) {
      const range = nextPalier.clics_min - pay.palier.clics_min
      progressPct = Math.min(100, Math.round(((totalClics - pay.palier.clics_min) / range) * 100))
    }
  }

  const mesComptes = data.accounts.filter(a => a.va_id === profile.id)
  const assignedModelIds = Array.isArray(profile.model_ids) ? profile.model_ids : []
  const mesModeles = models.filter(m => assignedModelIds.includes(m.id))

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: C.text }}>
          Bonjour, {profile.name?.split(' ')[0] || 'toi'} 👋
        </div>
        <div style={{ color: C.sub, fontSize: 14 }}>
          {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      <div style={{ ...st.card(24), background: `linear-gradient(135deg, ${C.accentDim}, ${C.surface})`, borderColor: C.accentGlow, marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 80, opacity: 0.05 }}>💰</div>
        <div style={{ ...st.cTitle, color: C.accent }}>Ma paie estimée ce mois</div>
        <div style={{ fontSize: 42, fontWeight: 800, color: C.accent, lineHeight: 1, marginBottom: 8 }}>
          ${Math.round(montantEstime).toLocaleString()}
        </div>
        <div style={{ color: C.sub, fontSize: 13, marginBottom: nextPalier ? 16 : 0 }}>
          {pay.type === 'pct' ? `${profile.pay_pct}% du CA généré` : `${totalClics.toLocaleString()} clics`}
        </div>
        {pay.type !== 'pct' && nextPalier && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.sub, marginBottom: 6 }}>
              <span>Prochain palier : ${nextPalier.taux}</span>
              <span>{nextPalier.clics_min - totalClics} clics restants</span>
            </div>
            <div style={{ background: C.border, borderRadius: 99, height: 6, overflow: 'hidden' }}>
              <div style={{ width: `${progressPct}%`, height: '100%', background: C.accent, borderRadius: 99, transition: 'width 0.5s' }}/>
            </div>
          </div>
        )}
      </div>

      <div style={{ ...st.g3, marginBottom: 20 }}>
        <StatCard label="Clics ce mois" value={totalClics.toLocaleString()} color={C.blue} icon="🖱️"/>
        <StatCard label="Comptes actifs" value={mesComptes.filter(a => a.statut === 'actif').length} sub={`${mesComptes.length} total`} color={C.green} icon="📱"/>
        <StatCard label="Modèles" value={mesModeles.length} color={C.purple} icon="◆"/>
      </div>

      {mesModeles.length > 0 && (
        <div style={st.card(18)}>
          <div style={st.cTitle}>Mes modèles</div>
          {mesModeles.map(m => {
            const revs = modelRevenue.filter(r => r.model_id === m.id && r.date?.startsWith(currentMonth))
            const ca = revs.reduce((a, r) => a + (r.ca || 0), 0)
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                <div style={st.avatar(m.color || C.accent)}>{(m.name||'?')[0].toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: C.text }}>{m.name}</div>
                  <div style={{ ...st.sub, color: C.sub }}>CA : ${ca.toLocaleString()}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
