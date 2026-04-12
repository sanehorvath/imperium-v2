import React, { useState } from 'react'
import { C, st } from '../lib/design'

// ── MODAL ─────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, width = 520 }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 14, width: '100%', maxWidth: width,
        maxHeight: '90vh', overflowY: 'auto', padding: 24,
      }}>
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
            <button onClick={onClose} style={{ ...st.btn('ghost', 'xs'), padding: '4px 8px' }}>✕</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

// ── STAT CARD ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color = C.accent, icon }) {
  return (
    <div style={st.card(16)}>
      <div style={st.cTitle}>{icon && <span style={{ marginRight: 5 }}>{icon}</span>}{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1.2, marginBottom: 4 }}>{value}</div>
      {sub && <div style={st.sub}>{sub}</div>}
    </div>
  )
}

// ── EMPTY STATE ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, sub, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: C.sub }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      {title && <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>{title}</div>}
      {sub && <div style={{ fontSize: 13 }}>{sub}</div>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  )
}

// ── CAT PILL ─────────────────────────────────────────────────────────────────
export function CatPill({ cat, active, onClick }) {
  if (!cat) return null
  return (
    <button onClick={onClick} style={{
      background: active ? cat.color : 'transparent',
      color: active ? '#fff' : C.sub,
      border: `1px solid ${active ? cat.color : C.border}`,
      borderRadius: 20,
      padding: '4px 12px',
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: "'DM Sans', sans-serif",
    }}>{cat.label}</button>
  )
}

// ── SPINNER ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, color = C.accent }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid ${color}33`,
      borderTop: `2px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }}/>
  )
}

// ── BADGE ─────────────────────────────────────────────────────────────────────
export function Badge({ label, color = C.accent }) {
  return (
    <span style={{
      background: `${color}18`,
      color,
      border: `1px solid ${color}44`,
      borderRadius: 5,
      padding: '2px 8px',
      fontSize: 11,
      fontWeight: 700,
    }}>{label}</span>
  )
}

// ── FORM FIELD ────────────────────────────────────────────────────────────────
export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={st.label}>{label}</label>
      {children}
    </div>
  )
}

// ── CONFIRM DIALOG ────────────────────────────────────────────────────────────
export function useConfirm() {
  const [state, setState] = useState(null)

  const confirm = (message) => new Promise(resolve => {
    setState({ message, resolve })
  })

  const Dialog = state ? (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
    }}>
      <div style={{ ...st.card(24), maxWidth: 380, width: '100%', margin: 16 }}>
        <div style={{ fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>{state.message}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button style={st.btn('ghost')} onClick={() => { state.resolve(false); setState(null) }}>Annuler</button>
          <button style={st.btn('danger')} onClick={() => { state.resolve(true); setState(null) }}>Confirmer</button>
        </div>
      </div>
    </div>
  ) : null

  return { confirm, Dialog }
}

// ── DROP ZONE ─────────────────────────────────────────────────────────────────
export function DropZone({ onDrop }) {
  const [over, setOver] = useState(false)
  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) onDrop(f) }}
      style={{
        border: `2px dashed ${over ? C.accent : C.border}`,
        borderRadius: 10,
        padding: '20px',
        textAlign: 'center',
        color: over ? C.accent : C.muted,
        cursor: 'pointer',
        transition: 'all 0.2s',
        marginBottom: 12,
      }}
    >
      <div style={{ fontSize: 24, marginBottom: 6 }}>📁</div>
      <div style={{ fontSize: 12 }}>Glisse un fichier ici ou <span style={{ color: C.accent, textDecoration: 'underline', cursor: 'pointer' }}>clique pour parcourir</span></div>
    </div>
  )
}

// ── SPARKLINE ─────────────────────────────────────────────────────────────────
export function Sparkline({ data = [], metric, color = C.accent }) {
  if (!data || data.length < 2) return null
  const vals = data.slice(0, 7).reverse().map(s => Number(s[metric]) || 0)
  const max = Math.max(...vals) || 1
  const w = 80, h = 28
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - (v / max) * h}`).join(' ')
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
