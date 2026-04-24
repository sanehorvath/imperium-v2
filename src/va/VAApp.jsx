import React, { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext'
import { useTheme } from '../lib/ThemeContext'
import { C, st } from '../lib/design'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import Comptes from '../admin/Comptes'
import Formation from '../admin/Formation'
import MediaLibrary from '../admin/MediaLibrary'
import Stories from '../admin/Stories'
import Reporting from '../admin/Reporting'
import VAAccueil from './VAAccueil'
import VAInfos from './Vainfos'

const NAV_VA = [
  { section: 'Mon espace', items: [
    { id: 'va_accueil',   label: 'Accueil',           icon: '◈' },
    { id: 'va_reporting', label: 'Mon reporting',      icon: '📊' },
    { id: 'va_comptes',   label: 'Mes comptes',        icon: '◉' },
    { id: 'va_formation', label: 'Formation',          icon: '▣' },
    { id: 'va_media',     label: 'Médiathèque',        icon: '▦' },
    { id: 'va_stories',   label: 'Stories semaine',    icon: '◷' },
  ]},
  { section: 'Mon compte', items: [
    { id: 'va_infos',     label: 'Infos perso',        icon: '◈' },
    { id: 'va_warns',     label: 'Mes avertissements', icon: '⚠' },
  ]},
]

export default function VAApp() {
  const [page, setPage] = useState('va_accueil')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile } = useApp()
  const { mode } = useTheme()

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  function renderPage() {
    switch (page) {
      case 'va_accueil':   return <VAAccueil />
      case 'va_reporting': return <Reporting isAdmin={false} />
      case 'va_comptes':   return <Comptes isAdmin={false} />
      case 'va_formation': return <Formation isAdmin={false} />
      case 'va_media':     return <MediaLibrary isAdmin={false} />
      case 'va_stories':   return <Stories isAdmin={false} />
      case 'va_infos':     return <VAInfos />
      case 'va_warns':     return <VAWarns />
      default:             return <VAAccueil />
    }
  }

  return (
    <div style={{ display:'flex', height:'100vh', background:C.bg, fontFamily:"'DM Sans', sans-serif", color:C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 99px; }
        input, textarea, select { background: ${C.surface2} !important; border: 1px solid ${C.border} !important; border-radius: 8px; padding: 8px 12px; color: ${C.text} !important; font-size: 13px; font-family: 'DM Sans', sans-serif; outline: none; }
        input:focus, textarea:focus, select:focus { border-color: ${C.accent} !important; }
        select { appearance: none; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <Sidebar nav={NAV_VA} page={page} setPage={setPage} isMobile={isMobile} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
        <Topbar page={page} isMobile={isMobile} setSidebarOpen={setSidebarOpen}/>
        <div style={{ flex:1, overflowY:'auto', padding:isMobile?'16px':'24px 28px', background:C.bg }}>
          {renderPage()}
        </div>
      </div>
    </div>
  )
}

function VAWarns() {
  const { data, profile, upsert } = useApp()
  const warns = (data?.vaWarns || []).filter(w => w.va_id === profile?.id)
  const [replyOpen, setReplyOpen] = React.useState(null)
  const [replyText, setReplyText] = React.useState('')

  async function saveReply(warn) {
    await upsert('va_warns', { ...warn, reply: replyText }, 'vaWarns')
    setReplyOpen(null); setReplyText('')
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ fontSize:11, color:C.sub, marginBottom:16, fontWeight:600 }}>
        {warns.length === 0 ? '✓ Aucun avertissement actif' : `${warns.length} avertissement${warns.length>1?'s':''}`}
      </div>
      {warns.length === 0
        ? <div style={{ ...st.card(20), textAlign:'center', color:C.green }}>
            <div style={{ fontSize:28, marginBottom:8 }}>✓</div>
            <div style={{ fontWeight:700 }}>Tout est bon !</div>
            <div style={{ fontSize:12, color:C.sub, marginTop:4 }}>Aucun avertissement en cours</div>
          </div>
        : warns.map(w => (
            <div key={w.id} style={{ background:C.surface, border:`1px solid ${w.niveau==='grave'?C.red+'44':C.orange+'44'}`, borderLeft:`3px solid ${w.niveau==='grave'?C.red:C.orange}`, borderRadius:10, padding:'14px 16px', marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                <div>
                  <span style={{ fontSize:11, color:w.niveau==='grave'?C.red:C.orange, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                    {w.niveau==='grave'?'⚠ Grave':'⚡ Avertissement'}
                  </span>
                  <div style={{ fontWeight:600, fontSize:14, marginTop:3, color:C.text }}>{w.motif}</div>
                </div>
                <span style={{ fontSize:11, color:C.sub }}>{new Date(w.date).toLocaleDateString('fr-FR')}</span>
              </div>
              {w.reply && (
                <div style={{ background:C.surface2, borderRadius:7, padding:'8px 12px', fontSize:12, color:C.sub, marginTop:8 }}>
                  <span style={{ color:C.accent, fontWeight:600 }}>Ta réponse : </span>{w.reply}
                </div>
              )}
              {replyOpen===w.id
                ? <div style={{ marginTop:10 }}>
                    <textarea style={{ ...st.textarea, minHeight:60, marginBottom:8 }} value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="Écris ta réponse..."/>
                    <div style={{ display:'flex', gap:8 }}>
                      <button style={st.btn('ghost','sm')} onClick={()=>setReplyOpen(null)}>Annuler</button>
                      <button style={st.btn('primary','sm')} onClick={()=>saveReply(w)} disabled={!replyText}>Envoyer</button>
                    </div>
                  </div>
                : <button style={{ ...st.btn('ghost','xs'), marginTop:8 }} onClick={()=>{ setReplyOpen(w.id); setReplyText(w.reply||'') }}>
                    {w.reply?'✏ Modifier ma réponse':'💬 Répondre'}
                  </button>
              }
            </div>
          ))
      }
    </div>
  )
}
