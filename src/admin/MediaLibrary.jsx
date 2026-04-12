// ═══ MEDIALIBRARY ═══════════════════════════════════════════════════════════
import React, { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext'
import { C, st } from '../lib/design'
import { Modal, CatPill, EmptyState, Field } from '../components/UI'

export function MediaLibrary({ isAdmin = false }) {
  const { data, profile, upsert, insert, remove } = useApp()
  const [selModel, setSelModel] = useState('all')
  const [selCat, setSelCat] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterStatut, setFilterStatut] = useState('all')
  const [search, setSearch] = useState('')
  const [editItem, setEditItem] = useState(null)
  const [addItem, setAddItem] = useState(false)
  const [hov, setHov] = useState(null)
  const blank = { title: '', type: 'reel', model_id: '', category_id: '', drive: '', description: '', statut: 'brouillon', size: '', duration: '' }
  const [form, setForm] = useState(blank)

  if (!data) return null
  const { media, models, categories } = data

  const allowedModelIds = isAdmin ? models.map(m => m.id) : (Array.isArray(profile?.model_ids) ? profile.model_ids : [])
  const allowedCatIds = isAdmin ? categories.map(c => c.id) : (Array.isArray(profile?.category_access) ? profile.category_access : categories.map(c => c.id))
  const mediaCats = categories.filter(c => c.section === 'media')
  const visibleModels = isAdmin ? models : models.filter(m => allowedModelIds.includes(m.id))

  const filtered = useMemo(() => media
    .filter(m => isAdmin || allowedModelIds.includes(m.model_id) || !m.model_id)
    .filter(m => selModel === 'all' || (selModel === 'sop' ? !m.model_id : m.model_id === selModel))
    .filter(m => selCat === 'all' || m.category_id === selCat)
    .filter(m => filterType === 'all' || m.type === filterType)
    .filter(m => filterStatut === 'all' || m.statut === filterStatut)
    .filter(m => !search || m.title?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  , [media, selModel, selCat, filterType, filterStatut, search, allowedModelIds, isAdmin])

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function handleSave() {
    if (editItem) await upsert('media', { ...editItem, ...form }, 'media')
    else await insert('media', { ...form, id: `med_${Date.now()}`, date: new Date().toISOString().slice(0, 10) }, 'media')
    setEditItem(null); setAddItem(false)
  }

  async function deleteMedia(id) {
    if (window.confirm('Supprimer ce fichier ?')) await remove('media', id, 'media')
  }

  const SBG = { validé: C.greenDim, brouillon: C.accentDim, archivé: C.redDim }
  const STC = { validé: C.green, brouillon: C.accent, archivé: C.red }

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      {/* Sidebar */}
      <div style={{ width: 160, flexShrink: 0 }}>
        <div style={{ ...st.card(0), overflow: 'hidden' }}>
          <div style={{ padding: '11px 14px 8px', borderBottom: `1px solid ${C.border}` }}><div style={st.cTitle}>Modèles</div></div>
          {[{ id: 'all', name: 'Tous', color: C.accent }, ...visibleModels, { id: 'sop', name: 'SOPs/Docs', color: C.sub }].map(m => (
            <button key={m.id} onClick={() => setSelModel(m.id)} style={{
              width: '100%', textAlign: 'left', padding: '8px 14px', cursor: 'pointer',
              background: selModel === m.id ? C.accentDim : 'transparent',
              border: 'none', borderLeft: selModel === m.id ? `2px solid ${m.color || C.accent}` : '2px solid transparent',
              fontFamily: "'DM Sans', sans-serif", fontSize: 12,
              color: selModel === m.id ? C.text : C.sub, fontWeight: selModel === m.id ? 600 : 400,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color || C.accent }}/>
              {m.name}
              <span style={{ marginLeft: 'auto', fontSize: 10, color: C.muted }}>
                {media.filter(med => m.id === 'all' ? true : m.id === 'sop' ? !med.model_id : med.model_id === m.id).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1 }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...st.input, width: 200 }}/>
          <div style={{ display: 'flex', gap: 5 }}>
            {mediaCats.map(cat => <CatPill key={cat.id} cat={cat} active={selCat === cat.id} onClick={() => setSelCat(selCat === cat.id ? 'all' : cat.id)}/>)}
          </div>
          {['all', 'reel', 'photo', 'pdf'].map(t => (
            <button key={t} style={st.btn(filterType === t ? 'primary' : 'ghost', 'sm')} onClick={() => setFilterType(t)}>
              {t === 'all' ? 'Tout' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          {isAdmin && <button style={{ ...st.btn('primary', 'sm'), marginLeft: 'auto' }} onClick={() => { setEditItem(null); setForm(blank); setAddItem(true) }}>+ Ajouter</button>}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[
            { l: `${filtered.length} fichier${filtered.length > 1 ? 's' : ''}`, c: C.text },
            { l: `${filtered.filter(f => f.statut === 'validé').length} validés`, c: C.green },
            { l: `${filtered.filter(f => f.statut === 'brouillon').length} brouillons`, c: C.accent },
          ].map((b, i) => (
            <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: b.c }}>{b.l}</div>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0
          ? <EmptyState icon="📁" title="Aucun fichier" sub="Ajoute des fichiers via le bouton + Ajouter"/>
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
              {filtered.map(item => {
                const cat = categories.find(c => c.id === item.category_id)
                const model = models.find(m => m.id === item.model_id)
                const h = hov === item.id
                return (
                  <div key={item.id} onMouseEnter={() => setHov(item.id)} onMouseLeave={() => setHov(null)}
                    style={{ background: C.surface, border: `1px solid ${h ? C.borderLight : C.border}`, borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: 140, background: C.surface2, position: 'relative', flexShrink: 0 }}>
                      {item.thumb
                        ? <img src={item.thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                        : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
                            <div style={{ fontSize: 24, color: C.muted }}>📄</div>
                            <div style={{ fontSize: 10, color: C.sub, textAlign: 'center', padding: '0 8px', fontWeight: 600 }}>{item.title}</div>
                          </div>
                      }
                      <div style={{ position: 'absolute', top: 6, left: 6 }}>
                        <span style={{ background: 'rgba(0,0,0,0.65)', color: C.text, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>{item.type?.toUpperCase()}</span>
                      </div>
                      <div style={{ position: 'absolute', top: 6, right: 6 }}>
                        <span style={{ background: SBG[item.statut] || C.accentDim, color: STC[item.statut] || C.accent, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>{item.statut}</span>
                      </div>
                    </div>
                    <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontWeight: 700, fontSize: 12, lineHeight: 1.3 }}>{item.title}</div>
                      {item.description && <div style={{ fontSize: 11, color: C.sub, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.description}</div>}
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {model && <span style={{ background: `${model.color}18`, color: model.color, borderRadius: 4, padding: '1px 5px', fontSize: 10, fontWeight: 700 }}>{model.name}</span>}
                        {cat && <CatPill cat={cat}/>}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 6, borderTop: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: 10, color: C.sub }}>{item.size}</span>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {isAdmin && <button style={st.btn('ghost', 'xs')} onClick={() => { setEditItem(item); setForm({ ...item }); setAddItem(true) }}>✏</button>}
                          {isAdmin && <button style={st.btn('danger', 'xs')} onClick={() => deleteMedia(item.id)}>✕</button>}
                          {item.drive && <a href={item.drive} target="_blank" rel="noreferrer" style={{ ...st.btn('primary', 'xs'), textDecoration: 'none' }}>↗</a>}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }
      </div>

      {/* Modal */}
      {addItem && (
        <Modal title={editItem ? 'Modifier' : '+ Nouveau fichier'} onClose={() => { setAddItem(false); setEditItem(null) }} width={500}>
          <Field label="Titre"><input style={st.input} value={form.title} onChange={e => f('title', e.target.value)}/></Field>
          <div style={st.g2}>
            <Field label="Type">
              <select style={st.input} value={form.type} onChange={e => f('type', e.target.value)}>
                <option value="reel">Reel</option><option value="photo">Photo</option><option value="pdf">PDF</option>
              </select>
            </Field>
            <Field label="Statut">
              <select style={st.input} value={form.statut} onChange={e => f('statut', e.target.value)}>
                <option value="brouillon">Brouillon</option><option value="validé">Validé</option><option value="archivé">Archivé</option>
              </select>
            </Field>
            <Field label="Modèle">
              <select style={st.input} value={form.model_id || ''} onChange={e => f('model_id', e.target.value)}>
                <option value="">— Aucun (SOP)</option>
                {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
            <Field label="Catégorie">
              <select style={st.input} value={form.category_id || ''} onChange={e => f('category_id', e.target.value)}>
                <option value="">— Choisir</option>
                {mediaCats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Lien Drive"><input style={st.input} value={form.drive || ''} onChange={e => f('drive', e.target.value)} placeholder="https://drive.google.com/..."/></Field>
          <Field label="Description"><textarea style={{ ...st.textarea, minHeight: 56 }} value={form.description || ''} onChange={e => f('description', e.target.value)}/></Field>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button style={st.btn('ghost')} onClick={() => setAddItem(false)}>Annuler</button>
            <button style={st.btn('primary')} onClick={handleSave} disabled={!form.title}>Sauvegarder</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default MediaLibrary
