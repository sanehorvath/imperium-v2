import React, { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext'
import { C, st } from '../lib/design'
import { Modal, CatPill, EmptyState, Field } from '../components/UI'

export default function Formation({ isAdmin = false }) {
  const { data, upsert, insert, remove, profile } = useApp()
  const [selCat, setSelCat] = useState(null)
  const [playItem, setPlayItem] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const blank = { title: '', category_id: '', source: 'drive', video_url: '', drive_url: '', canva_url: '', description: '', duration: '', ordre: 1 }
  const [form, setForm] = useState(blank)

  if (!data) return null
  const { formation, categories } = data

  const allowedCatIds = isAdmin ? categories.map(c => c.id) : (Array.isArray(profile?.category_access) ? profile.category_access : categories.map(c => c.id))
  const formCats = categories.filter(c => c.section === 'formation' && allowedCatIds.includes(c.id))
  const activeCatId = selCat || formCats[0]?.id || null

  useEffect(() => {
    if (!selCat && formCats.length > 0) setSelCat(formCats[0].id)
  }, [formCats.length])

  const items = formation
    .filter(f => f.category_id === activeCatId)
    .sort((a, b) => (a.ordre || 0) - (b.ordre || 0))

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const currentItem = editItem || form

  function openAdd() { setEditItem(null); setForm(blank); setAddOpen(true) }
  function openEdit(item) { setEditItem(item); setForm({ ...item }); setAddOpen(true) }

  async function save() {
    const record = editItem ? { ...editItem, ...form } : { ...form, id: `form_${Date.now()}` }
    if (editItem) await upsert('formation', record, 'formation')
    else await insert('formation', record, 'formation')
    setAddOpen(false)
    setEditItem(null)
  }

  async function deleteItem(id) {
    if (window.confirm('Supprimer ce contenu ?')) await remove('formation', id, 'formation')
  }

  function getEmbed(item) {
    if (item.source === 'youtube') {
      const m = item.video_url?.match(/(?:embed\/|v=|youtu\.be\/)([^?&]+)/)
      return m ? `https://www.youtube.com/embed/${m[1]}` : item.video_url
    }
    if (item.source === 'vimeo') {
      const m = item.video_url?.match(/vimeo\.com\/(\d+)/)
      return m ? `https://player.vimeo.com/video/${m[1]}` : item.video_url
    }
    if (item.source === 'drive') return item.drive_url
    return item.video_url
  }

  return (
    <div>
      {/* Modal lecteur */}
      {playItem && (
        <Modal title={playItem.title} onClose={() => setPlayItem(null)} width={700}>
          {playItem.source === 'canva' ? (
            <div style={{ position: 'relative', paddingTop: '56.25%' }}>
              <iframe
                src={`${playItem.canva_url}?embed`}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', borderRadius: 8 }}
                allowFullScreen allow="fullscreen"
              />
            </div>
          ) : playItem.source === 'pdf' ? (
            <a href={playItem.drive_url} target="_blank" rel="noreferrer" style={{ ...st.btn('primary'), display: 'inline-flex', textDecoration: 'none' }}>
              Ouvrir le document →
            </a>
          ) : (
            <iframe src={getEmbed(playItem)} style={{ width: '100%', height: 360, border: 'none', borderRadius: 8 }} allowFullScreen/>
          )}
          {playItem.description && (
            <div style={{ marginTop: 14, fontSize: 13, color: C.sub, lineHeight: 1.6 }}>{playItem.description}</div>
          )}
        </Modal>
      )}

      {/* Modal add/edit */}
      {addOpen && (
        <Modal title={editItem ? 'Modifier' : '+ Nouveau contenu'} onClose={() => { setAddOpen(false); setEditItem(null) }} width={520}>
          <Field label="Titre"><input style={st.input} value={form.title} onChange={e => f('title', e.target.value)}/></Field>
          <div style={st.g2}>
            <Field label="Catégorie">
              <select style={st.input} value={form.category_id || ''} onChange={e => f('category_id', e.target.value)}>
                <option value="">— Choisir</option>
                {formCats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Source">
              <select style={st.input} value={form.source} onChange={e => f('source', e.target.value)}>
                <option value="drive">Google Drive</option>
                <option value="canva">Canva</option>
                <option value="youtube">YouTube</option>
                <option value="vimeo">Vimeo</option>
                <option value="pdf">PDF</option>
              </select>
            </Field>
          </div>
          {form.source === 'canva' && <Field label="URL Canva"><input style={st.input} value={form.canva_url || ''} onChange={e => f('canva_url', e.target.value)} placeholder="https://www.canva.com/design/..."/></Field>}
          {form.source === 'drive' && <Field label="URL Drive"><input style={st.input} value={form.drive_url || ''} onChange={e => f('drive_url', e.target.value)} placeholder="https://drive.google.com/..."/></Field>}
          {(form.source === 'youtube' || form.source === 'vimeo') && <Field label="URL vidéo"><input style={st.input} value={form.video_url || ''} onChange={e => f('video_url', e.target.value)}/></Field>}
          <Field label="Description"><textarea style={{ ...st.textarea, minHeight: 60 }} value={form.description || ''} onChange={e => f('description', e.target.value)}/></Field>
          <div style={st.g2}>
            <Field label="Durée"><input style={st.input} value={form.duration || ''} onChange={e => f('duration', e.target.value)} placeholder="12:30"/></Field>
            <Field label="Ordre"><input type="number" style={st.input} value={form.ordre || 1} onChange={e => f('ordre', +e.target.value)}/></Field>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button style={st.btn('ghost')} onClick={() => setAddOpen(false)}>Annuler</button>
            <button style={st.btn('primary')} onClick={save} disabled={!form.title || !form.category_id}>Sauvegarder</button>
          </div>
        </Modal>
      )}

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {formCats.map(cat => (
          <CatPill key={cat.id} cat={cat} active={activeCatId === cat.id} onClick={() => setSelCat(cat.id)}/>
        ))}
        {isAdmin && (
          <button style={{ ...st.btn('primary', 'sm'), marginLeft: 'auto' }} onClick={openAdd}>+ Ajouter</button>
        )}
      </div>

      {/* Content */}
      {items.length === 0
        ? <EmptyState icon="▣" title="Aucun contenu" sub={isAdmin ? "Clique sur + Ajouter pour créer du contenu" : "Aucun contenu disponible dans cette catégorie"}/>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(item => (
              <div key={item.id} style={{
                ...st.card(16), display: 'flex', gap: 14, alignItems: 'center',
                cursor: 'pointer', transition: 'border-color 0.15s',
              }} onClick={() => setPlayItem(item)}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>
                  {item.source === 'pdf' ? '📄' : item.source === 'canva' ? '🎨' : '▶️'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{item.title}</div>
                  <div style={{ ...st.sub, marginBottom: 3 }}>{item.description}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', fontWeight: 700 }}>{item.source}</span>
                    {item.duration && <span style={{ fontSize: 11, color: C.muted }}>⏱ {item.duration}</span>}
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button style={st.btn('ghost', 'xs')} onClick={() => openEdit(item)}>✏</button>
                    <button style={st.btn('danger', 'xs')} onClick={() => deleteItem(item.id)}>✕</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}
