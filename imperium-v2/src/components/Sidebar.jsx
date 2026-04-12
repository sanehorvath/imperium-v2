import React, { useState } from 'react'
import { useApp } from '../lib/AppContext'
import { signOut } from '../lib/supabase'
import { C, st, ROLE_LABELS } from '../lib/design'

export default function Sidebar({ nav, page, setPage, isMobile, sidebarOpen, setSidebarOpen }) {
  const { profile, syncing, loadData } = useApp()
  const now = new Date()
  const monthLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const roleLabel = ROLE_LABELS[profile?.role] || 'VA'

  const sidebarStyle = {
    width: 210,
    flexShrink: 0,
    background: C.surface,
    borderRight: `1px solid ${C.border}`,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: isMobile ? 'fixed' : 'relative',
    left: isMobile ? (sidebarOpen ? 0 : -220) : 0,
    top: 0,
    zIndex: 200,
    transition: 'left 0.25s ease',
  }

  return (
    <>
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199,
        }}/>
      )}
      <div style={sidebarStyle}>
        {/* Header */}
        <div style={{ padding: '20px 18px 16px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.sub, letterSpacing: '0.2em', marginBottom: 3 }}>AGENCY</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>IMPERIUM</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {nav.map(section => (
            <div key={section.section} style={{ marginBottom: 8 }}>
              <div style={{
                fontSize: 9, fontWeight: 700, color: C.muted,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                padding: '6px 18px 4px',
              }}>{section.section}</div>
              {section.items.map(item => {
                const active = page === item.id
                return (
                  <button key={item.id} onClick={() => { setPage(item.id); if (isMobile) setSidebarOpen(false) }}
                    style={{
                      width: '100%', textAlign: 'left',
                      background: active ? C.accentDim : 'transparent',
                      border: 'none',
                      borderLeft: active ? `2px solid ${C.accent}` : '2px solid transparent',
                      padding: '8px 18px',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 9,
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      color: active ? C.accent : C.sub,
                      transition: 'all 0.1s',
                    }}>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>{item.icon}</span>
                    {item.label}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: C.accentDim, border: `1px solid ${C.accent}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: C.accent, flexShrink: 0,
            }}>
              {(profile?.name || '?')[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.name || profile?.email}
              </div>
              <div style={{ fontSize: 10, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {roleLabel}
              </div>
            </div>
            <button onClick={signOut} title="Déconnexion"
              style={{ ...st.btn('ghost', 'xs'), marginLeft: 'auto', flexShrink: 0, padding: '4px 6px' }}>
              ⇥
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
