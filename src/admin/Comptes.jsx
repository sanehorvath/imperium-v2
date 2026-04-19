import React, { useState, useEffect, useMemo } from 'react'
import { useApp } from '../lib/AppContext'
import { C, st, PLATFORMS, ACCOUNT_STATUSES } from '../lib/design'
import { Modal, EmptyState, Field } from '../components/UI'

const BLANK = { platform: 'instagram', username: '', model_id: '', va_id: '', date_creation: '', statut: 'warmup', login: '', password: '', fa2: '', notes: '' }

export default function Comptes({ isAdmin = false, isTL = false }) {
  const { data, profile, upsert, insert, remove } = useApp()
  const [selModelId, setSelModelId] = useState('all')
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [showArchives, setShowArchives] = useState(false)
  const [selId, setSelId] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editAcc, setEditAcc] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [addStatOpen, setAddStatOpen] = useState(false)
  const [newStat, setNewStat] = useState({ date: '', vues: '', interactions: '', followers: '' })

  if (!data) return null
  const { accounts, accountStats, models, profiles } = data
  const vas = profiles.filter(p => p.role === 'va')

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const allowedAccounts = useMemo(() => {
    if (isAdmin) return accounts
    if (isTL) {
      const myVaIds = profiles.filter(p => p.tl_id === profile?.id).map(p => p.id)
      return accounts.filter(a => myVaIds.includes(a.va_id))
    }
    return accounts.filter(a => a.va_id === profile?.id)
  }, [accounts, isAdmin, isTL, profile, profiles])

  const filtered = useMemo(() => {
    let list = allowedAccounts.filter(a => showArchives ? a.statut === 'archive' : a.statut !== 'archive')
    if (selModelId !== 'all') list = list.filter(a => a.model_id === selModelId)
    if (filterPlatform !== 'all') list = list.filter(a => a.platform === filterPlatform)
    return list
  }, [allowedAccounts, showArchives, selModelId, filterPlatform])

  const archived = allowedAccounts.filter(a => a.statut === 'archive')

  const selAcc = selId ? accounts.find(a => a.id === selId) : null
  const selStats = selId ? accountStats.filter(s => s.account_id === selId).sort((a,b) => b.date?.localeCompare(a.date)) : []

  function openAdd() { setEditAcc(null); setForm({ ...BLANK, va_id: isAdmin ? '' : profile?.id||'' }); setAddOpen(true) }
  function openEdit(acc) { setEditAcc(acc); setForm({ ...acc }); setAddOpen(true) }

  async function saveAccount() {
    const clean = { ...form, date_creation: form.date_creation||null, model_id: form.model_id||null, va_id: form.va_id||null }
    if (editAcc) await upsert('accounts', { ...editAcc, ...clean }, 'accounts')
    else await insert('accounts', { ...clean, id: `acc_${Date.now()}` }, 'accounts')
    setAddOpen(false)
  }

  async function archiveAccount(id) {
    const acc = accounts.find(a => a.id === id)
    if (acc) { await upsert('accounts', { ...acc, statut: 'archive' }, 'accounts'); setSelId(null) }
  }

  async function unarchiveAccount(id) {
    const acc = accounts.find(a => a.id === id)
    if (acc) await upsert('accounts', { ...acc, statut: 'actif' }, 'accounts')
  }

  async function deleteAccount(id) {
    if (window.confirm('Supprimer ce compte ?')) { await remove('accounts', id, 'accounts'); setSelId(null) }
  }

  async function addStat() {
    await insert('account_stats', { id: `stat_${Date.now()}`, account_id: selId, date: newStat.date, vues: Number(newStat.vues), interactions: Number(newStat.interactions), followers: Number(newStat.followers) }, 'accountStats')
    setAddStatOpen(false)
    setNewStat({ date: '', vues: '', interactions: '', followers: '' })
  }

  const platInfo = id => PLATFORMS.find(p => p.id === id) || PLATFORMS[PLATFORMS.length-1]
  const statInfo = id => ACCOUNT_STATUSES.find(s => s.id === id) || ACCOUNT_STATUSES[0]

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      {/* Sidebar models */}
      <div style={{ width: 180, flexShrink: 0 }}>
        <div style={{ ...st.card(0), overflow: 'hidden' }}>
          <div style={{ padding: '11px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={st.cTitle}>Modèles</div>
            <button style={st.btn('primary', 'xs')} onClick={openAdd}>+</button>
          </div>
          {[{ id: 'all', name: 'Tous', color: C.accent }, ...models].map(m => {
            const count = allowedAccounts.filter(a => (m.id === 'all' || a.model_id === m.id) && (showArchives ? a.statut === 'archive' : a.statut !== 'archive')).length
            const active = selModelId === m.id
            return (
              <button key={m.id} onClick={() => { setSelModelId(m.id); setSelId(null) }} style={{
                width: '100%', textAlign: 'left', padding: '9px 14px', cursor: 'pointer',
                background: active ? C.accentDim : 'transparent',
                border: 'none', borderLeft: active ? `2px solid ${m.color||C.accent}` : '2px solid transparent',
                borderBottom: `1px solid ${C.border}`, fontFamily: "'DM Sans', sans-serif",
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color||C.accent, flexShrink: 0 }}/>
                <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? C.text : C.sub, flex: 1 }}>{m.name}</span>
                <span style={{ fontSize: 10, color: C.muted }}>{count}</span>
              </button>
            )
          })}
          <div style={{ padding: '8px 14px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 5 }}>
            <button onClick={() => { setShowArchives(false); setSelId(null) }} style={{ ...st.btn(!showArchives ? 'primary' : 'ghost', 'xs'), flex: 1, justifyContent: 'center' }}>Actifs</button>
            <button onClick={() => { setShowArchives(true); setSelId(null) }} style={{ ...st.btn(showArchives ? 'primary' : 'ghost', 'xs'), flex: 1, justifyContent: 'center' }}>📦 {archived.length}</button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Platform tabs */}
        <div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {[{ id: 'all', label: 'Tout' }, ...PLATFORMS].map(p => {
            const count = (p.id === 'all' ? filtered : filtered.filter(a => a.platform === p.id)).length
            const active = filterPlatform === p.id
            return (
              <button key={p.id} onClick={() => { setFilterPlatform(p.id); setSelId(null) }} style={{
                ...st.btn('ghost', 'sm'),
                background: active ? (p.color || C.accent) : 'transparent',
                color: active ? '#fff' : C.sub,
                border: active ? 'none' : `1px solid ${C.border}`,
              }}>
                {p.label} {count > 0 && <span style={{ opacity: 0.7, fontSize: 10, marginLeft: 3 }}>({count})</span>}
              </button>
            )
          })}
        </div>

        {!selId ? (
          /* Grid */
          filtered.length === 0
            ? <EmptyState icon="◉" title="Aucun compte" sub="Clique sur + pour en ajouter"/>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
                {filtered.map(acc => {
                  const pl = platInfo(acc.platform)
                  const st2 = statInfo(acc.statut)
                  const modelName = models.find(m => m.id === acc.model_id)?.name
                  return (
                    <div key={acc.id} onClick={() => setSelId(acc.id)} style={{
                      ...st.card(14), cursor: 'pointer', transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = pl.color+'99'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: pl.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{pl.icon}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.username}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: st2.color }}/>
                            <span style={{ fontSize: 10, color: st2.color, fontWeight: 600 }}>{st2.label}</span>
                          </div>
                        </div>
                      </div>
                      {modelName && <div style={{ fontSize: 11, color: C.sub }}>{modelName}</div>}
                      {acc.date_creation && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Créé le {new Date(acc.date_creation).toLocaleDateString('fr-FR', {day:'numeric',month:'short',year:'numeric'})}</div>}
                    </div>
                  )
                })}
              </div>
        ) : (
          /* Detail */
          <div style={{ maxWidth: 680 }}>
            <button style={{ ...st.btn('ghost', 'sm'), marginBottom: 14 }} onClick={() => setSelId(null)}>← Retour</button>
            <div style={{ ...st.card(16), marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={st.row}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: platInfo(selAcc.platform).color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>{platInfo(selAcc.platform).icon}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{selAcc.username}</div>
                    <div style={st.sub}>{models.find(m => m.id === selAcc.model_id)?.name||'—'} · VA : {profiles.find(p => p.id === selAcc.va_id)?.name||'—'}</div>
                  </div>
                </div>
                {(isAdmin || selAcc.va_id === profile?.id) && (
                  <div style={st.row}>
                    <button style={st.btn('ghost', 'sm')} onClick={() => openEdit(selAcc)}>✏ Modifier</button>
                    {selAcc.statut !== 'archive'
                      ? <button style={st.btn('ghost', 'sm')} onClick={() => archiveAccount(selAcc.id)}>📦 Archiver</button>
                      : <button style={st.btn('green', 'sm')} onClick={() => unarchiveAccount(selAcc.id)}>↩ Restaurer</button>
                    }
                    {isAdmin && <button style={st.btn('danger', 'sm')} onClick={() => deleteAccount(selAcc.id)}>✕</button>}
                  </div>
                )}
              </div>
            </div>

            {selAcc.date_creation && (
              <div style={{ ...st.card2(12), marginBottom: 12 }}>
                <span style={{ ...st.label, display: 'inline' }}>Date de création : </span>
                <span style={{ fontSize: 13 }}>{new Date(selAcc.date_creation).toLocaleDateString('fr-FR')}</span>
              </div>
            )}

            {selStats.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                {[{ k: 'vues', label: 'Vues', color: C.accent }, { k: 'interactions', label: 'Interactions', color: C.blue }, { k: 'followers', label: 'Followers', color: C.green }].map(({ k, label, color }) => (
                  <div key={k} style={st.card(14)}>
                    <div style={st.cTitle}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color }}>{(selStats[0][k]||0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}

            {(isAdmin || selAcc.va_id === profile?.id) && (
              <div style={{ ...st.card(16), marginBottom: 12 }}>
                {addStatOpen ? (
                  <div>
                    <div style={{ ...st.cTitle, marginBottom: 12 }}>Ajouter stats</div>
                    <div style={{ ...st.g2, marginBottom: 10 }}>
                      <Field label="Date"><input type="date" style={st.input} value={newStat.date} onChange={e => setNewStat(p => ({ ...p, date: e.target.value }))}/></Field>
                      <Field label="Vues"><input type="number" style={st.input} value={newStat.vues} onChange={e => setNewStat(p => ({ ...p, vues: e.target.value }))}/></Field>
                      <Field label="Interactions"><input type="number" style={st.input} value={newStat.interactions} onChange={e => setNewStat(p => ({ ...p, interactions: e.target.value }))}/></Field>
                      <Field label="Followers"><input type="number" style={st.input} value={newStat.followers} onChange={e => setNewStat(p => ({ ...p, followers: e.target.value }))}/></Field>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={st.btn('ghost', 'sm')} onClick={() => setAddStatOpen(false)}>Annuler</button>
                      <button style={st.btn('primary', 'sm')} onClick={addStat} disabled={!newStat.date}>Sauvegarder</button>
                    </div>
                  </div>
                ) : (
                  <button style={st.btn('ghost', 'sm')} onClick={() => setAddStatOpen(true)}>+ Ajouter stats</button>
                )}
              </div>
            )}

            {(isAdmin || selAcc.va_id === profile?.id) && selAcc.login && (
              <div style={st.card(16)}>
                <div style={st.cTitle}>Accès</div>
                <div style={st.g2}>
                  <div><div style={st.label}>Login</div><div style={{ fontFamily:'monospace', fontSize:12, padding:'6px 10px', background:C.surface2, borderRadius:6 }}>{selAcc.login}</div></div>
                  <div><div style={st.label}>Mot de passe</div><div style={{ fontFamily:'monospace', fontSize:12, padding:'6px 10px', background:C.surface2, borderRadius:6 }}>{selAcc.password}</div></div>
                </div>
                {selAcc.fa2 && <div style={{ marginTop:8 }}><div style={st.label}>2FA</div><div style={{ fontFamily:'monospace', fontSize:12 }}>{selAcc.fa2}</div></div>}
                {selAcc.notes && <div style={{ marginTop:8, fontSize:12, color:C.sub }}>{selAcc.notes}</div>}
              </div>
            )}
          </div>
        )}
      </div>

      {addOpen && (
        <Modal title={editAcc ? 'Modifier le compte' : '+ Nouveau compte'} onClose={() => setAddOpen(false)} width={500}>
          <div style={st.g2}>
            <Field label="Plateforme">
              <select style={st.input} value={form.platform} onChange={e => f('platform', e.target.value)}>
                {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </Field>
            <Field label="Username"><input style={st.input} value={form.username} onChange={e => f('username', e.target.value)} placeholder="@username"/></Field>
            {isAdmin && (
              <>
                <Field label="Modèle">
                  <select style={st.input} value={form.model_id||''} onChange={e => f('model_id', e.target.value)}>
                    <option value="">— Choisir</option>
                    {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </Field>
                <Field label="VA assigné">
                  <select style={st.input} value={form.va_id||''} onChange={e => f('va_id', e.target.value)}>
                    <option value="">— Choisir</option>
                    {vas.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </Field>
              </>
            )}
            <Field label="Date de création"><input type="date" style={st.input} value={form.date_creation||''} onChange={e => f('date_creation', e.target.value)}/></Field>
            <Field label="Statut">
              <select style={st.input} value={form.statut} onChange={e => f('statut', e.target.value)}>
                {ACCOUNT_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Login"><input style={st.input} value={form.login||''} onChange={e => f('login', e.target.value)}/></Field>
            <Field label="Mot de passe"><input style={st.input} value={form.password||''} onChange={e => f('password', e.target.value)}/></Field>
            <Field label="2FA"><input style={st.input} value={form.fa2||''} onChange={e => f('fa2', e.target.value)}/></Field>
            <div style={{ gridColumn:'1/-1' }}>
              <Field label="Notes"><textarea style={{ ...st.textarea, minHeight:60 }} value={form.notes||''} onChange={e => f('notes', e.target.value)}/></Field>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
            <button style={st.btn('ghost')} onClick={() => setAddOpen(false)}>Annuler</button>
            <button style={st.btn('primary')} onClick={saveAccount} disabled={!form.username}>Sauvegarder</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
