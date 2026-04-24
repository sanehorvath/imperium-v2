import React, { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext'
import { C, st, DAYS } from '../lib/design'
import { Modal, EmptyState, Field } from '../components/UI'
import { supabase } from '../lib/supabase'

export default function Stories({ isAdmin = false }) {
  const { data, profile, upsert, insert } = useApp()
  const [selModelId, setSelModelId] = useState(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [editNarr, setEditNarr] = useState(false)
  const [narr, setNarr] = useState('')
  const [dayModal, setDayModal] = useState(null)
  const [form, setForm] = useState({ title: '', type: 'story', heure: '', note: '', drive: '' })

  const weekLabel = React.useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + weekOffset * 7)
    const monday = new Date(d); monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
    const fmt = dt => dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    return weekOffset === 0 ? 'Cette semaine' : `${fmt(monday)} – ${fmt(sunday)}`
  }, [weekOffset])

  if (!data) return null
  const { models, stories, storyDays, storyItems } = data
  const allowedModelIds = isAdmin ? models.map(m => m.id) : (Array.isArray(profile?.model_ids) ? profile.model_ids : [])
  const visible = isAdmin ? models : models.filter(m => allowedModelIds.includes(m.id))

  useEffect(() => { if (!selModelId && visible.length > 0) setSelModelId(visible[0].id) }, [visible.length])

  const story = stories.find(s => s.model_id === selModelId)
  const storyModel = models.find(m => m.id === selModelId)

  useEffect(() => {
    if (selModelId && !story) insert('stories', { model_id: selModelId, narrative: '' }, 'stories')
  }, [selModelId, story])

  const days = story ? storyDays.filter(d => d.story_id === story.id).sort((a, b) => a.day_idx - b.day_idx) : []

  useEffect(() => {
    if (story && days.length === 0)
      DAYS.forEach((label, idx) => insert('story_days', { story_id: story.id, day_idx: idx, label }, 'storyDays'))
  }, [story?.id, days.length])

  async function saveNarrative() {
    if (story) await upsert('stories', { ...story, narrative: narr }, 'stories')
    setEditNarr(false)
  }

  async function saveItem() {
    const { dayId } = dayModal
    await insert('story_items', { ...form, day_id: dayId, id: `si_${Date.now()}` }, 'storyItems')
    setDayModal(null)
  }

  if (visible.length === 0) return <EmptyState icon="◷" title="Aucun modèle"/>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button style={st.btn('ghost', 'sm')} onClick={() => setWeekOffset(w => w - 1)}>←</button>
        <div style={{ ...st.card(10), minWidth: 200, textAlign: 'center', fontWeight: 600, fontSize: 13, color: C.text }}>{weekLabel}</div>
        <button style={{ ...st.btn('ghost', 'sm'), opacity: weekOffset >= 0 ? 0.3 : 1 }} onClick={() => setWeekOffset(w => Math.min(0, w + 1))} disabled={weekOffset >= 0}>→</button>
        {weekOffset !== 0 && <button style={st.btn('primary', 'xs')} onClick={() => setWeekOffset(0)}>Aujourd'hui</button>}
      </div>

      <div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap' }}>
        {visible.map(m => (
          <button key={m.id} onClick={() => setSelModelId(m.id)} style={{ ...st.btn('ghost', 'sm'), background: selModelId === m.id ? m.color || C.accent : 'transparent', color: selModelId === m.id ? '#fff' : C.sub, border: selModelId === m.id ? 'none' : `1px solid ${C.border}` }}>{m.name}</button>
        ))}
      </div>

      {(!story || days.length === 0)
        ? <div style={{ color: C.sub, textAlign: 'center', padding: '40px 0' }}>Chargement...</div>
        : <>
            <div style={{ ...st.card(16), marginBottom: 16, borderLeft: `3px solid ${storyModel?.color || C.accent}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: story.narrative ? 8 : 0 }}>
                <div>
                  <div style={{ ...st.cTitle, color: C.sub }}>Direction éditoriale — {storyModel?.name}</div>
                  {!story.narrative && <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic' }}>Aucune narrative.{isAdmin && ' Clique ✏.'}</div>}
                </div>
                {isAdmin && <button style={st.btn('ghost', 'sm')} onClick={() => { setNarr(story.narrative || ''); setEditNarr(true) }}>✏</button>}
              </div>
              {story.narrative && <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: C.text }}>{story.narrative}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 10 }}>
              {days.map(day => {
                const items = storyItems.filter(i => i.day_id === day.id)
                return (
                  <div key={day.id} style={st.card2(12)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: C.accent }}>{day.label}</div>
                      {isAdmin && <button style={{ ...st.btn('ghost', 'xs'), padding: '2px 5px' }} onClick={() => { setDayModal({ dayId: day.id }); setForm({ title: '', type: 'story', heure: '', note: '', drive: '' }) }}>+</button>}
                    </div>
                    {items.map(item => (
                      <div key={item.id} style={{ background: C.surface, borderRadius: 6, padding: '6px 8px', fontSize: 11, marginBottom: 4 }}>
                        <div style={{ fontWeight: 600, color: C.text }}>{item.title}</div>
                        {item.heure && <div style={{ color: C.sub }}>⏰ {item.heure}</div>}
                      </div>
                    ))}
                    {items.length === 0 && <div style={{ color: C.muted, fontSize: 10, textAlign: 'center', padding: '8px 0' }}>Vide</div>}
                  </div>
                )
              })}
            </div>
          </>
      }

      {editNarr && (
        <Modal title="Direction éditoriale" onClose={() => setEditNarr(false)} width={520}>
          <textarea style={{ ...st.textarea, minHeight: 120 }} value={narr} onChange={e => setNarr(e.target.value)}/>
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
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button style={st.btn('ghost')} onClick={() => setDayModal(null)}>Annuler</button>
            <button style={st.btn('primary')} onClick={saveItem} disabled={!form.title}>Sauvegarder</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
