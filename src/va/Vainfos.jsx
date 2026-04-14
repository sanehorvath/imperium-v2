import React, { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext'
import { C, st } from '../lib/design'
import { Field } from '../components/UI'

export default function VAInfos() {
  const { profile, upsert } = useApp()
  const [form, setForm] = useState({
    name: '',
    tel: '',
    pays: '',
    ville: '',
    usdc_erc20: '',
    usdc_sol: '',
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        tel: profile.tel || '',
        pays: profile.pays || '',
        ville: profile.ville || '',
        usdc_erc20: profile.usdc_erc20 || '',
        usdc_sol: profile.usdc_sol || '',
      })
    }
  }, [profile])

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function save() {
    await upsert('profiles', { ...profile, ...form }, 'profiles')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ maxWidth: 540 }}>
      {/* Profil */}
      <div style={{ ...st.card(24), marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: C.accentDim, border: `1px solid ${C.accent}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: C.accent,
          }}>
            {(profile?.name || '?')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{profile?.name}</div>
            <div style={{ fontSize: 11, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>VA</div>
          </div>
        </div>

        <div style={{ ...st.cTitle, marginBottom: 16 }}>Informations personnelles</div>

        <Field label="Nom complet">
          <input style={st.input} value={form.name} onChange={e => f('name', e.target.value)} placeholder="Prénom Nom"/>
        </Field>
        <Field label="Email">
          <input style={{ ...st.input, opacity: 0.5 }} value={profile?.email || ''} disabled/>
        </Field>
        <div style={st.g2}>
          <Field label="Téléphone">
            <input style={st.input} value={form.tel} onChange={e => f('tel', e.target.value)} placeholder="+33 6 12 34 56 78"/>
          </Field>
          <Field label="Pays">
            <input style={st.input} value={form.pays} onChange={e => f('pays', e.target.value)} placeholder="France"/>
          </Field>
          <Field label="Ville">
            <input style={st.input} value={form.ville} onChange={e => f('ville', e.target.value)} placeholder="Paris"/>
          </Field>
        </div>
      </div>

      {/* Paiement crypto */}
      <div style={{ ...st.card(24), marginBottom: 16 }}>
        <div style={{ ...st.cTitle, marginBottom: 6 }}>Adresses de paiement</div>
        <div style={{ fontSize: 12, color: C.sub, marginBottom: 20 }}>
          Les paiements sont effectués en USDC. Renseigne au moins une adresse.
        </div>

        {/* USDC ERC-20 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              background: '#2775CA22', border: '1px solid #2775CA44',
              borderRadius: 7, padding: '4px 10px',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2775CA' }}/>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#2775CA' }}>USDC ERC-20</span>
            </div>
            <span style={{ fontSize: 11, color: C.sub }}>Ethereum · réseau ERC-20</span>
          </div>
          <input
            style={{ ...st.input, fontFamily: 'monospace', fontSize: 12 }}
            value={form.usdc_erc20}
            onChange={e => f('usdc_erc20', e.target.value)}
            placeholder="0x..."
          />
        </div>

        {/* USDC Solana */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              background: '#9945FF22', border: '1px solid #9945FF44',
              borderRadius: 7, padding: '4px 10px',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#9945FF' }}/>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#9945FF' }}>USDC Solana</span>
            </div>
            <span style={{ fontSize: 11, color: C.sub }}>Solana · réseau SOL</span>
          </div>
          <input
            style={{ ...st.input, fontFamily: 'monospace', fontSize: 12 }}
            value={form.usdc_sol}
            onChange={e => f('usdc_sol', e.target.value)}
            placeholder="Adresse Solana..."
          />
        </div>

        {!form.usdc_erc20 && !form.usdc_sol && (
          <div style={{
            background: C.accentDim, border: `1px solid ${C.accentGlow}`,
            borderRadius: 8, padding: '10px 14px',
            fontSize: 12, color: C.accent, marginTop: 12,
          }}>
            ⚠ Renseigne au moins une adresse pour recevoir tes paiements
          </div>
        )}
      </div>

      <button
        onClick={save}
        style={{ ...st.btn('primary'), width: '100%', justifyContent: 'center', padding: 12, fontSize: 14 }}
      >
        {saved ? '✓ Sauvegardé !' : 'Sauvegarder'}
      </button>
    </div>
  )
}
