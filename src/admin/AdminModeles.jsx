import React, { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext'
import { C, st } from '../lib/design'
import { Modal, EmptyState, Field } from '../components/UI'

const BLANK_PROFILE = { name: '', color: '#C8A96E', age: null, nationalite: '', ville: '', style: '', caractere: '', ton_dms: '', sujets_ok: [], sujets_eviter: [], objectif_mois: '', tags_of: [], notes: '', login_of: '', password_of: '', login_mym: '', password_mym: '', admin_notes: '', split_type: 'pct', split_modele: 40, cout_chatting_valeur: 22 }

export default function AdminModeles() {
  const { data, upsert, insert, remove } = useApp()
  const [selId, setSelId] = useState(null)
  const [tab, setTab] = useState('fiche')
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState(BLANK_PROFILE)
  const [addModel, setAddModel] = useState(false)
  const [newModelForm, setNewModelForm] = useState({ id: '', name: '', color: '#C8A96E' })

  useEffect(() => {
    if (!selId && data?.models?.length > 0) setSelId(data.models[0].id)
  }, [data?.models])

  if (!data) return null
  const { models, modelRevenue, modelDocs } = data

  const selModel = models.find(m => m.id === selId)
  const revs = selId ? modelRevenue.filter(r => r.model_id === selId).sort((a, b) => b.date?.localeCompare(a.date)) : []
  const docs = selId ? (modelDocs || []).filter(d => d.model_id === selId) : []

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function openEdit() {
    setForm({ ...BLANK_PROFILE, ...selModel })
    setEditOpen(true)
  }

  async function saveProfile() {
    // Clean integer fields
    const cleanForm = { ...form, age: form.age === '' || form.age === null ? null : Number(form.age) }
    await upsert('models', { ...cleanForm, id: selId }, 'models')
    setEditOpen(false)
  }

  async function createModel() {
    if (!newModelForm.id || !newModelForm.name) return
    await insert('models', { ...BLANK_PROFILE, ...newModelForm }, 'models')
    setSelId(newModelForm.id)
    setAddModel(false)
    setNewModelForm({ id: '', name: '', color: '#C8A96E' })
  }

  async function deleteModel(id) {
    if (window.confirm('Supprimer ce modèle ?')) {
      await remove('models', id, 'models')
      setSelId(models.find(m => m.id !== id)?.id || null)
    }
  }

  const TABS = [['fiche', 'Fiche'], ['remuneration', 'Rémunération'], ['docs', 'Documents'], ['stats', 'Stats']]

  return (
    <div>
      {/* Top model tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {models.map(m => (
          <button key={m.id} onClick={() => setSelId(m.id)} style={{
            ...st.btn(selId === m.id ? 'primary' : 'ghost', 'sm'),
            background: selId === m.id ? m.color || C.accent : 'transparent',
            color: selId === m.id ? '#fff' : C.sub,
            border: selId === m.id ? 'none' : `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: selId === m.id ? '#fff' : m.color || C.accent }}/>
            {m.name}
          </button>
        ))}
        <button style={{ ...st.btn('ghost', 'sm'), marginLeft: 'auto' }} onClick={() => setAddModel(true)}>+ Nouveau modèle</button>
      </div>

      {/* Detail */}
      <div>
        {!selModel
          ? <EmptyState icon="◆" title="Sélectionne un modèle" sub="ou crée-en un nouveau"/>
          : (
            <div>
              {/* Header */}
              <div style={{ ...st.card(16), marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={st.row}>
                  <div style={{ ...st.avatar(selModel.color || C.accent), width: 40, height: 40, fontSize: 18 }}>
                    {(selModel.name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{selModel.name}</div>
                    <div style={st.sub}>{selModel.nationalite} · {selModel.ville}</div>
                  </div>
                </div>
                <div style={st.row}>
                  <button style={st.btn('ghost', 'sm')} onClick={openEdit}>✏ Modifier</button>
                  <button style={st.btn('danger', 'sm')} onClick={() => deleteModel(selId)}>✕</button>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {TABS.map(([id, label]) => (
                  <button key={id} onClick={() => setTab(id)} style={st.btn(tab === id ? 'primary' : 'ghost', 'sm')}>{label}</button>
                ))}
              </div>

              {/* Fiche */}
              {tab === 'fiche' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Style', value: selModel.style },
                    { label: 'Caractère', value: selModel.caractere },
                    { label: 'Ton DMs', value: selModel.ton_dms },
                    { label: 'Objectif du mois', value: selModel.objectif_mois },
                  ].map(({ label, value }) => value ? (
                    <div key={label} style={st.card2(14)}>
                      <div style={st.label}>{label}</div>
                      <div style={{ fontSize: 13 }}>{value}</div>
                    </div>
                  ) : null)}
                  {selModel.sujets_ok?.length > 0 && (
                    <div style={st.card2(14)}>
                      <div style={st.label}>Sujets OK ✓</div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {(Array.isArray(selModel.sujets_ok) ? selModel.sujets_ok : []).map((s, i) => (
                          <span key={i} style={{ background: C.greenDim, color: C.green, borderRadius: 5, padding: '2px 8px', fontSize: 12 }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selModel.sujets_eviter?.length > 0 && (
                    <div style={st.card2(14)}>
                      <div style={st.label}>À éviter ✕</div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {(Array.isArray(selModel.sujets_eviter) ? selModel.sujets_eviter : []).map((s, i) => (
                          <span key={i} style={{ background: C.redDim, color: C.red, borderRadius: 5, padding: '2px 8px', fontSize: 12 }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selModel.login_of && (
                    <div style={st.card2(14)}>
                      <div style={st.label}>Accès OnlyFans</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 12 }}>{selModel.login_of} / {selModel.password_of}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Rémunération */}
              {tab === 'remuneration' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={st.card(18)}>
                    <div style={st.cTitle}>Rémunération modèle</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: C.accent, marginBottom: 4 }}>
                      {selModel.split_type === 'fixe' ? `$${selModel.split_modele || 0}` : `${selModel.split_modele || 40}%`}
                    </div>
                    <div style={st.sub}>{selModel.split_type === 'fixe' ? 'fixe par mois' : 'du CA brut reversé au modèle'}</div>
                    {selModel.split_type !== 'fixe' && <div style={{ marginTop: 8, fontSize: 13, color: C.sub }}>→ Agence garde {100-(selModel.split_modele||40)}%</div>}
                  </div>
                  <div style={st.card(18)}>
                    <div style={st.cTitle}>Coût chatting</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: C.purple, marginBottom: 4 }}>{selModel.cout_chatting_valeur || 22}%</div>
                    <div style={st.sub}>du CA brut</div>
                  </div>
                  {revs.length > 0 && (
                    <div style={{ gridColumn: '1/-1', ...st.card(18) }}>
                      <div style={st.cTitle}>Historique revenus</div>
                      {revs.slice(0, 6).map(r => (
                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
                          <span style={st.sub}>{r.date}</span>
                          <span style={{ fontWeight: 700, color: C.accent }}>${(r.ca || 0).toLocaleString()}</span>
                          <span style={st.sub}>+{r.nouveaux_fans || 0} fans</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Documents */}
              {tab === 'docs' && (
                <div style={st.card(18)}>
                  <div style={st.cTitle}>Documents ({docs.length})</div>
                  {docs.length === 0
                    ? <EmptyState icon="📄" title="Aucun document"/>
                    : docs.map(doc => (
                        <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                          <span style={{ fontSize: 20 }}>📄</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{doc.nom}</div>
                            <div style={st.sub}>{doc.date}</div>
                          </div>
                          {doc.drive_url && <a href={doc.drive_url} target="_blank" rel="noreferrer" style={{ ...st.btn('primary', 'xs'), textDecoration: 'none' }}>↗</a>}
                        </div>
                      ))
                  }
                </div>
              )}

              {/* Stats */}
              {tab === 'stats' && (
                <div style={st.card(18)}>
                  <div style={st.cTitle}>Performances</div>
                  {revs.length === 0
                    ? <EmptyState icon="📊" title="Aucune donnée" sub="Ajoute des revenus dans model_revenue"/>
                    : revs.slice(0, 12).map((r, i) => (
                        <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 8, padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                          <span style={{ color: C.sub }}>{r.date}</span>
                          <span style={{ fontWeight: 700, color: C.accent }}>${(r.ca || 0).toLocaleString()}</span>
                          <span style={{ color: C.blue }}>+{r.nouveaux_fans || 0} fans</span>
                          <span style={{ color: C.sub }}>{(r.clics_total || 0).toLocaleString()} clics</span>
                        </div>
                      ))
                  }
                </div>
              )}
            </div>
          )
        }
      </div>

      {/* Modal nouveau modèle */}
      {addModel && (
        <Modal title="+ Nouveau modèle" onClose={() => setAddModel(false)} width={400}>
          <Field label="ID (unique, pas d'espaces)"><input style={st.input} value={newModelForm.id} onChange={e => setNewModelForm(p => ({ ...p, id: e.target.value.toLowerCase().replace(/\s/g, '_') }))} placeholder="ex: alice"/></Field>
          <Field label="Nom"><input style={st.input} value={newModelForm.name} onChange={e => setNewModelForm(p => ({ ...p, name: e.target.value }))} placeholder="Alice"/></Field>
          <Field label="Couleur"><input type="color" value={newModelForm.color} onChange={e => setNewModelForm(p => ({ ...p, color: e.target.value }))}/></Field>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button style={st.btn('ghost')} onClick={() => setAddModel(false)}>Annuler</button>
            <button style={st.btn('primary')} onClick={createModel} disabled={!newModelForm.id || !newModelForm.name}>Créer</button>
          </div>
        </Modal>
      )}

      {/* Modal edit profil */}
      {editOpen && (
        <Modal title={`Modifier ${selModel?.name}`} onClose={() => setEditOpen(false)} width={560}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Nom"><input style={st.input} value={form.name} onChange={e => f('name', e.target.value)}/></Field>
            <Field label="Couleur"><input type="color" value={form.color || '#C8A96E'} onChange={e => f('color', e.target.value)}/></Field>
            <Field label="Nationalité"><input style={st.input} value={form.nationalite || ''} onChange={e => f('nationalite', e.target.value)}/></Field>
            <Field label="Ville"><input style={st.input} value={form.ville || ''} onChange={e => f('ville', e.target.value)}/></Field>
            <Field label="Style"><input style={st.input} value={form.style || ''} onChange={e => f('style', e.target.value)}/></Field>
            <Field label="Ton DMs"><input style={st.input} value={form.ton_dms || ''} onChange={e => f('ton_dms', e.target.value)}/></Field>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="Objectif du mois"><textarea style={{ ...st.textarea, minHeight: 60 }} value={form.objectif_mois || ''} onChange={e => f('objectif_mois', e.target.value)}/></Field>
            </div>

            {/* Rémunération */}
            <div style={{ gridColumn: '1/-1', paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
              <div style={{ ...st.cTitle, marginBottom: 12 }}>Rémunération</div>
            </div>
            <Field label="Type rémunération modèle">
              <select style={st.input} value={form.split_type || 'pct'} onChange={e => f('split_type', e.target.value)}>
                <option value="pct">% du CA brut</option>
                <option value="fixe">Fixe ($)</option>
              </select>
            </Field>
            <Field label={form.split_type === 'fixe' ? 'Salaire fixe ($)' : '% reversé au modèle'}>
              <input type="number" style={st.input} value={form.split_modele ?? 40} onChange={e => f('split_modele', +e.target.value)} min={0} max={form.split_type === 'fixe' ? 99999 : 100}/>
            </Field>
            <Field label="Chatting (% du CA)">
              <input type="number" style={st.input} value={form.cout_chatting_valeur ?? 22} onChange={e => f('cout_chatting_valeur', +e.target.value)} min={0} max={100}/>
            </Field>

            {/* Accès */}
            <div style={{ gridColumn: '1/-1', paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
              <div style={{ ...st.cTitle, marginBottom: 12 }}>Accès</div>
            </div>
            <Field label="Login OF"><input style={st.input} value={form.login_of || ''} onChange={e => f('login_of', e.target.value)}/></Field>
            <Field label="Password OF"><input style={st.input} value={form.password_of || ''} onChange={e => f('password_of', e.target.value)}/></Field>
            <Field label="Login MYM"><input style={st.input} value={form.login_mym || ''} onChange={e => f('login_mym', e.target.value)}/></Field>
            <Field label="Password MYM"><input style={st.input} value={form.password_mym || ''} onChange={e => f('password_mym', e.target.value)}/></Field>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button style={st.btn('ghost')} onClick={() => setEditOpen(false)}>Annuler</button>
            <button style={st.btn('primary')} onClick={saveProfile}>Sauvegarder</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
