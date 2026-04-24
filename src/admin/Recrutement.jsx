import React, { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext'
import { C, st } from '../lib/design'
import { Modal, EmptyState } from '../components/UI'

const STATUTS = [
  { id: 'nouveau',    label: 'Nouveau',     color: '#5B8DEF' },
  { id: 'en_cours',   label: 'En cours',    color: '#F4A261' },
  { id: 'entretien',  label: 'Entretien',   color: '#9B7FE8' },
  { id: 'accepté',    label: 'Accepté ✓',   color: '#4CAF7D' },
  { id: 'refusé',     label: 'Refusé',      color: '#E05555' },
]

export default function Recrutement() {
  const { data, upsert, loadData } = useApp()
  const [selCand, setSelCand] = useState(null)
  const [filterStatut, setFilterStatut] = useState('all')
  const [search, setSearch] = useState('')
  const [noteText, setNoteText] = useState('')

  if (!data) return null

  const candidatures = (data.candidatures || []).sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at)
  )

  const filtered = useMemo(() => candidatures
    .filter(c => filterStatut === 'all' || c.statut === filterStatut)
    .filter(c => !search || c.prenom?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()))
  , [candidatures, filterStatut, search])

  async function updateStatut(cand, statut) {
    await upsert('candidatures', { ...cand, statut }, 'candidatures')
    if (selCand?.id === cand.id) setSelCand({ ...cand, statut })
  }

  async function saveNote(cand) {
    await upsert('candidatures', { ...cand, notes_admin: noteText }, 'candidatures')
    setSelCand({ ...cand, notes_admin: noteText })
  }

  const statutInfo = id => STATUTS.find(s => s.id === id) || STATUTS[0]

  const stats = STATUTS.map(s => ({
    ...s,
    count: candidatures.filter(c => c.statut === s.id).length
  }))

  return (
    <div>
      {/* Stats KPIs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ ...st.card(14), flex: 1, minWidth: 120, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.accent }}>{candidatures.length}</div>
          <div style={{ fontSize: 11, color: C.sub, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</div>
        </div>
        {stats.map(s => (
          <div key={s.id} style={{ ...st.card(14), flex: 1, minWidth: 100, textAlign: 'center', borderLeft: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Lien formulaire */}
      <div style={{ ...st.card(14), marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, background: C.accentDim, borderColor: C.accentGlow }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>Formulaire de candidature public</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>Partage ce lien à tes candidats — accessible sans connexion</div>
        </div>
        <a href="/recruter" target="_blank" rel="noreferrer"
          style={{ ...st.btn('primary', 'sm'), textDecoration: 'none' }}>
          Voir le formulaire ↗
        </a>
        <button style={st.btn('ghost', 'sm')} onClick={() => { navigator.clipboard.writeText(window.location.origin + '/recruter'); }}>
          Copier le lien
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* Liste */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{ ...st.card(0), overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
              <input style={{ ...st.input, marginBottom: 8 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."/>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <button style={st.btn(filterStatut === 'all' ? 'primary' : 'ghost', 'xs')} onClick={() => setFilterStatut('all')}>Tous</button>
                {STATUTS.map(s => (
                  <button key={s.id} style={{ ...st.btn('ghost', 'xs'), color: filterStatut === s.id ? s.color : C.sub, borderColor: filterStatut === s.id ? s.color : C.border }}
                    onClick={() => setFilterStatut(s.id)}>{s.label}</button>
                ))}
              </div>
            </div>
            <div style={{ maxHeight: 540, overflowY: 'auto' }}>
              {filtered.length === 0
                ? <div style={{ padding: 20, textAlign: 'center', color: C.muted, fontSize: 12 }}>Aucune candidature</div>
                : filtered.map(c => {
                    const st2 = statutInfo(c.statut)
                    const active = selCand?.id === c.id
                    return (
                      <button key={c.id} onClick={() => { setSelCand(c); setNoteText(c.notes_admin || '') }}
                        style={{
                          width: '100%', textAlign: 'left', padding: '11px 14px',
                          background: active ? C.accentDim : 'transparent',
                          border: 'none', borderLeft: active ? `2px solid ${C.accent}` : '2px solid transparent',
                          borderBottom: `1px solid ${C.border}`,
                          fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                        }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: active ? C.text : C.sub }}>{c.prenom || 'Anonyme'}</span>
                          <span style={{ fontSize: 10, color: st2.color, fontWeight: 700, background: `${st2.color}18`, padding: '1px 6px', borderRadius: 4 }}>{st2.label}</span>
                        </div>
                        <div style={{ fontSize: 11, color: C.muted }}>{c.pays} · {c.disponibilite}</div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                          {new Date(c.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </button>
                    )
                  })
              }
            </div>
          </div>
        </div>

        {/* Détail */}
        <div style={{ flex: 1 }}>
          {!selCand
            ? <EmptyState icon="📋" title="Sélectionne une candidature" sub="Clique sur un candidat pour voir son profil complet"/>
            : (
              <div>
                {/* Header */}
                <div style={{ ...st.card(18), marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>
                        {selCand.prenom} {selCand.age && <span style={{ fontSize: 14, color: C.sub, fontWeight: 400 }}>{selCand.age} ans</span>}
                      </div>
                      <div style={{ fontSize: 13, color: C.sub }}>
                        {selCand.ville && `${selCand.ville}, `}{selCand.pays}
                        {selCand.situation && ` · ${selCand.situation}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {STATUTS.map(s => (
                        <button key={s.id} onClick={() => updateStatut(selCand, s.id)} style={{
                          ...st.btn('ghost', 'xs'),
                          background: selCand.statut === s.id ? s.color : 'transparent',
                          color: selCand.statut === s.id ? '#fff' : C.sub,
                          borderColor: selCand.statut === s.id ? s.color : C.border,
                        }}>{s.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Contact */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                    {selCand.telegram && (
                      <a href={`https://t.me/${selCand.telegram.replace('@','')}`} target="_blank" rel="noreferrer"
                        style={{ ...st.btn('blue', 'sm'), textDecoration: 'none' }}>
                        ✈ {selCand.telegram}
                      </a>
                    )}
                    {selCand.email && (
                      <a href={`mailto:${selCand.email}`}
                        style={{ ...st.btn('ghost', 'sm'), textDecoration: 'none' }}>
                        ✉ {selCand.email}
                      </a>
                    )}
                  </div>

                  {/* Grid info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { label: 'Disponibilité', value: selCand.disponibilite },
                      { label: 'Heures / jour', value: selCand.heures_par_jour },
                      { label: 'Objectif financier', value: selCand.objectif },
                      { label: 'Matériel', value: selCand.materiel },
                      { label: 'Comment trouvé', value: selCand.comment_trouve },
                    ].filter(r => r.value).map(row => (
                      <div key={row.label} style={{ ...st.card2(12) }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{row.label}</div>
                        <div style={{ fontSize: 13, color: C.text }}>{row.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expérience */}
                {selCand.experience_chatting && (
                  <div style={{ ...st.card(16), marginBottom: 12 }}>
                    <div style={{ ...st.cTitle, color: C.sub }}>Expérience chatting</div>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selCand.experience_chatting}</div>
                  </div>
                )}

                {/* Plateformes */}
                {selCand.plateformes?.length > 0 && (
                  <div style={{ ...st.card(16), marginBottom: 12 }}>
                    <div style={{ ...st.cTitle, color: C.sub }}>Plateformes connues</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(Array.isArray(selCand.plateformes) ? selCand.plateformes : []).map(p => (
                        <span key={p} style={{ background: C.accentDim, color: C.accent, borderRadius: 5, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>{p}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Motivation */}
                {selCand.motivation && (
                  <div style={{ ...st.card(16), marginBottom: 12 }}>
                    <div style={{ ...st.cTitle, color: C.sub }}>Motivation</div>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selCand.motivation}</div>
                  </div>
                )}

                {/* Qualités */}
                {selCand.qualites && (
                  <div style={{ ...st.card(16), marginBottom: 12 }}>
                    <div style={{ ...st.cTitle, color: C.sub }}>Qualités</div>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{selCand.qualites}</div>
                  </div>
                )}

                {/* Notes admin */}
                <div style={st.card(16)}>
                  <div style={{ ...st.cTitle, color: C.sub }}>Notes internes</div>
                  <textarea
                    style={{ ...st.textarea, minHeight: 80, marginBottom: 10, background: C.surface2, border: `1px solid ${C.border}`, color: C.text }}
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Ajoute tes notes sur ce candidat..."
                  />
                  <button style={st.btn('primary', 'sm')} onClick={() => saveNote(selCand)}>
                    Sauvegarder les notes
                  </button>
                </div>
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}
