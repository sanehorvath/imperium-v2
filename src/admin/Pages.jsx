// ═══ STORIES ════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext'
import { C, st, DAYS } from '../lib/design'
import { Modal, EmptyState, Field } from '../components/UI'

export function Stories({ isAdmin = false }) {
  const { data, profile, upsert, insert } = useApp()
  const [selModelId, setSelModelId] = useState(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [editNarr, setEditNarr] = useState(false)
  const [narr, setNarr] = useState('')
  const [dayModal, setDayModal] = useState(null)
  const [form, setForm] = useState({ title: '', type: 'story', heure: '', note: '', drive: '' })

  // Calcul de la semaine affichée
  const weekLabel = React.useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + weekOffset * 7)
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    const fmt = (dt) => dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    return `${fmt(monday)} – ${fmt(sunday)}`
  }, [weekOffset])

  if (!data) return null
  const { models, stories, storyDays, storyItems } = data
  const allowedModelIds = isAdmin ? models.map(m => m.id) : (Array.isArray(profile?.model_ids) ? profile.model_ids : [])
  const visible = isAdmin ? models : models.filter(m => allowedModelIds.includes(m.id))

  useEffect(() => {
    if (!selModelId && visible.length > 0) setSelModelId(visible[0].id)
  }, [visible.length])

  const story = stories.find(s => s.model_id === selModelId)
  const storyModel = models.find(m => m.id === selModelId)

  useEffect(() => {
    if (selModelId && !story) {
      insert('stories', { model_id: selModelId, narrative: '' }, 'stories')
    }
  }, [selModelId, story])

  const days = story ? storyDays.filter(d => d.story_id === story.id).sort((a, b) => a.day_idx - b.day_idx) : []

  // Auto-create days if missing
  useEffect(() => {
    if (story && days.length === 0) {
      DAYS.forEach((label, idx) => {
        insert('story_days', { story_id: story.id, day_idx: idx, label }, 'storyDays')
      })
    }
  }, [story?.id, days.length])

  async function saveNarrative() {
    if (story) await upsert('stories', { ...story, narrative: narr }, 'stories')
    setEditNarr(false)
  }

  async function saveItem() {
    const { dayId, itemId } = dayModal
    if (itemId) {
      const existing = storyItems.find(i => i.id === itemId)
      await upsert('story_items', { ...existing, ...form }, 'storyItems')
    } else {
      await insert('story_items', { ...form, day_id: dayId, id: `si_${Date.now()}` }, 'storyItems')
    }
    setDayModal(null)
  }

  async function deleteItem(id) {
    const { remove } = useApp.call ? {} : {}
    // Use supabase directly for delete
    const { supabase } = await import('../lib/supabase')
    await supabase.from('story_items').delete().eq('id', id)
  }

  if (visible.length === 0) return <EmptyState icon="◷" title="Aucun modèle" sub="Clique sur Sync ↻ pour charger les données"/>

  return (
    <div>
      {/* Week selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button style={st.btn('ghost', 'sm')} onClick={() => setWeekOffset(v => v-1)}>← Précédente</button>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.accent, minWidth: 180, textAlign: 'center' }}>{weekLabel}</div>
        <button style={{ ...st.btn('ghost', 'sm'), opacity: weekOffset >= 0 ? 0.3 : 1 }} onClick={() => setWeekOffset(v => Math.min(0, v+1))} disabled={weekOffset >= 0}>Suivante →</button>
        {weekOffset !== 0 && <button style={st.btn('primary', 'sm')} onClick={() => setWeekOffset(0)}>Cette semaine</button>}
      </div>

      {/* Week selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button style={st.btn('ghost', 'sm')} onClick={() => setWeekOffset(w => w - 1)}>←</button>
        <div style={{ ...st.card(10), minWidth: 200, textAlign: 'center', fontWeight: 600, fontSize: 13 }}>
          {getWeekLabel(weekOffset)}
        </div>
        <button style={{ ...st.btn('ghost', 'sm'), opacity: weekOffset >= 0 ? 0.3 : 1 }} onClick={() => setWeekOffset(w => Math.min(0, w + 1))} disabled={weekOffset >= 0}>→</button>
        {weekOffset !== 0 && <button style={st.btn('primary', 'xs')} onClick={() => setWeekOffset(0)}>Aujourd'hui</button>}
      </div>

      {/* Model tabs */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap' }}>
        {visible.map(m => (
          <button key={m.id} onClick={() => setSelModelId(m.id)} style={{
            ...st.btn(selModelId === m.id ? 'primary' : 'ghost', 'sm'),
            background: selModelId === m.id ? m.color || C.accent : 'transparent',
            color: selModelId === m.id ? '#fff' : C.sub,
            border: selModelId === m.id ? 'none' : `1px solid ${C.border}`,
          }}>{m.name}</button>
        ))}
      </div>

      {!story || days.length === 0
        ? <div style={{ color: C.sub, textAlign: 'center', padding: '40px 0' }}>Chargement...</div>
        : (
          <>
            {/* Narrative */}
            <div style={{ ...st.card(16), marginBottom: 16, borderLeft: `3px solid ${storyModel?.color || C.accent}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: story.narrative ? 8 : 0 }}>
                <div>
                  <div style={st.cTitle}>Direction éditoriale — {storyModel?.name}</div>
                  {!story.narrative && <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic' }}>Aucune narrative.{isAdmin && ' Clique sur ✏.'}</div>}
                </div>
                {isAdmin && <button style={st.btn('ghost', 'sm')} onClick={() => { setNarr(story.narrative || ''); setEditNarr(true) }}>✏</button>}
              </div>
              {story.narrative && <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{story.narrative}</div>}
            </div>

            {/* Days */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 10 }}>
              {days.map(day => {
                const items = storyItems.filter(i => i.day_id === day.id)
                return (
                  <div key={day.id} style={st.card2(12)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: C.accent }}>{day.label}</div>
                      {isAdmin && <button style={{ ...st.btn('ghost', 'xs'), padding: '2px 5px' }} onClick={() => { setDayModal({ dayId: day.id }); setForm({ title: '', type: 'story', heure: '', note: '', drive: '' }) }}>+</button>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {items.map(item => (
                        <div key={item.id} style={{ background: C.surface, borderRadius: 6, padding: '6px 8px', fontSize: 11 }}>
                          <div style={{ fontWeight: 600, marginBottom: 2 }}>{item.title}</div>
                          {item.heure && <div style={{ color: C.sub }}>⏰ {item.heure}</div>}
                          {item.note && <div style={{ color: C.sub }}>{item.note}</div>}
                        </div>
                      ))}
                      {items.length === 0 && <div style={{ color: C.muted, fontSize: 10, textAlign: 'center', padding: '8px 0' }}>Vide</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )
      }

      {editNarr && (
        <Modal title="Direction éditoriale" onClose={() => setEditNarr(false)} width={520}>
          <textarea style={{ ...st.textarea, minHeight: 120 }} value={narr} onChange={e => setNarr(e.target.value)} placeholder="Describe la direction créative de la semaine..."/>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button style={st.btn('ghost')} onClick={() => setEditNarr(false)}>Annuler</button>
            <button style={st.btn('primary')} onClick={saveNarrative}>Sauvegarder</button>
          </div>
        </Modal>
      )}

      {dayModal && (
        <Modal title="Ajouter un élément" onClose={() => setDayModal(null)} width={440}>
          <Field label="Titre"><input style={st.input} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}/></Field>
          <div style={st.g2}>
            <Field label="Heure"><input type="time" style={st.input} value={form.heure} onChange={e => setForm(p => ({ ...p, heure: e.target.value }))}/></Field>
            <Field label="Type">
              <select style={st.input} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                <option value="story">Story</option><option value="reel">Reel</option><option value="post">Post</option>
              </select>
            </Field>
          </div>
          <Field label="Note"><textarea style={{ ...st.textarea, minHeight: 60 }} value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}/></Field>
          <Field label="Drive URL"><input style={st.input} value={form.drive} onChange={e => setForm(p => ({ ...p, drive: e.target.value }))}/></Field>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button style={st.btn('ghost')} onClick={() => setDayModal(null)}>Annuler</button>
            <button style={st.btn('primary')} onClick={saveItem} disabled={!form.title}>Sauvegarder</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ═══ PALIERSCONFIG ══════════════════════════════════════════════════════════
export function PaliersConfig() {
  const { data, upsert, insert, remove } = useApp()
  const [editP, setEditP] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const blank = { id: '', label: '', systeme: 'A', type: 'palier', taux: 0, clics_min: 0, clics_max: 99999, color: C.accent }
  const [form, setForm] = useState(blank)

  if (!data) return null
  const { paliers } = data
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function save() {
    if (editP) await upsert('paliers', form, 'paliers')
    else await insert('paliers', form, 'paliers')
    setAddOpen(false); setEditP(null)
  }

  const systems = ['A', 'B']

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button style={st.btn('primary', 'sm')} onClick={() => { setEditP(null); setForm(blank); setAddOpen(true) }}>+ Nouveau palier</button>
      </div>
      {systems.map(sys => (
        <div key={sys} style={{ ...st.card(18), marginBottom: 16 }}>
          <div style={st.cTitle}>Système {sys} — {sys === 'A' ? '3 comptes' : '4 comptes'}</div>
          {paliers.filter(p => p.systeme === sys).sort((a, b) => a.clics_min - b.clics_min).map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: p.color, flexShrink: 0 }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.label}</div>
                <div style={st.sub}>{p.clics_min.toLocaleString()} – {p.clics_max.toLocaleString()} clics</div>
              </div>
              <div style={{ fontWeight: 800, color: C.accent, fontSize: 15 }}>${p.taux}</div>
              <button style={st.btn('ghost', 'xs')} onClick={() => { setEditP(p); setForm({ ...p }); setAddOpen(true) }}>✏</button>
              <button style={st.btn('danger', 'xs')} onClick={() => remove('paliers', p.id, 'paliers')}>✕</button>
            </div>
          ))}
        </div>
      ))}
      {addOpen && (
        <Modal title={editP ? 'Modifier' : '+ Nouveau palier'} onClose={() => setAddOpen(false)} width={440}>
          {!editP && <Field label="ID (unique)"><input style={st.input} value={form.id} onChange={e => f('id', e.target.value)}/></Field>}
          <Field label="Label"><input style={st.input} value={form.label} onChange={e => f('label', e.target.value)}/></Field>
          <div style={st.g2}>
            <Field label="Système"><select style={st.input} value={form.systeme} onChange={e => f('systeme', e.target.value)}><option value="A">A</option><option value="B">B</option></select></Field>
            <Field label="Taux ($)"><input type="number" style={st.input} value={form.taux} onChange={e => f('taux', +e.target.value)}/></Field>
            <Field label="Clics min"><input type="number" style={st.input} value={form.clics_min} onChange={e => f('clics_min', +e.target.value)}/></Field>
            <Field label="Clics max"><input type="number" style={st.input} value={form.clics_max} onChange={e => f('clics_max', +e.target.value)}/></Field>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button style={st.btn('ghost')} onClick={() => setAddOpen(false)}>Annuler</button>
            <button style={st.btn('primary')} onClick={save}>Sauvegarder</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ═══ ADMINCATEGORIES ════════════════════════════════════════════════════════
export function AdminCategories() {
  const { data, upsert, insert, remove } = useApp()
  const blank = { label: '', color: C.accent, section: 'media', va_access: 'all' }
  const [addOpen, setAddOpen] = useState(false)
  const [editCat, setEditCat] = useState(null)
  const [form, setForm] = useState(blank)
  const PRESETS = ['#C8A96E', '#5B8DEF', '#4CAF7D', '#E05555', '#9B7FE8', '#F4A261', '#7EC8E3', '#E8A0BF']

  if (!data) return null
  const { categories } = data
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function save() {
    if (editCat) await upsert('categories', { ...editCat, ...form }, 'categories')
    else await insert('categories', { ...form, id: `cat_${Date.now()}` }, 'categories')
    setAddOpen(false); setEditCat(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={st.cTitle}>Catégories ({categories.length})</div>
        <button style={st.btn('primary', 'sm')} onClick={() => { setEditCat(null); setForm(blank); setAddOpen(true) }}>+ Nouvelle</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {categories.map(cat => (
          <div key={cat.id} style={{ ...st.card(14), display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: cat.color, flexShrink: 0 }}/>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{cat.label}</span>
              <span style={{ ...st.sub, marginLeft: 8 }}>{cat.section}</span>
            </div>
            <button style={st.btn('ghost', 'xs')} onClick={() => { setEditCat(cat); setForm({ ...cat }); setAddOpen(true) }}>✏</button>
            <button style={st.btn('danger', 'xs')} onClick={() => remove('categories', cat.id, 'categories')}>✕</button>
          </div>
        ))}
      </div>
      {addOpen && (
        <Modal title={editCat ? 'Modifier' : '+ Nouvelle catégorie'} onClose={() => setAddOpen(false)} width={440}>
          <Field label="Nom"><input style={st.input} value={form.label} onChange={e => f('label', e.target.value)}/></Field>
          <Field label="Section"><select style={st.input} value={form.section} onChange={e => f('section', e.target.value)}><option value="media">Médiathèque</option><option value="formation">Formation</option></select></Field>
          <Field label="Couleur">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRESETS.map(col => <div key={col} onClick={() => f('color', col)} style={{ width: 24, height: 24, borderRadius: '50%', background: col, cursor: 'pointer', border: form.color === col ? `3px solid ${C.text}` : '3px solid transparent' }}/>)}
            </div>
          </Field>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button style={st.btn('ghost')} onClick={() => setAddOpen(false)}>Annuler</button>
            <button style={st.btn('primary')} onClick={save} disabled={!form.label}>Sauvegarder</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ═══ MONPROFIL ══════════════════════════════════════════════════════════════
export function MonProfil() {
  const { profile, upsert } = useApp()
  const [form, setForm] = useState({ name: '', tel: '', pays: '', ville: '', pct: 0 })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) setForm({ name: profile.name || '', tel: profile.tel || '', pays: profile.pays || '', ville: profile.ville || '', pct: profile.pct || 0 })
  }, [profile])

  async function save() {
    await upsert('profiles', { ...profile, ...form }, 'profiles')
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const roleLabel = { owner: 'Owner', admin: 'Admin', tl: 'Team Leader', va: 'VA' }[profile?.role] || 'VA'

  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ ...st.card(24), marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: C.accentDim, border: `1px solid ${C.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: C.accent }}>
            {(profile?.name || '?')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{profile?.name}</div>
            <div style={st.badge(profile?.role)}>{roleLabel}</div>
          </div>
        </div>
        <Field label="Nom complet"><input style={st.input} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}/></Field>
        <Field label="Email"><input style={st.input} value={profile?.email || ''} disabled style={{ ...st.input, opacity: 0.5 }}/></Field>
        <div style={st.g2}>
          <Field label="Téléphone"><input style={st.input} value={form.tel} onChange={e => setForm(p => ({ ...p, tel: e.target.value }))}/></Field>
          <Field label="Pays"><input style={st.input} value={form.pays} onChange={e => setForm(p => ({ ...p, pays: e.target.value }))}/></Field>
          <Field label="Ville"><input style={st.input} value={form.ville} onChange={e => setForm(p => ({ ...p, ville: e.target.value }))}/></Field>
          {(profile?.role === 'admin' || profile?.role === 'owner') && (
            <Field label="% du CA"><input type="number" style={st.input} value={form.pct} onChange={e => setForm(p => ({ ...p, pct: +e.target.value }))}/></Field>
          )}
        </div>
        <button style={{ ...st.btn('primary'), marginTop: 8 }} onClick={save}>
          {saved ? '✓ Sauvegardé' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  )
}

export default Stories
