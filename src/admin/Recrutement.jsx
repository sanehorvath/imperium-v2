import React, { useState } from 'react'
import { C, st } from '../lib/design'

const ETAPES = [
  { id: 'lead',       label: 'Lead capturé',     icon: '📥', color: C.blue   || '#3b82f6', alert_h: 48  },
  { id: 'prequalif',  label: 'Pré-qualification', icon: '🔍', color: '#8b5cf6',             alert_h: 120 },
  { id: 'call_plan',  label: 'Call planifié',     icon: '📅', color: C.orange || '#f97316', alert_h: 120 },
  { id: 'discovery',  label: 'Discovery call',   icon: '🎯', color: C.accent || '#f59e0b', alert_h: 72  },
  { id: 'onboarding', label: 'Onboarding',       icon: '🚀', color: C.green  || '#10b981', alert_h: null},
]

const DEMO_CANDIDATES = [
  { id:'r1', nom:'Marco Santini',   whatsapp:'+39 333 444 5555',  email:'marco@example.com',  source:'LinkedIn Jobs',  zones:['Phuket','Bali'],  reseau:'10-15', disponibilite:'Temps plein', commission:'Oui',         message:"7 ans dans l'hôtellerie de luxe en Asie du Sud-Est.", etape:'lead',      statut:'actif',  created_at: new Date(Date.now()-50*3600000).toISOString(), notes:[], score:null, criteres:{}, call_date:null, call_canal:null, call_notes:'', decision:null, contacts:[], file_name:null, file_url:null },
  { id:'r2', nom:'Sophie Laurent',  whatsapp:'+33 6 12 34 56 78', email:'sophie@example.com', source:'Recommandation', zones:['Samui'],          reseau:'5-10',  disponibilite:'20-30h',     commission:'À discuter',  message:'Directrice commerciale hôtel 5★ Samui depuis 3 ans.',  etape:'prequalif', statut:'actif',  created_at: new Date(Date.now()-72*3600000).toISOString(), notes:[{text:'Très bon profil',date:new Date().toISOString(),author:'Sane'}], score:null, criteres:{zone:true,reseau:true,commission:true,dispo:true,background:true}, call_date:null, call_canal:null, call_notes:'', decision:null, contacts:[], file_name:null, file_url:null },
  { id:'r3', nom:'James Thornton',  whatsapp:'+44 7890 123456',   email:'james@example.com',  source:'Meta Ads',       zones:['Phuket'],         reseau:'15+',   disponibilite:'Temps plein', commission:'Oui',         message:'Ex-GM Marriott Phuket. Réseau de 20+ établissements.', etape:'call_plan', statut:'actif',  created_at: new Date(Date.now()-30*3600000).toISOString(), notes:[], score:null, criteres:{zone:true,reseau:true,commission:true,dispo:true,background:true}, call_date: new Date(Date.now()+24*3600000).toISOString().split('T')[0], call_canal:'Zoom', call_notes:'', decision:null, contacts:[], file_name:null, file_url:null },
  { id:'r4', nom:'Aisha Okonkwo',   whatsapp:'+234 812 345 6789', email:'aisha@example.com',  source:'Chasse directe', zones:['Bali','Pattaya'], reseau:'5-10',  disponibilite:'10-20h',     commission:'Oui',         message:'Consultante hospitality Bali & Pattaya.',              etape:'discovery', statut:'actif',  created_at: new Date(Date.now()-24*3600000).toISOString(), notes:[{text:'Call réalisé 18/04. Très motivée.',date:new Date().toISOString(),author:'Hugo'}], score:15, criteres:{zone:true,reseau:true,commission:true,dispo:false,background:true}, call_date: new Date(Date.now()-24*3600000).toISOString().split('T')[0], call_canal:'WhatsApp vidéo', call_notes:'Excellent réseau Bali.', decision:'go', contacts:['Alaya Resort','Katamama','W Bali','Como Uma','Potato Head'], file_name:null, file_url:null },
  { id:'r5', nom:'Remi Beaumont',   whatsapp:'+66 91 234 5678',   email:'remi@example.com',   source:'Post organique', zones:['Phuket'],         reseau:'1-5',   disponibilite:'Flexible',   commission:'Non',         message:"Freelance événementiel.",                              etape:'lead',      statut:'no_go',  created_at: new Date(Date.now()-96*3600000).toISOString(), notes:[{text:'Commission refusée',date:new Date().toISOString(),author:'Sane'}], score:null, criteres:{}, call_date:null, call_canal:null, call_notes:'', decision:'no_go', contacts:[], file_name:null, file_url:null },
]

function hoursAgo(iso) {
  return Math.round((Date.now() - new Date(iso).getTime()) / 3600000)
}
function isBlocked(c) {
  const e = ETAPES.find(x => x.id === c.etape)
  return e?.alert_h && hoursAgo(c.created_at) > e.alert_h && c.statut === 'actif'
}
function fmtAgo(iso) {
  const h = hoursAgo(iso)
  if (h < 1) return "À l'instant"
  if (h < 24) return `Il y a ${h}h`
  return `Il y a ${Math.floor(h/24)}j`
}
function fmtD(iso) {
  if (!iso) return '–'
  return new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' })
}

export default function Recrutement() {
  const [candidates, setCandidates] = useState(DEMO_CANDIDATES)
  const [filterEtape, setFilterEtape] = useState('all')
  const [filterZone,  setFilterZone]  = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [noteInput, setNoteInput] = useState('')

  const active = candidates.filter(c => c.statut === 'actif')

  let items = [...candidates]
  if (filterEtape !== 'all') items = items.filter(c => c.etape === filterEtape)
  if (filterZone  !== 'all') items = items.filter(c => (c.zones||[]).includes(filterZone))
  if (search) { const s = search.toLowerCase(); items = items.filter(c => c.nom.toLowerCase().includes(s) || c.email.toLowerCase().includes(s)) }

  const blocked = candidates.filter(c => isBlocked(c)).length

  function update(id, patch) {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
    if (selected?.id === id) setSelected(prev => ({ ...prev, ...patch }))
  }

  function addNote(c) {
    if (!noteInput.trim()) return
    const newNote = { text: noteInput.trim(), date: new Date().toISOString(), author: 'Vous' }
    update(c.id, { notes: [...(c.notes||[]), newNote] })
    setNoteInput('')
  }

  const card = { background: C.surface2 || '#1c2030', border: `1px solid ${C.border || '#252a38'}`, borderRadius: 10, padding: 16 }
  const badge = (color) => ({ background: color+'22', color, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace:'nowrap' })
  const btn = (color='accent') => ({
    background: color === 'red' ? 'rgba(239,68,68,.12)' : color === 'green' ? 'rgba(16,185,129,.12)' : `${C.accent}22`,
    color: color === 'red' ? '#ef4444' : color === 'green' ? '#10b981' : C.accent,
    border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
  })

  // ── Detail panel ───────────────────────────────────────────
  if (selected) {
    const c = candidates.find(x => x.id === selected.id) || selected
    const etape = ETAPES.find(e => e.id === c.etape)
    const criteresItems = [
      { key:'zone',       label:'Zone match' },
      { key:'reseau',     label:'Réseau ≥ 1 établissement' },
      { key:'commission', label:'Accepte commission' },
      { key:'dispo',      label:'Disponibilité ≥ 10h/sem' },
      { key:'background', label:'Background pertinent' },
    ]

    return (
      <div style={{ maxWidth: 720 }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <button onClick={() => setSelected(null)} style={{ ...btn(), padding:'6px 14px', fontSize:13 }}>← Retour</button>
          <div>
            <div style={{ fontSize:18, fontWeight:700 }}>{c.nom}</div>
            <div style={{ fontSize:12, color: C.sub||'#8b90a0' }}>{c.email} · {c.whatsapp}</div>
          </div>
          <span style={{ ...badge(etape?.color||C.accent), marginLeft:'auto' }}>{etape?.icon} {etape?.label}</span>
          {c.score !== null && <span style={{ ...badge(C.accent||'#f59e0b') }}>Score : {c.score}/20</span>}
        </div>

        {isBlocked(c) && (
          <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', color:'#ef4444', padding:'8px 14px', borderRadius:8, marginBottom:16, fontSize:13 }}>
            ⚠️ Bloqué depuis {hoursAgo(c.created_at)}h (seuil : {etape?.alert_h}h)
          </div>
        )}

        {/* Infos */}
        <div style={{ ...card, marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.sub, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:12 }}>Informations</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:13 }}>
            {[['Source', c.source], ['Zones', (c.zones||[]).join(', ')], ['Réseau', c.reseau], ['Dispo', c.disponibilite], ['Commission', c.commission], ['Reçu', fmtD(c.created_at)]].map(([k,v]) => (
              <div key={k}><span style={{ color:C.sub }}>{k} : </span>{v||'–'}</div>
            ))}
          </div>
          {c.message && <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${C.border}`, fontSize:13, color:C.sub, lineHeight:1.6 }}>"{c.message}"</div>}
        </div>

        {/* Pièce jointe */}
        {c.file_name && (
          <div style={{ ...card, marginBottom:14, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:20 }}>📎</span>
            <span style={{ flex:1, fontSize:13, fontWeight:500 }}>{c.file_name}</span>
            {c.file_url && <a href={c.file_url} target="_blank" rel="noopener" style={{ ...btn('green'), textDecoration:'none' }}>Télécharger ↗</a>}
          </div>
        )}

        {/* Pipeline */}
        <div style={{ ...card, marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.sub, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:12 }}>Avancer dans le pipeline</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom: (c.etape==='lead'||c.etape==='prequalif') ? 14 : 0 }}>
            {ETAPES.map(e => (
              <button key={e.id} onClick={() => update(c.id, { etape:e.id, statut: e.id==='onboarding'?'actif':c.statut })}
                style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${c.etape===e.id?e.color:C.border}`, background: c.etape===e.id?e.color+'22':'transparent', color: c.etape===e.id?e.color:C.sub||'#8b90a0', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                {e.icon} {e.label}
              </button>
            ))}
          </div>

          {/* Critères pré-qualif */}
          {(c.etape==='lead'||c.etape==='prequalif') && (
            <>
              <div style={{ fontSize:11, fontWeight:700, color:C.sub, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Critères pré-qualification</div>
              {criteresItems.map(cr => (
                <div key={cr.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 10px', background: C.surface||'#1c2030', borderRadius:6, marginBottom:6, fontSize:13 }}>
                  <span>{cr.label}</span>
                  <div style={{ display:'flex', gap:5 }}>
                    <button onClick={() => update(c.id, { criteres:{...c.criteres,[cr.key]:true} })} style={{ padding:'3px 10px', borderRadius:4, border:'none', background: c.criteres?.[cr.key]===true?'#10b981':'rgba(255,255,255,.05)', color: c.criteres?.[cr.key]===true?'#fff':C.sub, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>✓ Oui</button>
                    <button onClick={() => update(c.id, { criteres:{...c.criteres,[cr.key]:false} })} style={{ padding:'3px 10px', borderRadius:4, border:'none', background: c.criteres?.[cr.key]===false?'#ef4444':'rgba(255,255,255,.05)', color: c.criteres?.[cr.key]===false?'#fff':C.sub, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>✗ Non</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Call */}
        {(c.etape==='call_plan'||c.etape==='discovery') && (
          <div style={{ ...card, marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.sub, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:12 }}>Call / RDV</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <div>
                <div style={{ fontSize:11, color:C.sub, marginBottom:4 }}>Date</div>
                <input type="date" value={c.call_date||''} onChange={e => update(c.id,{call_date:e.target.value})} style={{ width:'100%', background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:'7px 10px', color:C.text, fontSize:13, fontFamily:'inherit' }}/>
              </div>
              <div>
                <div style={{ fontSize:11, color:C.sub, marginBottom:4 }}>Canal</div>
                <select value={c.call_canal||''} onChange={e => update(c.id,{call_canal:e.target.value})} style={{ width:'100%', background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:'7px 10px', color:C.text, fontSize:13, fontFamily:'inherit' }}>
                  <option value="">–</option>
                  {['Zoom','WhatsApp vidéo','Téléphone','RDV physique'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            {c.etape==='discovery' && (
              <>
                <div style={{ fontSize:11, color:C.sub, marginBottom:4 }}>Notes du call</div>
                <textarea value={c.call_notes||''} onChange={e => update(c.id,{call_notes:e.target.value})} rows={3} placeholder="Observations..." style={{ width:'100%', background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:'8px 10px', color:C.text, fontSize:13, fontFamily:'inherit', resize:'vertical', marginBottom:10 }}/>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:11, color:C.sub, marginBottom:4 }}>Score /20</div>
                    <input type="number" min={0} max={20} value={c.score||''} onChange={e => update(c.id,{score:parseFloat(e.target.value)||null})} placeholder="Ex: 15" style={{ width:'100%', background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:'7px 10px', color:C.text, fontSize:13, fontFamily:'inherit' }}/>
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:C.sub, marginBottom:4 }}>Décision</div>
                    <select value={c.decision||''} onChange={e => {
                      const val = e.target.value
                      update(c.id, { decision:val||null, etape: val==='go'?'onboarding':c.etape, statut: val==='no_go'?'no_go':c.statut })
                    }} style={{ width:'100%', background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:'7px 10px', color:C.text, fontSize:13, fontFamily:'inherit' }}>
                      <option value="">– En attente –</option>
                      <option value="go">✅ Go → Onboarding</option>
                      <option value="no_go">❌ No-go</option>
                      <option value="call2">🔄 Second call</option>
                    </select>
                  </div>
                </div>
                <div style={{ fontSize:11, color:C.sub, marginBottom:4 }}>5 contacts cités (un par ligne)</div>
                <textarea value={(c.contacts||[]).join('\n')} onChange={e => update(c.id,{contacts:e.target.value.split('\n').map(s=>s.trim()).filter(Boolean)})} rows={4} placeholder={"Établissement 1\nÉtablissement 2..."} style={{ width:'100%', background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:'8px 10px', color:C.text, fontSize:13, fontFamily:'inherit', resize:'vertical' }}/>
              </>
            )}
          </div>
        )}

        {/* Notes internes */}
        <div style={{ ...card, marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.sub, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:12 }}>Notes internes</div>
          {(c.notes||[]).map((n,i) => (
            <div key={i} style={{ background:C.surface, borderRadius:6, padding:'8px 12px', marginBottom:8, fontSize:13 }}>
              <div style={{ fontWeight:500, marginBottom:2 }}>{n.text}</div>
              <div style={{ fontSize:11, color:C.sub }}>{n.author} · {fmtD(n.date)}</div>
            </div>
          ))}
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <input value={noteInput} onChange={e => setNoteInput(e.target.value)} onKeyDown={e => e.key==='Enter'&&addNote(c)} placeholder="Ajouter une note..." style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:'7px 12px', color:C.text, fontSize:13, fontFamily:'inherit' }}/>
            <button onClick={() => addNote(c)} style={{ ...btn(), padding:'7px 16px', fontSize:13 }}>Ajouter</button>
          </div>
        </div>

        {/* No-go */}
        {c.statut !== 'no_go' && (
          <button onClick={() => { if(window.confirm(`No-go pour ${c.nom} ?`)) { update(c.id,{statut:'no_go',decision:'no_go'}); setSelected(null) }}}
            style={{ ...btn('red'), width:'100%', padding:'10px', fontSize:13, textAlign:'center' }}>
            ❌ Marquer No-go — sortir du pipeline
          </button>
        )}
      </div>
    )
  }

  // ── List view ──────────────────────────────────────────────
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ fontSize:18, fontWeight:700 }}>Recrutement Solaire</h2>
        {blocked > 0 && <span style={{ ...badge('#ef4444') }}>⚠️ {blocked} candidat{blocked>1?'s':''} bloqué{blocked>1?'s':''}</span>}
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Candidats actifs',  value: active.length,                                    color: C.accent },
          { label:'En lead',           value: active.filter(c=>c.etape==='lead').length,         color: '#3b82f6' },
          { label:'En qualification',  value: active.filter(c=>['prequalif','call_plan','discovery'].includes(c.etape)).length, color:'#8b5cf6' },
          { label:'En onboarding',     value: active.filter(c=>c.etape==='onboarding').length,   color: '#10b981' },
        ].map(k => (
          <div key={k.label} style={{ ...card }}>
            <div style={{ fontSize:11, color:C.sub, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>{k.label}</div>
            <div style={{ fontSize:24, fontWeight:700, color:k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div style={{ ...card, marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.sub, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:14 }}>Pipeline</div>
        <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap' }}>
          {ETAPES.map((e, i) => {
            const n = active.filter(c => c.etape===e.id).length
            const pct = active.length ? Math.round(n/active.length*100) : 0
            return (
              <React.Fragment key={e.id}>
                <div onClick={() => setFilterEtape(filterEtape===e.id?'all':e.id)}
                  style={{ flex:1, minWidth:90, textAlign:'center', padding:'10px 8px', borderRadius:8, border:`1px solid ${filterEtape===e.id?e.color:C.border}`, background: filterEtape===e.id?e.color+'18':C.surface, cursor:'pointer', transition:'all .15s' }}>
                  <div style={{ fontSize:18, marginBottom:4 }}>{e.icon}</div>
                  <div style={{ fontSize:10, color:C.sub, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4 }}>{e.label}</div>
                  <div style={{ fontSize:22, fontWeight:700, color:e.color }}>{n}</div>
                  <div style={{ height:4, background:C.border, borderRadius:2, overflow:'hidden', marginTop:6 }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:e.color, borderRadius:2, transition:'width .5s' }}/>
                  </div>
                </div>
                {i < ETAPES.length-1 && <div style={{ color:C.sub, fontSize:18, flexShrink:0 }}>›</div>}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:14 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Nom, email..." style={{ width:190, background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:'7px 12px', color:C.text, fontSize:13, fontFamily:'inherit' }}/>
        <select value={filterEtape} onChange={e=>setFilterEtape(e.target.value)} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:'7px 12px', color:C.text, fontSize:13, fontFamily:'inherit' }}>
          <option value="all">Toutes les étapes</option>
          {ETAPES.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
        </select>
        <select value={filterZone} onChange={e=>setFilterZone(e.target.value)} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:'7px 12px', color:C.text, fontSize:13, fontFamily:'inherit' }}>
          <option value="all">Toutes zones</option>
          {['Phuket','Samui','Pattaya','Bali'].map(z => <option key={z} value={z}>{z}</option>)}
        </select>
        {(filterEtape!=='all'||filterZone!=='all'||search) && (
          <button onClick={()=>{setFilterEtape('all');setFilterZone('all');setSearch('')}} style={{ ...btn(), fontSize:12, padding:'6px 12px' }}>✕ Effacer</button>
        )}
      </div>

      {/* Table */}
      <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:C.surface }}>
              {['Candidat','Source','Zones','Étape','Reçu','Statut',''].map(h => (
                <th key={h} style={{ padding:'10px 12px', fontSize:10, color:C.sub, textTransform:'uppercase', letterSpacing:'.06em', textAlign:'left', borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={7} style={{ padding:'40px 20px', textAlign:'center', color:C.sub, fontSize:14 }}>Aucun candidat trouvé</td></tr>
            ) : items.map(c => {
              const etape = ETAPES.find(e => e.id === c.etape)
              const bl = isBlocked(c)
              return (
                <tr key={c.id} onClick={() => setSelected(c)} style={{ cursor:'pointer', background: bl?'rgba(239,68,68,.03)':'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = bl?'rgba(239,68,68,.05)':'rgba(255,255,255,.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = bl?'rgba(239,68,68,.03)':'transparent'}>
                  <td style={{ padding:'10px 12px', borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:13, fontWeight:500, display:'flex', alignItems:'center', gap:5 }}>{c.nom}{bl&&<span title={`Bloqué depuis ${hoursAgo(c.created_at)}h`}>⚠️</span>}</div>
                    <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>{c.whatsapp}</div>
                  </td>
                  <td style={{ padding:'10px 12px', borderBottom:`1px solid ${C.border}`, fontSize:12, color:C.sub }}>{c.source||'–'}</td>
                  <td style={{ padding:'10px 12px', borderBottom:`1px solid ${C.border}`, fontSize:12, color:C.sub }}>{(c.zones||[]).join(', ')||'–'}</td>
                  <td style={{ padding:'10px 12px', borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ ...badge(etape?.color||C.accent) }}>{etape?.icon} {etape?.label}</span>
                  </td>
                  <td style={{ padding:'10px 12px', borderBottom:`1px solid ${C.border}`, fontSize:12, color:C.sub, whiteSpace:'nowrap' }}>{fmtAgo(c.created_at)}</td>
                  <td style={{ padding:'10px 12px', borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ ...badge(c.statut==='actif'?'#10b981':c.statut==='no_go'?'#ef4444':'#3b82f6') }}>
                      {c.statut==='actif'?'Actif':c.statut==='no_go'?'No-go':'Onboarding'}
                    </span>
                  </td>
                  <td style={{ padding:'10px 12px', borderBottom:`1px solid ${C.border}` }} onClick={e=>e.stopPropagation()}>
                    <button onClick={() => setSelected(c)} style={{ ...btn('green'), padding:'4px 10px', fontSize:11 }}>Voir →</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
