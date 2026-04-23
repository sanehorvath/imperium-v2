import React, { useState } from 'react'
import { signIn, resetPassword } from '../lib/supabase'
import { C, st } from '../lib/design'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('login')
  const [resetSent, setResetSent] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true); setError('')
    const result = await signIn(email, password)
    if (!result.ok) { setError('Email ou mot de passe incorrect'); setLoading(false) }
  }

  async function handleReset(e) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    const result = await resetPassword(email)
    setLoading(false)
    if (result.ok) setResetSent(true)
    else setError("Erreur — vérifie l'adresse email")
  }

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif", padding: 16,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { border-color: ${C.accent} !important; outline: none; }
      `}</style>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.sub, letterSpacing: '0.2em', marginBottom: 6 }}>AGENCY</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>IMPERIUM</div>
          <div style={{ width: 40, height: 2, background: C.accent, margin: '12px auto 0' }}/>
        </div>
        <div style={st.card(28)}>
          {mode === 'login' ? (
            <>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: C.text }}>Connexion</div>
              <div style={{ color: C.sub, fontSize: 13, marginBottom: 24 }}>Accès réservé à l'équipe IMPERIUM</div>
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ ...st.label, color: C.sub }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="ton@email.com" style={{ ...st.input, background: C.surface2, color: C.text, border: `1px solid ${C.border}` }}/>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ ...st.label, color: C.sub }}>Mot de passe</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" style={{ ...st.input, background: C.surface2, color: C.text, border: `1px solid ${C.border}` }}/>
                </div>
                {error && <div style={{ background: C.redDim, border: `1px solid ${C.red}44`, borderRadius: 8, padding: '10px 14px', color: C.red, fontSize: 13, marginBottom: 16 }}>{error}</div>}
                <button type="submit" disabled={loading} style={{ ...st.btn('primary'), width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Connexion...' : 'Se connecter'}
                </button>
              </form>
              <button onClick={() => setMode('reset')} style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, cursor: 'pointer', marginTop: 16, display: 'block', width: '100%', textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
                Mot de passe oublié ?
              </button>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: C.text }}>Réinitialiser le mot de passe</div>
              <div style={{ color: C.sub, fontSize: 13, marginBottom: 24 }}>Un lien sera envoyé à ton adresse email</div>
              {resetSent
                ? <div style={{ background: C.greenDim, border: `1px solid ${C.green}44`, borderRadius: 8, padding: '14px', color: C.green, fontSize: 13, textAlign: 'center' }}>✓ Email envoyé — vérifie ta boîte mail</div>
                : <form onSubmit={handleReset}>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ ...st.label, color: C.sub }}>Email</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="ton@email.com" style={{ ...st.input, background: C.surface2, color: C.text, border: `1px solid ${C.border}` }}/>
                    </div>
                    {error && <div style={{ background: C.redDim, border: `1px solid ${C.red}44`, borderRadius: 8, padding: '10px 14px', color: C.red, fontSize: 13, marginBottom: 16 }}>{error}</div>}
                    <button type="submit" disabled={loading} style={{ ...st.btn('primary'), width: '100%', justifyContent: 'center', padding: '11px' }}>
                      {loading ? 'Envoi...' : 'Envoyer le lien'}
                    </button>
                  </form>
              }
              <button onClick={() => { setMode('login'); setResetSent(false); setError('') }}
                style={{ background: 'none', border: 'none', color: C.sub, fontSize: 12, cursor: 'pointer', marginTop: 16, display: 'block', width: '100%', textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
                ← Retour à la connexion
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
