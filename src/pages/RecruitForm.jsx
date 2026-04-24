import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

const INITIAL = {
  prenom: '', age: '', pays: '', whatsapp: '',
  disponible: '', telephone: '', nbTelephones: '', connexion: '',
  viralite: '', inspiration: '', cadreStrict: '', postingOk: '',
  reactionVues: '', longTerme: '', accepteRemuneration: ''
}

function getEliminationReason(f) {
  if (f.age === 'Moins de 18 ans') return 'age'
  if (f.disponible === 'Non') return 'disponible'
  if (f.telephone === 'Android') return 'telephone'
  if (f.connexion === 'Non') return 'connexion'
  if (f.postingOk === 'Non') return 'postingOk'
  if (f.longTerme === 'Non') return 'longTerme'
  if (f.accepteRemuneration === 'Non') return 'remuneration'
  return null
}

function wordCount(str) {
  return str.trim().split(/\s+/).filter(Boolean).length
}

function calcScore(f) {
  if (getEliminationReason(f) !== null) return 0
  let score = 0
  if (f.telephone === 'iPhone') score += 20
  if (f.nbTelephones === '2') score += 20
  else if (f.nbTelephones === '3+') score += 30
  if (f.connexion === 'Oui') score += 20
  if (wordCount(f.viralite) > 30) score += 10
  if (wordCount(f.inspiration) > 30) score += 10
  if (f.cadreStrict === 'Oui') score += 10
  else if (f.cadreStrict === 'Non') score -= 20
  if (f.postingOk === 'Oui') score += 10
  if (wordCount(f.reactionVues) > 20) score += 10
  if (f.longTerme === 'Oui') score += 10
  if (f.accepteRemuneration === 'Oui') score += 10
  return Math.max(0, Math.min(100, score))
}

const PALIERS = [
  { range: '< 7 500 clicks', amount: 'Fin de collaboration', danger: true },
  { range: '7 500 – 8 999', amount: '200$ ⚠️', warning: true },
  { range: '9 000 – 11 500', amount: '350$', highlight: true },
  { range: '15 000 – 18 999', amount: '500$', highlight: true },
  { range: '19 000 – 22 499', amount: '650$', highlight: true },
  { range: '22 500 – 26 999', amount: '800$', highlight: true },
  { range: '27 000', amount: '1 000$', highlight: true },
  { range: '+27 000', amount: '+100$ / 1 200 clicks', highlight: true },
]

const STEPS = ['Présentation', 'Profil', 'Configuration', 'Compétences', 'Rémunération']

export default function RecruitForm() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [eliminated, setEliminated] = useState(null)

  const TOTAL_STEPS = 5
  const progress = step === 0 ? 0 : Math.round((step / TOTAL_STEPS) * 100)

  function update(key, val) {
    setForm(p => ({ ...p, [key]: val }))
    setErrors(p => ({ ...p, [key]: undefined }))
  }

  function validate(s) {
    const e = {}
    if (s === 1) {
      if (!form.prenom.trim()) e.prenom = 'Ce champ est requis'
      if (!form.age) e.age = 'Sélectionne une option'
      if (!form.pays.trim()) e.pays = 'Ce champ est requis'
      if (!form.whatsapp.trim()) e.whatsapp = 'Ce champ est requis'
    }
    if (s === 2) {
      if (!form.disponible) e.disponible = 'Sélectionne une option'
      if (!form.telephone) e.telephone = 'Sélectionne une option'
      if (!form.nbTelephones) e.nbTelephones = 'Sélectionne une option'
      if (!form.connexion) e.connexion = 'Sélectionne une option'
    }
    if (s === 3) {
      if (!form.viralite.trim()) e.viralite = 'Ce champ est requis'
      if (!form.inspiration.trim()) e.inspiration = 'Ce champ est requis'
      if (!form.cadreStrict) e.cadreStrict = 'Sélectionne une option'
      if (!form.postingOk) e.postingOk = 'Sélectionne une option'
      if (!form.reactionVues.trim()) e.reactionVues = 'Ce champ est requis'
      if (!form.longTerme) e.longTerme = 'Sélectionne une option'
    }
    if (s === 4) {
      if (!form.accepteRemuneration) e.accepteRemuneration = 'Sélectionne une option'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit() {
    setLoading(true)
    const reason = getEliminationReason(form)
    const score = calcScore(form)
    const isEliminated = reason !== null || score < 60
    setEliminated(isEliminated)
    try {
      await supabase.from('candidatures').insert({
        prenom: form.prenom,
        pays: form.pays,
        whatsapp: form.whatsapp,
        age: form.age,
        disponible: form.disponible,
        telephone: form.telephone,
        nb_telephones: form.nbTelephones,
        connexion: form.connexion,
        viralite: form.viralite,
        inspiration: form.inspiration,
        cadre_strict: form.cadreStrict,
        posting_ok: form.postingOk,
        reaction_vues: form.reactionVues,
        long_terme: form.longTerme,
        accepte_remuneration: form.accepteRemuneration,
        score,
        eliminated: isEliminated,
        elimination_reason: reason,
        statut: isEliminated ? 'refusé' : 'nouveau',
        created_at: new Date().toISOString(),
      })
    } catch {}
    setLoading(false)
    setStep(5)
  }

  function next() {
    if (step === 0) { setStep(1); return }
    if (!validate(step)) return
    if (step === 4) { submit(); return }
    setStep(s => s + 1)
  }

  function back() { if (step > 0) setStep(s => s - 1) }

  const S = {
    page: { minHeight: '100vh', background: 'linear-gradient(160deg, #0a0a0a 0%, #111111 50%, #0d0d0d 100%)', fontFamily: "'Inter', sans-serif", color: '#e8e0d0', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px 80px' },
    logoWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '48px' },
    logoImg: { width: '90px', height: '90px', objectFit: 'contain' },
    logoName: { fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 300, letterSpacing: '4px', textTransform: 'uppercase', background: 'linear-gradient(135deg, #e84393, #e17055, #f39c12)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
    logoSub: { fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: '#666', fontWeight: 300 },
    progressBar: { width: '100%', maxWidth: '620px', marginBottom: '32px' },
    progressTrack: { height: '2px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' },
    progressFill: { height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #e84393, #e17055, #f39c12)', borderRadius: '2px', transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)' },
    progressLabel: { display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#555' },
    card: { width: '100%', maxWidth: '620px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(232,67,147,0.15)', borderRadius: '2px', padding: '48px 40px', backdropFilter: 'blur(10px)' },
    badge: { fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: '#e84393', marginBottom: '12px', display: 'block' },
    title: { fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', fontWeight: 300, lineHeight: 1.2, color: '#f0e8d8', marginBottom: '16px', letterSpacing: '0.5px' },
    text: { fontSize: '14px', lineHeight: 1.8, color: '#888', fontWeight: 300 },
    divider: { height: '1px', background: 'rgba(232,67,147,0.12)', margin: '32px 0' },
    fields: { display: 'flex', flexDirection: 'column', gap: '28px' },
    field: { display: 'flex', flexDirection: 'column', gap: '10px' },
    label: { fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#e84393', fontWeight: 500 },
    input: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(232,67,147,0.2)', borderRadius: '1px', padding: '12px 16px', fontSize: '14px', color: '#e8e0d0', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' },
    textarea: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(232,67,147,0.2)', borderRadius: '1px', padding: '14px 16px', fontSize: '14px', color: '#e8e0d0', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", resize: 'vertical', minHeight: '100px', lineHeight: 1.7, boxSizing: 'border-box' },
    choices: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
    choice: (active) => ({ padding: '10px 20px', fontSize: '13px', letterSpacing: '0.5px', border: active ? '1px solid #c9a84c' : '1px solid rgba(255,255,255,0.1)', background: active ? 'rgba(232,67,147,0.12)' : 'transparent', color: active ? '#c9a84c' : '#888', borderRadius: '1px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }),
    btnRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', gap: '16px' },
    btnPrimary: { padding: '14px 36px', fontSize: '12px', letterSpacing: '2.5px', textTransform: 'uppercase', background: 'linear-gradient(135deg, #e84393, #e17055)', border: 'none', borderRadius: '1px', color: '#0a0a0a', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" },
    btnSecondary: { padding: '14px 28px', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', background: 'transparent', border: '1px solid rgba(232,67,147,0.3)', borderRadius: '1px', color: '#777', cursor: 'pointer', fontFamily: "'Inter', sans-serif" },
    remuBox: { background: 'rgba(232,67,147,0.04)', border: '1px solid rgba(232,67,147,0.15)', borderRadius: '2px', padding: '28px', marginBottom: '28px' },
    remuTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 400, color: '#e84393', marginBottom: '20px', letterSpacing: '0.5px' },
    err: { fontSize: '12px', color: '#c0392b', marginTop: '6px' },
  }

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Inter:wght@300;400;500;600&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } input:focus,textarea:focus { border-color: rgba(232,67,147,0.6) !important; outline: none; } ::placeholder { color: #444; }`}</style>

      <div style={S.logoWrap}>
        <img src="/logo.png" alt="Imperium Agency" style={S.logoImg} onError={e => e.target.style.display='none'}/>
        <div style={S.logoName}>Imperium Agency</div>
        <div style={S.logoSub}>Recrutement VA Instagram</div>
      </div>

      {step > 0 && step < 5 && (
        <div style={S.progressBar}>
          <div style={S.progressTrack}><div style={S.progressFill}/></div>
          <div style={S.progressLabel}>
            <span>{STEPS[step - 1]}</span>
            <span>Étape {step} / {TOTAL_STEPS}</span>
          </div>
        </div>
      )}

      <div style={S.card}>

        {step === 0 && (
          <div>
            <span style={S.badge}>Candidature</span>
            <div style={S.title}>VA Instagram</div>
            <div style={S.divider}/>
            <p style={S.text}>Bienvenue. Remplis ce formulaire uniquement si tu es sérieux et disponible immédiatement. Les candidats retenus seront recontactés via Telegram.</p>
            <div style={{ ...S.btnRow, justifyContent: 'flex-end' }}>
              <button style={S.btnPrimary} onClick={next}>Commencer →</button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <span style={S.badge}>Étape 1 — Profil</span>
            <div style={S.title}>Qui es-tu ?</div>
            <div style={S.divider}/>
            <div style={S.fields}>
              <div style={S.field}>
                <label style={S.label}>Quel est ton prénom ?</label>
                <input style={S.input} value={form.prenom} onChange={e => update('prenom', e.target.value)} placeholder="Ton prénom"/>
                {errors.prenom && <span style={S.err}>{errors.prenom}</span>}
              </div>
              <div style={S.field}>
                <label style={S.label}>Quel âge as-tu ?</label>
                <div style={S.choices}>
                  {['Moins de 18 ans','18–25 ans','26 ans et plus'].map(o => <button key={o} style={S.choice(form.age===o)} onClick={()=>update('age',o)}>{o}</button>)}
                </div>
                {errors.age && <span style={S.err}>{errors.age}</span>}
              </div>
              <div style={S.field}>
                <label style={S.label}>Dans quel pays vis-tu ?</label>
                <input style={S.input} value={form.pays} onChange={e=>update('pays',e.target.value)} placeholder="Ex: France, Maroc, Belgique…"/>
                {errors.pays && <span style={S.err}>{errors.pays}</span>}
              </div>
              <div style={S.field}>
                <label style={S.label}>Comment peut-on te contacter ? Numéro WhatsApp</label>
                <input style={S.input} value={form.whatsapp} onChange={e=>update('whatsapp',e.target.value)} placeholder="+33 6 XX XX XX XX"/>
                {errors.whatsapp && <span style={S.err}>{errors.whatsapp}</span>}
              </div>
            </div>
            <div style={S.btnRow}>
              <button style={S.btnSecondary} onClick={back}>← Retour</button>
              <button style={S.btnPrimary} onClick={next}>Suivant →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <span style={S.badge}>Étape 2 — Configuration de travail</span>
            <div style={S.title}>Ton setup</div>
            <div style={S.divider}/>
            <div style={S.fields}>
              <div style={S.field}>
                <label style={S.label}>Es-tu disponible tous les jours, week-end inclus ?</label>
                <div style={S.choices}>
                  {['Oui','Non'].map(o=><button key={o} style={S.choice(form.disponible===o)} onClick={()=>update('disponible',o)}>{o}</button>)}
                </div>
                {errors.disponible && <span style={S.err}>{errors.disponible}</span>}
              </div>
              <div style={S.field}>
                <label style={S.label}>Quel téléphone utilises-tu ?</label>
                <div style={S.choices}>
                  {['iPhone','Android'].map(o=><button key={o} style={S.choice(form.telephone===o)} onClick={()=>update('telephone',o)}>{o}</button>)}
                </div>
                {errors.telephone && <span style={S.err}>{errors.telephone}</span>}
              </div>
              <div style={S.field}>
                <label style={S.label}>Combien as-tu de téléphones ?</label>
                <div style={S.choices}>
                  {['1','2','3+'].map(o=><button key={o} style={S.choice(form.nbTelephones===o)} onClick={()=>update('nbTelephones',o)}>{o}</button>)}
                </div>
                {errors.nbTelephones && <span style={S.err}>{errors.nbTelephones}</span>}
              </div>
              <div style={S.field}>
                <label style={S.label}>As-tu de la 4G ou 5G pour travailler ? (pas de Wi-Fi)</label>
                <div style={S.choices}>
                  {['Oui','Non'].map(o=><button key={o} style={S.choice(form.connexion===o)} onClick={()=>update('connexion',o)}>{o}</button>)}
                </div>
                {errors.connexion && <span style={S.err}>{errors.connexion}</span>}
              </div>
            </div>
            <div style={S.btnRow}>
              <button style={S.btnSecondary} onClick={back}>← Retour</button>
              <button style={S.btnPrimary} onClick={next}>Suivant →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <span style={S.badge}>Étape 3 — Compétences & Mindset</span>
            <div style={S.title}>Ton état d'esprit</div>
            <div style={S.divider}/>
            <div style={S.fields}>
              <div style={S.field}>
                <label style={S.label}>D'après toi, qu'est-ce qui fait qu'un reel devient viral ?</label>
                <textarea style={S.textarea} value={form.viralite} onChange={e=>update('viralite',e.target.value)} placeholder="Développe ta réponse…"/>
                {errors.viralite && <span style={S.err}>{errors.viralite}</span>}
              </div>
              <div style={S.field}>
                <label style={S.label}>Comment t'inspires-tu pour trouver des idées de reels ?</label>
                <textarea style={S.textarea} value={form.inspiration} onChange={e=>update('inspiration',e.target.value)} placeholder="Développe ta réponse…"/>
                {errors.inspiration && <span style={S.err}>{errors.inspiration}</span>}
              </div>
              <div style={S.field}>
                <label style={S.label}>Es-tu à l'aise avec un cadre strict et des règles précises à respecter ?</label>
                <div style={S.choices}>
                  {['Oui','Non'].map(o=><button key={o} style={S.choice(form.cadreStrict===o)} onClick={()=>update('cadreStrict',o)}>{o}</button>)}
                </div>
                {errors.cadreStrict && <span style={S.err}>{errors.cadreStrict}</span>}
              </div>
              <div style={S.field}>
                <label style={S.label}>Si on te demande de poster 1 reel par compte entre 17h et 20h tous les jours sur 3 comptes, c'est OK ?</label>
                <div style={S.choices}>
                  {['Oui','Non'].map(o=><button key={o} style={S.choice(form.postingOk===o)} onClick={()=>update('postingOk',o)}>{o}</button>)}
                </div>
                {errors.postingOk && <span style={S.err}>{errors.postingOk}</span>}
              </div>
              <div style={S.field}>
                <label style={S.label}>Comment réagis-tu si une vidéo ne fait aucune vue ?</label>
                <textarea style={S.textarea} value={form.reactionVues} onChange={e=>update('reactionVues',e.target.value)} placeholder="Développe ta réponse…"/>
                {errors.reactionVues && <span style={S.err}>{errors.reactionVues}</span>}
              </div>
              <div style={S.field}>
                <label style={S.label}>Cherches-tu une collaboration sur le long terme ?</label>
                <div style={S.choices}>
                  {['Oui','Non'].map(o=><button key={o} style={S.choice(form.longTerme===o)} onClick={()=>update('longTerme',o)}>{o}</button>)}
                </div>
                {errors.longTerme && <span style={S.err}>{errors.longTerme}</span>}
              </div>
            </div>
            <div style={S.btnRow}>
              <button style={S.btnSecondary} onClick={back}>← Retour</button>
              <button style={S.btnPrimary} onClick={next}>Suivant →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <span style={S.badge}>Étape 4 — Rémunération</span>
            <div style={S.title}>Plan de rémunération</div>
            <div style={S.divider}/>
            <div style={S.remuBox}>
              <div style={S.remuTitle}>💰 Fixe : 200$ / mois</div>
              <div style={{ fontSize:'11px',letterSpacing:'2px',textTransform:'uppercase',color:'#555',marginBottom:'16px' }}>Performance cumulée — 3 comptes</div>
              {PALIERS.map(p => (
                <div key={p.range} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize:'13px',color:p.danger?'#c0392b':'#aaa' }}>{p.range}</span>
                  <span style={{ fontSize:'13px',fontWeight:600,color:p.danger?'#c0392b':p.warning?'#e8a020':'#f39c12' }}>{p.amount}</span>
                </div>
              ))}
            </div>
            <div style={S.field}>
              <label style={S.label}>Acceptes-tu ce modèle de rémunération ?</label>
              <div style={S.choices}>
                {['Oui','Non'].map(o=><button key={o} style={S.choice(form.accepteRemuneration===o)} onClick={()=>update('accepteRemuneration',o)}>{o}</button>)}
              </div>
              {errors.accepteRemuneration && <span style={S.err}>{errors.accepteRemuneration}</span>}
            </div>
            <div style={S.btnRow}>
              <button style={S.btnSecondary} onClick={back}>← Retour</button>
              <button style={{ ...S.btnPrimary, opacity: loading ? 0.6 : 1 }} onClick={next} disabled={loading}>
                {loading ? 'Envoi…' : 'Soumettre →'}
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            {eliminated ? (
              <div style={{ textAlign:'center',padding:'20px' }}>
                <span style={{ fontSize:'40px',marginBottom:'20px',display:'block' }}>—</span>
                <div style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:'26px',fontWeight:300,color:'#888',marginBottom:'16px' }}>Candidature examinée</div>
                <div style={S.divider}/>
                <p style={{ fontSize:'14px',color:'#555',lineHeight:1.8 }}>Ton profil ne correspond pas aux critères requis.</p>
              </div>
            ) : (
              <div style={{ textAlign:'center',padding:'20px' }}>
                <div style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:'28px',fontWeight:300,color:'#e84393',marginBottom:'16px' }}>Candidature reçue</div>
                <div style={S.divider}/>
                <p style={{ fontSize:'14px',color:'#888',lineHeight:1.8 }}>Candidature reçue. Tu seras recontacté sur Telegram si ton profil est retenu.</p>
                <a href="https://t.me/+vj9jGPOJlog3MWQ0" target="_blank" rel="noopener noreferrer"
                  style={{ display:'inline-block',marginTop:'24px',padding:'14px 32px',border:'1px solid rgba(232,67,147,0.4)',borderRadius:'1px',color:'#e84393',fontSize:'12px',letterSpacing:'2px',textTransform:'uppercase',textDecoration:'none' }}>
                  Rejoindre Telegram →
                </a>
              </div>
            )}
          </div>
        )}

      </div>

      <div style={{ marginTop:'48px',fontSize:'10px',letterSpacing:'2px',color:'#333',textTransform:'uppercase' }}>
        Imperium Agency © {new Date().getFullYear()}
      </div>
    </div>
  )
}
