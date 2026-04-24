import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

const GOLD = '#C8A96E'
const BG = '#0a0a12'
const SURFACE = '#12121e'
const BORDER = '#1e1e3a'
const TEXT = '#f0f0f8'
const SUB = '#8888aa'

export default function RecruitForm() {
  const [step, setStep] = useState(1)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    prenom: '',
    age: '',
    ville: '',
    pays: '',
    disponibilite: '',
    heures_par_jour: '',
    experience_chatting: '',
    plateformes: [],
    motivation: '',
    objectif: '',
    qualites: '',
    situation: '',
    materiel: '',
    telegram: '',
    email: '',
    comment_trouve: '',
  })

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const togglePlatform = (p) => {
    setForm(prev => ({
      ...prev,
      plateformes: prev.plateformes.includes(p)
        ? prev.plateformes.filter(x => x !== p)
        : [...prev.plateformes, p]
    }))
  }

  async function submit() {
    setSending(true)
    setError('')
    try {
      const { error: err } = await supabase.from('candidatures').insert({
        ...form,
        age: form.age ? Number(form.age) : null,
        statut: 'nouveau',
        created_at: new Date().toISOString(),
      })
      if (err) throw err
      setSent(true)
    } catch(e) {
      setError("Une erreur est survenue. Réessaie dans quelques instants.")
    }
    setSending(false)
  }

  const inp = {
    width: '100%', background: '#1a1a2e', border: `1px solid ${BORDER}`,
    borderRadius: 8, padding: '10px 14px', color: TEXT, fontSize: 14,
    fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box',
  }

  const label = {
    display: 'block', fontSize: 12, fontWeight: 700, color: SUB,
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
  }

  const btn = (variant = 'primary') => ({
    background: variant === 'primary' ? GOLD : 'transparent',
    color: variant === 'primary' ? '#0a0a12' : SUB,
    border: variant === 'ghost' ? `1px solid ${BORDER}` : 'none',
    borderRadius: 9, padding: '11px 24px', fontSize: 14, fontWeight: 700,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
  })

  if (sent) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>🎉</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: TEXT, marginBottom: 12 }}>Candidature envoyée !</div>
          <div style={{ color: SUB, fontSize: 15, lineHeight: 1.7 }}>
            Merci pour ta candidature. Notre équipe va l'étudier et te contactera via Telegram ou email dans les prochains jours.
          </div>
          <div style={{ marginTop: 32, padding: '16px 20px', background: SURFACE, borderRadius: 10, border: `1px solid ${BORDER}`, color: SUB, fontSize: 13 }}>
            Tu peux fermer cette page.
          </div>
        </div>
      </div>
    )
  }

  const PLATFORMS = ['OnlyFans', 'MYM', 'Fansly', 'Instagram', 'TikTok', 'Twitter/X']
  const DISPO = ['Temps plein (8h+)', 'Mi-temps (4-6h)', 'Flexible', 'Soir / nuit uniquement']
  const SITUATION = ['Étudiant(e)', 'Sans emploi', 'En poste (side income)', 'Freelance', 'Autre']

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'DM Sans', sans-serif", color: TEXT }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus, textarea:focus, select:focus { border-color: ${GOLD} !important; outline: none; }
        ::placeholder { color: #444466; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius: 99px; }
      `}</style>

      {/* Header */}
      <div style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <img src="/logo.png" alt="IMPERIUM" style={{ height: 36, objectFit: 'contain' }} onError={e => e.target.style.display='none'}/>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: SUB, letterSpacing: '0.2em' }}>AGENCY</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>IMPERIUM</div>
        </div>
      </div>

      <div style={{ maxWidth: 620, margin: '0 auto', padding: '32px 24px 60px' }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Rejoins l'équipe IMPERIUM</div>
          <div style={{ color: SUB, fontSize: 15, lineHeight: 1.6 }}>
            On recrute des Virtual Assistants motivés pour gérer des comptes OnlyFans.
            Remplis ce formulaire et notre équipe te contactera.
          </div>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 99, background: s <= step ? GOLD : BORDER, transition: 'background 0.3s' }}/>
          ))}
        </div>
        <div style={{ color: SUB, fontSize: 12, marginBottom: 24, textAlign: 'center' }}>
          Étape {step} / 3 — {step === 1 ? 'Profil' : step === 2 ? 'Expérience & Dispo' : 'Motivation & Contact'}
        </div>

        {/* Step 1 — Profil */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={label}>Prénom *</label>
                <input style={inp} value={form.prenom} onChange={e => f('prenom', e.target.value)} placeholder="Ton prénom"/>
              </div>
              <div>
                <label style={label}>Âge *</label>
                <input type="number" style={inp} value={form.age} onChange={e => f('age', e.target.value)} placeholder="Ex: 22" min="18"/>
              </div>
              <div>
                <label style={label}>Ville</label>
                <input style={inp} value={form.ville} onChange={e => f('ville', e.target.value)} placeholder="Paris"/>
              </div>
              <div>
                <label style={label}>Pays *</label>
                <input style={inp} value={form.pays} onChange={e => f('pays', e.target.value)} placeholder="France"/>
              </div>
            </div>

            <div>
              <label style={label}>Situation actuelle</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {SITUATION.map(s => (
                  <button key={s} type="button" onClick={() => f('situation', s)} style={{
                    background: form.situation === s ? GOLD : 'transparent',
                    color: form.situation === s ? '#0a0a12' : SUB,
                    border: `1px solid ${form.situation === s ? GOLD : BORDER}`,
                    borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}>{s}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={label}>Matériel disponible</label>
              <input style={inp} value={form.materiel} onChange={e => f('materiel', e.target.value)} placeholder="PC, téléphone, connexion stable..."/>
            </div>
          </div>
        )}

        {/* Step 2 — Expérience & Dispo */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={label}>Disponibilité *</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {DISPO.map(d => (
                  <button key={d} type="button" onClick={() => f('disponibilite', d)} style={{
                    background: form.disponibilite === d ? GOLD : 'transparent',
                    color: form.disponibilite === d ? '#0a0a12' : SUB,
                    border: `1px solid ${form.disponibilite === d ? GOLD : BORDER}`,
                    borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}>{d}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={label}>Heures disponibles par jour</label>
              <input style={inp} value={form.heures_par_jour} onChange={e => f('heures_par_jour', e.target.value)} placeholder="Ex: 6h par jour"/>
            </div>

            <div>
              <label style={label}>Expérience en chatting / VA *</label>
              <textarea style={{ ...inp, minHeight: 90, resize: 'vertical' }}
                value={form.experience_chatting}
                onChange={e => f('experience_chatting', e.target.value)}
                placeholder="Décris ton expérience : agences, plateformes, durée... (Débutant accepté)"/>
            </div>

            <div>
              <label style={label}>Plateformes connues</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PLATFORMS.map(p => (
                  <button key={p} type="button" onClick={() => togglePlatform(p)} style={{
                    background: form.plateformes.includes(p) ? GOLD : 'transparent',
                    color: form.plateformes.includes(p) ? '#0a0a12' : SUB,
                    border: `1px solid ${form.plateformes.includes(p) ? GOLD : BORDER}`,
                    borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}>{p}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Motivation & Contact */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={label}>Pourquoi veux-tu rejoindre IMPERIUM ? *</label>
              <textarea style={{ ...inp, minHeight: 100, resize: 'vertical' }}
                value={form.motivation}
                onChange={e => f('motivation', e.target.value)}
                placeholder="Sois sincère — qu'est-ce qui t'attire dans ce poste ?"/>
            </div>

            <div>
              <label style={label}>Ton objectif financier mensuel</label>
              <input style={inp} value={form.objectif} onChange={e => f('objectif', e.target.value)} placeholder="Ex: 1500€/mois"/>
            </div>

            <div>
              <label style={label}>Tes 3 meilleures qualités pour ce poste</label>
              <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }}
                value={form.qualites}
                onChange={e => f('qualites', e.target.value)}
                placeholder="Ex: Persévérant, à l'écoute, réactif..."/>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={label}>Telegram *</label>
                <input style={inp} value={form.telegram} onChange={e => f('telegram', e.target.value)} placeholder="@tonpseudo"/>
              </div>
              <div>
                <label style={label}>Email *</label>
                <input type="email" style={inp} value={form.email} onChange={e => f('email', e.target.value)} placeholder="ton@email.com"/>
              </div>
            </div>

            <div>
              <label style={label}>Comment tu as entendu parler de nous ?</label>
              <input style={inp} value={form.comment_trouve} onChange={e => f('comment_trouve', e.target.value)} placeholder="Instagram, bouche à oreille, TikTok..."/>
            </div>

            {error && (
              <div style={{ background: 'rgba(224,85,85,0.1)', border: '1px solid rgba(224,85,85,0.4)', borderRadius: 8, padding: '12px 16px', color: '#E05555', fontSize: 13 }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
          {step > 1
            ? <button style={btn('ghost')} onClick={() => setStep(s => s - 1)}>← Retour</button>
            : <div/>
          }
          {step < 3
            ? <button style={btn('primary')} onClick={() => {
                if (step === 1 && (!form.prenom || !form.age || !form.pays)) {
                  setError('Remplis les champs obligatoires (*)'); return
                }
                setError('')
                setStep(s => s + 1)
              }}>Continuer →</button>
            : <button style={{ ...btn('primary'), opacity: sending ? 0.7 : 1 }}
                onClick={submit} disabled={sending || !form.motivation || !form.telegram || !form.email}>
                {sending ? 'Envoi...' : 'Envoyer ma candidature ✓'}
              </button>
          }
        </div>
      </div>
    </div>
  )
}
