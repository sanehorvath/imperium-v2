import React, { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext'
import { C, st } from '../lib/design'
import { Modal, StatCard, EmptyState, Field } from '../components/UI'
import { supabase } from '../lib/supabase'

const ADMIN_FIELDS = [
  { key: 'ca',            label: 'CA ($)',         type: 'number', icon: '💵' },
  { key: 'nouveaux_fans', label: 'Nouveaux fans',  type: 'number', icon: '👥' },
  { key: 'clics_total',   label: 'Clics totaux',   type: 'number', icon: '🖱️' },
  { key: 'vues',          label: 'Vues',           type: 'number', icon: '👁' },
  { key: 'abonnes',       label: 'Abonnés totaux', type: 'number', icon: '📈' },
]

const VA_FIELDS = [
  { key: 'clics_total',   label: 'Clics totaux',  type: 'number', icon: '🖱️' },
  { key: 'vues',          label: 'Vues',          type: 'number', icon: '👁' },
  { key: 'nouveaux_fans', label: 'Nouveaux fans', type: 'number', icon: '👥' },
]

const BLANK = {
  date: new Date().toISOString().slice(0,10),
  model_id: '', ca: '', nouveaux_fans: '',
  clics_total: '', vues: '', abonnes: '', note: '',
}

const PERIODS = [['day',"Aujourd'hui"],['week','7 jours'],['month','Ce mois'],['custom','Personnalisé']]

export default function Reporting({ isAdmin = true }) {
  const { data, profile, loadData } = useApp()
  const [modal, setModal] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [filterModel, setFilterModel] = useState('all')
  const [filterPeriod, setFilterPeriod] = useState('month')
  const [dateFrom, setDateFrom] = useState(() => { const d=new Date(); d.setDate(1); return d.toISOString().slice(0,10) })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0,10))

  if (!data) return null
  const { models, modelRevenue } = data

  const fields = isAdmin ? ADMIN_FIELDS : VA_FIELDS
  const allowedModelIds = isAdmin ? models.map(m=>m.id) : (Array.isArray(profile?.model_ids) ? profile.model_ids : [])
  const visibleModels = models.filter(m => allowedModelIds.includes(m.id))

  const range = useMemo(() => {
    const now = new Date()
    if (filterPeriod==='day') { const d=now.toISOString().slice(0,10); return {from:d,to:d} }
    if (filterPeriod==='week') { const f=new Date(now); f.setDate(now.getDate()-7); return {from:f.toISOString().slice(0,10),to:now.toISOString().slice(0,10)} }
    if (filterPeriod==='month') { const f=new Date(now.getFullYear(),now.getMonth(),1); return {from:f.toISOString().slice(0,10),to:now.toISOString().slice(0,10)} }
    return {from:dateFrom,to:dateTo}
  }, [filterPeriod,dateFrom,dateTo])

  const rows = useMemo(() =>
    modelRevenue
      .filter(r => allowedModelIds.includes(r.model_id))
      .filter(r => filterModel==='all' || r.model_id===filterModel)
      .filter(r => r.date>=range.from && r.date<=range.to)
      .sort((a,b) => b.date.localeCompare(a.date))
  , [modelRevenue,filterModel,range,allowedModelIds])

  const totals = useMemo(() => ({
    ca:            rows.reduce((a,r) => a+(Number(r.ca)||0), 0),
    nouveaux_fans: rows.reduce((a,r) => a+(Number(r.nouveaux_fans)||0), 0),
    clics_total:   rows.reduce((a,r) => a+(Number(r.clics_total)||0), 0),
    vues:          rows.reduce((a,r) => a+(Number(r.vues)||0), 0),
  }), [rows])

  function openAdd() {
    const def = visibleModels.length===1 ? visibleModels[0].id : ''
    setForm({...BLANK, model_id:def, date:new Date().toISOString().slice(0,10)})
    setEditRow(null); setModal('add')
  }

  function openEdit(row) {
    setForm({
      date:row.date||'', model_id:row.model_id||'',
      ca:row.ca!=null?String(row.ca):'',
      nouveaux_fans:row.nouveaux_fans!=null?String(row.nouveaux_fans):'',
      clics_total:row.clics_total!=null?String(row.clics_total):'',
      vues:row.vues!=null?String(row.vues):'',
      abonnes:row.abonnes!=null?String(row.abonnes):'',
      note:row.note||'',
    })
    setEditRow(row); setModal('edit')
  }

  async function save() {
    if (!form.model_id || !form.date) return
    setSaving(true)
    const record = {
      model_id:form.model_id, date:form.date,
      ca:form.ca!==''?Number(form.ca):null,
      nouveaux_fans:form.nouveaux_fans!==''?Number(form.nouveaux_fans):null,
      clics_total:form.clics_total!==''?Number(form.clics_total):null,
      vues:form.vues!==''?Number(form.vues):null,
      abonnes:form.abonnes!==''?Number(form.abonnes):null,
      note:form.note||null,
      reported_by:profile?.id,
    }
    if (editRow) await supabase.from('model_revenue').update(record).eq('id',editRow.id)
    else await supabase.from('model_revenue').insert({...record,id:`rev_${Date.now()}`})
    setSaving(false); setModal(null); loadData()
  }

  async function deleteRow(id) {
    if (!window.confirm('Supprimer cette entrée ?')) return
    setDeleting(id)
    await supabase.from('model_revenue').delete().eq('id',id)
    setDeleting(null); loadData()
  }

  const u = (k,v) => setForm(p=>({...p,[k]:v}))
  const getModel = id => models.find(m=>m.id===id)

  return (
    <div>
      {/* KPIs */}
      <div style={{...st.g4, marginBottom:20}}>
        <StatCard label="CA" value={`$${totals.ca.toLocaleString()}`} color={C.accent} icon="💵"/>
        <StatCard label="Nouveaux fans" value={totals.nouveaux_fans.toLocaleString()} color={C.blue} icon="👥"/>
        <StatCard label="Clics totaux" value={totals.clics_total.toLocaleString()} color={C.purple} icon="🖱️"/>
        <StatCard label="Vues" value={totals.vues.toLocaleString()} color={C.green} icon="👁"/>
      </div>

      {/* Filtres */}
      <div style={{...st.card(14), marginBottom:16, display:'flex', gap:10, flexWrap:'wrap', alignItems:'center'}}>
        <div style={{display:'flex',gap:6}}>
          {PERIODS.map(([val,label]) => (
            <button key={val} onClick={()=>setFilterPeriod(val)} style={st.btn(filterPeriod===val?'primary':'ghost','sm')}>{label}</button>
          ))}
        </div>
        {filterPeriod==='custom' && (
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{...st.input,width:140}}/>
            <span style={{color:C.sub}}>→</span>
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{...st.input,width:140}}/>
          </div>
        )}
        {visibleModels.length > 1 && (
          <select value={filterModel} onChange={e=>setFilterModel(e.target.value)} style={{...st.input,width:160}}>
            <option value="all">Tous les modèles</option>
            {visibleModels.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        )}
        <button style={{...st.btn('primary','sm'),marginLeft:'auto'}} onClick={openAdd}>+ Nouveau reporting</button>
      </div>

      {/* Tableau */}
      {rows.length===0
        ? <EmptyState icon="📊" title="Aucune donnée" sub="Clique sur + Nouveau reporting pour saisir des chiffres"/>
        : (
          <div style={st.card(0)}>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead>
                  <tr style={{borderBottom:`1px solid ${C.border}`}}>
                    <Th>Date</Th>
                    {isAdmin && <Th>Modèle</Th>}
                    {fields.map(fld => <Th key={fld.key} right>{fld.icon} {fld.label}</Th>)}
                    <Th>Note</Th>
                    <th style={{width:80}}/>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row,i) => {
                    const model = getModel(row.model_id)
                    return (
                      <tr key={row.id} style={{borderBottom:i<rows.length-1?`1px solid ${C.border}`:'none',background:i%2===0?'transparent':`${C.surface2}80`}}>
                        <Td sub>{new Date(row.date).toLocaleDateString('fr-FR')}</Td>
                        {isAdmin && (
                          <Td>
                            {model
                              ? <div style={{display:'flex',alignItems:'center',gap:7}}>
                                  <div style={{...st.avatar(model.color||C.accent),width:24,height:24,fontSize:11}}>{(model.name||'?')[0].toUpperCase()}</div>
                                  <span style={{fontWeight:600,color:C.text}}>{model.name}</span>
                                </div>
                              : <span style={{color:C.muted}}>—</span>}
                          </Td>
                        )}
                        {fields.map(fld => (
                          <Td key={fld.key} right bold accent={fld.key==='ca'}>
                            {row[fld.key]!=null
                              ? fld.key==='ca' ? `$${Number(row[fld.key]).toLocaleString()}` : Number(row[fld.key]).toLocaleString()
                              : <span style={{color:C.muted}}>—</span>}
                          </Td>
                        ))}
                        <Td sub>{row.note||'—'}</Td>
                        <td style={{padding:'10px 14px'}}>
                          <div style={{display:'flex',gap:5,justifyContent:'flex-end'}}>
                            <button style={st.btn('ghost','xs')} onClick={()=>openEdit(row)}>✏</button>
                            {isAdmin && <button style={st.btn('danger','xs')} onClick={()=>deleteRow(row.id)} disabled={deleting===row.id}>{deleting===row.id?'…':'✕'}</button>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{borderTop:`2px solid ${C.border}`,background:C.surface2}}>
                    <td style={{padding:'10px 14px',fontWeight:700,color:C.sub,fontSize:11,textTransform:'uppercase'}} colSpan={isAdmin?2:1}>
                      Total ({rows.length} entrées)
                    </td>
                    {fields.map(fld => (
                      <td key={fld.key} style={{padding:'10px 14px',textAlign:'right',fontWeight:800,color:fld.key==='ca'?C.accent:C.text}}>
                        {fld.key==='ca'?`$${totals.ca.toLocaleString()}`:(totals[fld.key]||0).toLocaleString()}
                      </td>
                    ))}
                    <td colSpan={2}/>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )
      }

      {/* Modal */}
      {modal && (
        <Modal title={modal==='edit'?'Modifier le reporting':'+ Nouveau reporting'} onClose={()=>setModal(null)} width={520}>
          <div style={st.g2}>
            <Field label="Date *">
              <input type="date" style={st.input} value={form.date} onChange={e=>u('date',e.target.value)}/>
            </Field>
            <Field label="Modèle *">
              <select style={st.input} value={form.model_id} onChange={e=>u('model_id',e.target.value)}>
                <option value="">— Choisir</option>
                {visibleModels.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
          </div>
          <div style={st.g2}>
            {fields.map(fld => (
              <Field key={fld.key} label={`${fld.icon} ${fld.label}`}>
                <input type="number" style={st.input} value={form[fld.key]} onChange={e=>u(fld.key,e.target.value)} placeholder="0" min="0"/>
              </Field>
            ))}
          </div>
          <Field label="📝 Note (optionnel)">
            <textarea style={{...st.textarea,minHeight:60}} value={form.note} onChange={e=>u('note',e.target.value)} placeholder="Observations..."/>
          </Field>
          {!form.model_id && <div style={{background:C.redDim,border:`1px solid ${C.red}44`,borderRadius:8,padding:'10px 14px',color:C.red,fontSize:12,marginBottom:8}}>Sélectionne un modèle</div>}
          <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
            <button style={st.btn('ghost')} onClick={()=>setModal(null)}>Annuler</button>
            <button style={{...st.btn('primary'),opacity:saving?0.7:1}} onClick={save} disabled={saving||!form.model_id||!form.date}>
              {saving?'Sauvegarde...':'Sauvegarder'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Helpers table ─────────────────────────────────────────────────────────────
function Th({ children, right }) {
  return <th style={{ padding:'10px 14px', textAlign:right?'right':'left', color:C.sub, fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em' }}>{children}</th>
}
function Td({ children, right, bold, accent, sub }) {
  return <td style={{ padding:'10px 14px', textAlign:right?'right':'left', fontWeight:bold?700:400, color:accent?C.accent:sub?C.sub:C.text, fontSize:sub?12:13, maxWidth:sub?180:undefined, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{children}</td>
}
