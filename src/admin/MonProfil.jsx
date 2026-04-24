import React, { useState } from 'react'
import { useApp } from '../lib/AppContext'
import { signOut, supabase } from '../lib/supabase'
import { C, st, ROLE_LABELS } from '../lib/design'
import { Field } from '../components/UI'

export default function MonProfil() {
  const { profile, data, upsert } = useApp()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', email: '' })
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!profile) return null

  function startEdit() {
    setForm({ name: profile.name || '', email: profile.email || '' })
    setEditing(true)
  }

  async function saveProfile() {
    setSaving(true)
    await upsert('profiles', { ...profile, name: form.name, email: form.email }, null)
    setSaving(false)
    setEditing(false)
  }

  async function changePassword() {
    setPwError('')
    setPwSuccess(false)
    if (pwForm.next !== pwForm.confirm) { setPwError('Les mots de passe ne correspondent pas'); return }
    if (pwForm.next.length < 8) { setPwError('Minimum 8 caractères'); return }
    const { error } = await supabase.auth.updateUser({ password: pwForm.next })
    if (error) { setPwError(error.message); return }
    setPwSuccess(true)
    setPwForm({ current: '', next: '', confirm: '' })
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const fp = (k, v) => setPwForm(p => ({ ...p, [k]: v }))
  const roleLabel = ROLE_LABELS[profile.role] || 'VA'

  return (
    <div style={{ maxWidth: 560 }}>
      {/* Header */}
      <div style={{ ...st.card(24), marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, background: C.accentDim, border: `1px solid ${C.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: C.accent, flexShrink: 0 }}>
          {(profile.name || profile.email || '?')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: C.text }}>{profile.name || 'Sans nom'}</div>
          <div style={{ fontSize: 13, color: C.sub }}>{profile.email}</div>
          <span style={{ ...st.badge(profile.role), display: 'inline-block', marginTop: 4 }}>{roleLabel}</span>
        </div>
        {!editing && <button style={st.btn('ghost', 'sm')} onClick={startEdit}>✏ Modifier</button>}
      </div>

      {/* Edit form */}
      {editing && (
        <div style={{ ...st.card(20), marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 16, color: C.text }}>Modifier le profil</div>
          <Field label="Nom d'affichage">
            <input style={st.input} value={form.name} onChange={e => f('name', e.target.value)}/>
          </Field>
          <Field label="Email">
            <input type="email" style={st.input} value={form.email} onChange={e => f('email', e.target.value)}/>
          </Field>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button style={st.btn('ghost')} onClick={() => setEditing(false)}>Annuler</button>
            <button style={st.btn('primary')} onClick={saveProfile} disabled={saving}>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</button>
          </div>
        </div>
      )}

      {/* Password */}
      <div style={st.card(20)}>
        <div style={{ fontWeight: 700, marginBottom: 16, color: C.text }}>Changer le mot de passe</div>
        <Field label="Nouveau mot de passe">
          <input type="password" style={st.input} value={pwForm.next} onChange={e => fp('next', e.target.value)} placeholder="Minimum 8 caractères"/>
        </Field>
        <Field label="Confirmer le mot de passe">
          <input type="password" style={st.input} value={pwForm.confirm} onChange={e => fp('confirm', e.target.value)}/>
        </Field>
        {pwError && (
          <div style={{ background: C.redDim, border: `1px solid ${C.red}44`, borderRadius: 8, padding: '10px 14px', color: C.red, fontSize: 13, marginBottom: 12 }}>{pwError}</div>
        )}
        {pwSuccess && (
          <div style={{ background: C.greenDim, border: `1px solid ${C.green}44`, borderRadius: 8, padding: '10px 14px', color: C.green, fontSize: 13, marginBottom: 12 }}>
            ✓ Mot de passe mis à jour
          </div>
        )}
        <button style={st.btn('primary', 'sm')} onClick={changePassword} disabled={!pwForm.next || !pwForm.confirm}>
          Changer le mot de passe
        </button>
      </div>

      {/* Logout */}
      <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
        <button style={st.btn('danger')} onClick={signOut}>Se déconnecter</button>
      </div>
    </div>
  )
}
