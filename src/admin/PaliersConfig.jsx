import React, { useState } from 'react'
import { useApp } from '../lib/AppContext'
import { C, st } from '../lib/design'
import { Modal, EmptyState, Field } from '../components/UI'

const SYSTEMES = [
  { id: 'A', label: 'Système A', sub: '3 comptes', color: C.blue },
  { id: 'B', label: 'Système B', sub: '4 comptes', color: C.purple },
]

export default function PaliersConfig() {
  const { data, upsert, insert, remove } = useApp()
  const [selSys, setSelSys] = useState('A')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ systeme: 'A', clics_min: '', clics_max: '', taux: '', label: '' })

  if (!data) return null
  const { paliers } = data

  const filtered = paliers.filter(p => p.systeme === selSys).sort((a, b) => a.clics_min - b.clics_min)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function save() {
    const record = {
      systeme: form.systeme,
      clics_min: Number(form.clics_min) || 0,
      clics_max: form.clics_max ? Number(form.clics_max) : null,
      taux: Number(form.taux) || 0,
      label: form.label || `Palier ${form.clics_min}+`,
    }
    if (modal?.id) await upsert('paliers', { ...modal, ...record }, 'paliers')
    else await insert('paliers', { ...record, id: `pal_${Date.now()}` }, 'paliers')
    setModal(null)
  }

  async function deletePalier(id) {
    if (window.confirm('Supprimer ce palier ?')) await remove('paliers', id, 'paliers')
  }

  function openAdd() {
    setForm({ systeme: selSys, clics_min: '', clics_max: '', taux: '', label: '' })
    setModal({ new: true })
  }

  function openEdit(p) {
    setForm({ systeme: p.systeme, clics_min: String(p.clics_min), clics_max: String(p.clics_max || ''), taux: String(p.taux), label: p.label || '' })
    setModal(p)
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {SYSTEMES.map(s => (
          <button key={s.id} onClick={() => setSelSys(s.id)} style={{
            ...st.btn(selSys === s.id ? 'primary' : 'ghost'),
            background: selSys === s.id ? s.color : 'transparent',
            color: selSys === s.id ? '#fff' : C.sub,
          }}>
            {s.label} <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 4 }}>({s.sub})</span>
          </button>
        ))}
      </div>

      <div style={{ ...st.card(18), marginBottom: 20, background: C.blueDim, borderColor: C.blue + '33' }}>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>
          <strong style={{ color: C.accent }}>Système A</strong> — 3 comptes, paliers basés sur les clics totaux (fixe + bonus).<br/>
          <strong style={{ color: C.purple }}>Système B</strong> — 4 comptes, taux progressif selon volume de clics.
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Paliers — Système {selSys}</div>
        <button style={st.btn('primary', 'sm')} onClick={openAdd}>+ Ajouter un palier</button>
      </div>

      {filtered.length === 0
        ? <EmptyState icon="⊟" title="Aucun palier" sub="Crée des paliers pour ce système"/>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((p, i) => (
              <div key={p.id} style={{ ...st.card(16), display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentDim, border: `1px solid ${C.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: C.accent, fontSize: 13 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: C.text, marginBottom: 3 }}>{p.label || `Palier ${i + 1}`}</div>
                  <div style={{ fontSize: 12, color: C.sub }}>
                    {p.clics_min.toLocaleString()} clics
                    {p.clics_max ? ` → ${p.clics_max.toLocaleString()} clics` : ' et plus'}
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 20, color: C.accent }}>${p.taux}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={st.btn('ghost', 'xs')} onClick={() => openEdit(p)}>✏</button>
                  <button style={st.btn('danger', 'xs')} onClick={() => deletePalier(p.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {modal && (
        <Modal title={modal.new ? '+ Nouveau palier' : 'Modifier le palier'} onClose={() => setModal(null)} width={440}>
          <Field label="Label">
            <input style={st.input} value={form.label} onChange={e => f('label', e.target.value)} placeholder="Ex: Palier Bronze"/>
          </Field>
          <Field label="Système">
            <select style={st.input} value={form.systeme} onChange={e => f('systeme', e.target.value)}>
              <option value="A">Système A</option>
              <option value="B">Système B</option>
            </select>
          </Field>
          <div style={st.g2}>
            <Field label="Clics min">
              <input type="number" style={st.input} value={form.clics_min} onChange={e => f('clics_min', e.target.value)} placeholder="0"/>
            </Field>
            <Field label="Clics max (optionnel)">
              <input type="number" style={st.input} value={form.clics_max} onChange={e => f('clics_max', e.target.value)} placeholder="illimité"/>
            </Field>
          </div>
          <Field label="Taux ($)">
            <input type="number" style={st.input} value={form.taux} onChange={e => f('taux', e.target.value)} placeholder="200"/>
          </Field>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button style={st.btn('ghost')} onClick={() => setModal(null)}>Annuler</button>
            <button style={st.btn('primary')} onClick={save} disabled={!form.taux || form.clics_min === ''}>Sauvegarder</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
