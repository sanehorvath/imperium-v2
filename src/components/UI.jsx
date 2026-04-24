import React, { useState } from 'react'
import { C, st } from '../lib/design'

export function Modal({ title, onClose, children, width = 520 }) {
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,width:'100%',maxWidth:width,maxHeight:'90vh',overflowY:'auto',padding:24 }}>
        {title && (
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
            <div style={{ fontWeight:700,fontSize:16,color:C.text }}>{title}</div>
            <button onClick={onClose} style={{ ...st.btn('ghost','xs'),padding:'4px 8px' }}>✕</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function StatCard({ label, value, sub, color, icon }) {
  const col = color || C.accent
  return (
    <div style={st.card(16)}>
      <div style={{ ...st.cTitle,color:C.sub }}>{icon && <span style={{ marginRight:5 }}>{icon}</span>}{label}</div>
      <div style={{ fontSize:26,fontWeight:800,color:col,lineHeight:1.2,marginBottom:4 }}>{value}</div>
      {sub && <div style={{ fontSize:12,color:C.sub }}>{sub}</div>}
    </div>
  )
}

export function EmptyState({ icon='📭', title, sub, action }) {
  return (
    <div style={{ textAlign:'center',padding:'60px 0',color:C.sub }}>
      <div style={{ fontSize:36,marginBottom:12 }}>{icon}</div>
      {title && <div style={{ fontSize:15,fontWeight:700,color:C.text,marginBottom:6 }}>{title}</div>}
      {sub && <div style={{ fontSize:13,color:C.sub }}>{sub}</div>}
      {action && <div style={{ marginTop:16 }}>{action}</div>}
    </div>
  )
}

export function CatPill({ cat, active, onClick }) {
  if (!cat) return null
  return (
    <button onClick={onClick} style={{ background:active?cat.color:'transparent',color:active?'#fff':C.sub,border:`1px solid ${active?cat.color:C.border}`,borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans', sans-serif" }}>
      {cat.label}
    </button>
  )
}

export function Spinner({ size=20, color }) {
  const c = color || C.accent
  return <div style={{ width:size,height:size,border:`2px solid ${c}33`,borderTop:`2px solid ${c}`,borderRadius:'50%',animation:'spin 0.8s linear infinite' }}/>
}

export function Badge({ label, color }) {
  const c = color || C.accent
  return <span style={{ background:`${c}18`,color:c,border:`1px solid ${c}44`,borderRadius:5,padding:'2px 8px',fontSize:11,fontWeight:700 }}>{label}</span>
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ ...st.label,color:C.sub }}>{label}</label>
      {children}
    </div>
  )
}
