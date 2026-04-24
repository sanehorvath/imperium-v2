import React, { useState } from 'react'
import { useApp } from '../lib/AppContext'
import { C, st } from '../lib/design'
import { Modal, EmptyState, Field } from '../components/UI'

const SECTIONS = [
  { id: 'media', label: 'Médiathèque' },
  { id: 'formation', label: 'Formation' },
  { id: 'invoice', label: 'Factures' },
]

const COLORS = ['#5B8DEF','#C8A96E','#4CAF7D','#E05555','#9B7FE8','#F4A261','#E91E8C','#00BCD4','#FF9800','#607D8B']

export default function AdminCategories() {
  const { data, upsert, insert, remove } = useApp()
  const [selSection, setSelSection] = useState('media')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ label: '', section: 'media', color: COLORS[0], icon: '' })

  if (!data) return null
  const { categories } = data

  const filtered = categories.filter(c => c.section === selSection)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function save() {
    if (modal?.id) await upsert('categories', { ...modal, ...form }, 'categories')
    else await insert('categories', { ...form, id: `cat_${Date.now()}` }, 'categories')
    setModal(null)
  }

  async function deleteCat(id) {
    if (window.confirm('Supprimer cette catégorie ?')) await remove('categories', id, 'categories')
  }

  function openAdd() {
    setForm({ label: '', section: selSection, color: COLORS[0], icon: '' })
    setModal({ new: true })
  }

  function openEdit(cat) {
    setForm({ label: cat.label, section: cat.section, color: cat.color || COLORS[0], icon: cat.icon || '' })
    setModal(cat)
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSelSection(s.id)} style={st.btn(selSection === s.id ? 'primary' : 'ghost', 'sm')}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>
          Catégories — {SECTIONS.find(s => s.id === selSection)?.label}
        </div>
        <button style={st.btn('primary', 'sm')} onClick={openAdd}>+ Ajouter</button>
      </div>

      {filtered.length === 0
        ? <EmptyState icon="⊞" title="Aucune catégorie" sub="Crée des catégories pour organiser le contenu"/>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(cat => (
              <div key={cat.id} style={{ ...st.card(14), display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: cat.color || C.accent, flexShrink: 0 }}/>
                {cat.icon && <span style={{ fontSize: 18 }}>{cat.icon}</span>}
                <div style={{ flex: 1, fontWeight: 600, color: C.text }}>{cat.label}</div>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cat.section}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={st.btn('ghost', 'xs')} onClick={() => openEdit(cat)}>✏</button>
                  <button style={st.btn('danger', 'xs')} onClick={() => deleteCat(cat.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {modal && (
        <Modal title={modal.new ? '+ Nouvelle catégorie' : 'Modifier la catégorie'} onClose={() => setModal(null)} width={420}>
          <Field label="Nom">
            <input style={st.input} value={form.label} onChange={e => f('label', e.target.value)} placeholder="Ex: Reels"/>
          </Field>
          <Field label="Section">
            <select style={st.input} value={form.section} onChange={e => f('section', e.target.value)}>
              {SECTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Icône (emoji)">
            <input style={st.input} value={form.icon} onChange={e => f('icon', e.target.value)} placeholder="📁"/>
          </Field>
          <Field label="Couleur">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLORS.map(col => (
                <button key={col} onClick={() => f('color', col)} style={{
                  width: 28, height: 28, borderRadius: '50%', background: col,
                  border: form.color === col ? `3px solid ${C.text}` : '2px solid transparent',
                  cursor: 'pointer', flexShrink: 0,
                }}/>
              ))}
            </div>
          </Field>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button style={st.btn('ghost')} onClick={() => setModal(null)}>Annuler</button>
            <button style={st.btn('primary')} onClick={save} disabled={!form.label}>Sauvegarder</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
