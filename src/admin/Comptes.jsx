import React, { useState, useEffect, useMemo } from 'react'
import { useApp } from '../lib/AppContext'
import { C, st, PLATFORMS, ACCOUNT_STATUSES } from '../lib/design'
import { Modal, EmptyState, Field } from '../components/UI'

const BLANK = { platform: 'instagram', username: '', model_id: '', va_id: '', date_creation: '', statut: 'warmup', login: '', password: '', fa2: '', notes: '' }

export default function Comptes({ isAdmin = false, isTL = false }) {
  const { data, profile, upsert, insert, remove } = useApp()
  const [selId, setSelId] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editAcc, setEditAcc] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [addStatOpen, setAddStatOpen] = useState(false)
  const [newStat, setNewStat] = useState({ date: '', vues: '', interactions: '', followers: '' })
  const [showArchives, setShowArchives] = useState(false)
  const [filterModel, setFilterModel] = useState('all')
  const [filterVA, setFilterVA] = useState('all')
  const [filterPlatform, setFilterPlatform] = useState('all')

  if (!data) return null
  const { accounts, accountStats, models, profiles } = data
  const vas = profiles.filter(p => p.role === 'va')

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // Filter accounts based on role
  const allowedAccounts = useMemo(() => {
    if (isAdmin) return accounts
    if (isTL) {
      const myVaIds = profiles.filter(p => p.tl_id === profile?.id).map(p => p.id)
      return accounts.filter(a => myVaIds.includes(a.va_id))
    }
    return accounts.filter(a => a.va_id === profile?.id)
  }, [accounts, isAdmin, isTL, profile, profiles])

  const archived = allowedAccounts.filter(a => a.statut === 'archive')
  const active = allowedAccounts.filter(a => a.statut !== 'archive')

  const filtered = useMemo(() => {
    let list = showArchives ? archived : active
    if (filterModel !== 'all') list = list.filter(a => a.model_id === filterModel)
    if (filterPlatform !== 'all') list = list.filter(a => a.platform === filterPlatform)
    if (filterVA !== 'all') list = list.filter(a => a.va_id === filterVA)
    return list
  }, [showArchives, archived, active, filterModel, filterVA])

  const selAcc = selId ? accounts.find(a => a.id === selId) : null
  const selStats = selId ? accountStats.filter(s => s.account_id === selId).sort((a, b) => b.date?.localeCompare(a.date)) : []

  useEffect(() => {
    if (!selId && filtered.length > 0) setSelId(filtered[0].id)
  }, [filtered])

  function openAdd() { setEditAcc(null); setForm({ ...BLANK, va_id: isAdmin ? '' : profile?.id || '' }); setAddOpen(true) }
  function openEdit(acc) { setEditAcc(acc); setForm({ ...acc }); setAddOpen(true) }

  async function saveAccount() {
    const clean = {
      ...form,
      date_creation: form.date_creation || null,
      model_id: form.model_id || null,
      va_id: form.va_id || null,
    }
    if (editAcc) {
      await upsert('accounts', { ...editAcc, ...clean }, 'accounts')
    } else {
      await insert('accounts', { ...clean, id: `acc_${Date.now()}` }, 'accounts')
    }
    setAddOpen(false)
  }

  async function deleteAccount(id) {
    if (window.confirm('Supprimer ce compte ?')) {
      await remove('accounts', id, 'accounts')
      if (selId === id) setSelId(null)
    }
  }

  async function archiveAccount(id) {
    const acc = accounts.find(a => a.id === id)
    if (!acc) return
    await upsert('accounts', { ...acc, statut: 'archive' }, 'accounts')
  }

  async function unarchiveAccount(id) {
    const acc = accounts.find(a => a.id === id)
    if (!acc) return
    await upsert('accounts', { ...acc, statut: 'actif' }, 'accounts')
  }

  async function addStat() {
    const entry = { id: `stat_${Date.now()}`, account_id: selId, date: newStat.date, vues: Number(newStat.vues), interactions: Number(newStat.interactions), followers: Number(newStat.followers) }
    await insert('account_stats', entry, 'accountStats')
    setAddStatOpen(false)
    setNewStat({ date: '', vues: '', interactions: '', followers: '' })
  }

  const platInfo = id => PLATFORMS.find(p => p.id === id) || PLATFORMS[PLATFORMS.length - 1]
  const statInfo = id => ACCOUNT_STATUSES.find(s => s.id === id) || ACCOUNT_STATUSES[0]

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {/* Liste compacte */}
      <div style={{ width: 200, flexShrink: 0 }}>
        <div style={{ ...st.card(0), overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '10px 12px 8px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
              <div style={st.cTitle}>{showArchives ? `Archives` : `Comptes`} <span style={{ color: C.muted }}>({filtered.length})</span></div>
              <button style={st.btn('primary', 'xs')} onClick={openAdd}>+</button>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setShowArchives(false)} style={{ ...st.btn(!showArchives ? 'primary' : 'ghost', 'xs'), flex: 1, justifyContent: 'center', fontSize: 10 }}>Actifs</button>
              <button onClick={() => setShowArchives(true)} style={{ ...st.btn(showArchives ? 'primary' : 'ghost', 'xs'), flex: 1, justifyContent: 'center', fontSize: 10 }}>📦 {archived.length}</button>
            </div>
          </div>

          {/* Filtre modèle */}
          {isAdmin && (
            <div style={{ padding: '6px 8px', borderBottom: `1px solid ${C.border}` }}>
              <select style={{ ...st.input, fontSize: 11, padding: '3px 7px', width: '100%' }} value={filterModel} onChange={e => setFilterModel(e.target.value)}>
                <option value="all">Tous les modèles</option>
                {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          )}

          {/* Liste compacte — juste icône + username */}
          <div style={{ maxHeight: 520, overflowY: 'auto' }}>
            {filtered.length === 0
              ? <div style={{ padding: '14px 0', color: C.muted, fontSize: 11, textAlign: 'center' }}>Aucun compte</div>
              : filtered.map(acc => {
                  const pl = platInfo(acc.platform)
                  const st2 = statInfo(acc.statut)
                  const isActive = selId === acc.id
                  return (
                    <button key={acc.id} onClick={() => setSelId(acc.id)} style={{
                      width: '100%', textAlign: 'left',
                      padding: '7px 10px',
                      cursor: 'pointer',
                      background: isActive ? `${pl.color}18` : 'transparent',
                      border: 'none',
                      borderLeft: isActive ? `2px solid ${pl.color}` : '2px solid transparent',
                      borderBottom: `1px solid ${C.border}11`,
                      fontFamily: "'DM Sans', sans-serif",
                      display: 'flex', alignItems: 'center', gap: 7,
                    }}>
                      {/* Icône plateforme colorée */}
                      <div style={{
                        width: 22, height: 22, borderRadius: 5, flexShrink: 0,
                        background: isActive ? pl.color : `${pl.color}33`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 8, fontWeight: 800,
                        color: isActive ? '#fff' : pl.color,
                      }}>{pl.icon}</div>
                      {/* Username */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12, fontWeight: isActive ? 700 : 400,
                          color: isActive ? C.text : C.sub,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{acc.username}</div>
                        {/* Point statut */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: st2.color }}/>
                          <span style={{ fontSize: 9, color: st2.color }}>{st2.label}</span>
                        </div>
                      </div>
                    </button>
                  )
                })
            }
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Platform tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {['all', 'instagram', 'tiktok', 'twitter', 'reddit', 'snapchat'].map(p => {
            const pl = platInfo(p)
            const count = filtered.filter(a => p === 'all' || a.platform === p).length
            return (
              <button key={p} onClick={() => { setFilterPlatform(p); setSelId(null) }} style={{
                ...st.btn(filterPlatform === p ? 'primary' : 'ghost', 'sm'),
                background: filterPlatform === p ? (p === 'all' ? C.accent : pl.color) : 'transparent',
                color: filterPlatform === p ? '#fff' : C.sub,
                border: filterPlatform === p ? 'none' : `1px solid ${C.border}`,
              }}>
                {p === 'all' ? 'Tout' : pl.label} {count > 0 && <span style={{ opacity: 0.7, fontSize: 10 }}>({count})</span>}
              </button>
            )
          })}
        </div>

        {!selId ? (
          /* Account grid */
          filtered.length === 0
            ? <div style={{ textAlign: 'center', padding: '60px 0', color: C.sub }}><div style={{ fontSize: 32, marginBottom: 12 }}>◉</div><div>Aucun compte</div></div>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {filtered.map(acc => {
                  const pl = platInfo(acc.platform)
                  const st2 = statInfo(acc.statut)
                  return (
                    <div key={acc.id} onClick={() => setSelId(acc.id)} style={{
                      ...st.card(14), cursor: 'pointer',
                      border: `1px solid ${C.border}`,
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = pl.color + '88'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: pl.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{pl.icon}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.username}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: st2.color }}/>
                            <span style={{ fontSize: 10, color: st2.color, fontWeight: 600 }}>{st2.label}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: C.sub }}>
                        {models.find(m => m.id === acc.model_id)?.name || '—'}
                        {acc.date_creation && <span style={{ marginLeft: 6 }}>· {new Date(acc.date_creation).toLocaleDateString('fr-FR', {day:'numeric',month:'short'})}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
        ) : (
          /* Account detail */
          <div style={{ maxWidth: 680 }}>
        {!selAcc
          ? <EmptyState icon="◉" title="Sélectionne un compte" sub="← ou ajoutes-en un nouveau"/>
          : (
            <div>
              <div style={{ ...st.card(16), marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={st.row}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: platInfo(selAcc.platform).color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>
                    {platInfo(selAcc.platform).icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{selAcc.username}</div>
                    <div style={st.sub}>
                      {models.find(m => m.id === selAcc.model_id)?.name || '—'} · VA : {profiles.find(p => p.id === selAcc.va_id)?.name || '—'}
                    </div>
                  </div>
                </div>
                <button style={{ ...st.btn('ghost', 'sm'), marginRight: 8 }} onClick={() => setSelId(null)}>← Retour</button>
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

              {/* Date de création */}
              {selAcc.date_creation && (
                <div style={{ ...st.card2(12), marginBottom: 12 }}>
                  <span style={{ ...st.label, display: 'inline' }}>Date de création : </span>
                  <span style={{ fontSize: 13 }}>{new Date(selAcc.date_creation).toLocaleDateString('fr-FR')}</span>
                </div>
              )}

              {/* Stats */}
              {selStats.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                  {[{ k: 'vues', label: 'Vues', color: C.accent }, { k: 'interactions', label: 'Interactions', color: C.blue }, { k: 'followers', label: 'Followers', color: C.green }].map(({ k, label, color }) => (
                    <div key={k} style={st.card(14)}>
                      <div style={st.cTitle}>{label}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color }}>{(selStats[0][k] || 0).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add stats */}
              {(isAdmin || selAcc.va_id === profile?.id) && (
                <div style={{ ...st.card(16), marginBottom: 12 }}>
                  {addStatOpen ? (
                    <div>
                      <div style={{ ...st.cTitle, marginBottom: 12 }}>Ajouter statistiques</div>
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

              {/* Accès */}
              {(isAdmin || selAcc.va_id === profile?.id) && selAcc.login && (
                <div style={st.card(16)}>
                  <div style={st.cTitle}>Accès</div>
                  <div style={st.g2}>
                    <div><div style={st.label}>Login</div><div style={{ fontFamily: 'monospace', fontSize: 12, padding: '6px 10px', background: C.surface2, borderRadius: 6 }}>{selAcc.login}</div></div>
                    <div><div style={st.label}>Mot de passe</div><div style={{ fontFamily: 'monospace', fontSize: 12, padding: '6px 10px', background: C.surface2, borderRadius: 6 }}>{selAcc.password}</div></div>
                  </div>
                  {selAcc.fa2 && <div style={{ marginTop: 8 }}><div style={st.label}>2FA</div><div style={{ fontFamily: 'monospace', fontSize: 12 }}>{selAcc.fa2}</div></div>}
                  {selAcc.notes && <div style={{ marginTop: 8, fontSize: 12, color: C.sub }}>{selAcc.notes}</div>}
                </div>
              )}
            </div>
          )
        }
      </div>

      {/* Modal add/edit */}
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
                  <select style={st.input} value={form.model_id || ''} onChange={e => f('model_id', e.target.value)}>
                    <option value="">— Choisir</option>
                    {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </Field>
                <Field label="VA assigné">
                  <select style={st.input} value={form.va_id || ''} onChange={e => f('va_id', e.target.value)}>
                    <option value="">— Choisir</option>
                    {vas.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </Field>
              </>
            )}
            <Field label="Date de création"><input type="date" style={st.input} value={form.date_creation || ''} onChange={e => f('date_creation', e.target.value)}/></Field>
            <Field label="Statut">
              <select style={st.input} value={form.statut} onChange={e => f('statut', e.target.value)}>
                {ACCOUNT_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Login"><input style={st.input} value={form.login || ''} onChange={e => f('login', e.target.value)}/></Field>
            <Field label="Mot de passe"><input style={st.input} value={form.password || ''} onChange={e => f('password', e.target.value)}/></Field>
            <Field label="2FA"><input style={st.input} value={form.fa2 || ''} onChange={e => f('fa2', e.target.value)}/></Field>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="Notes"><textarea style={{ ...st.textarea, minHeight: 60 }} value={form.notes || ''} onChange={e => f('notes', e.target.value)}/></Field>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button style={st.btn('ghost')} onClick={() => setAddOpen(false)}>Annuler</button>
            <button style={st.btn('primary')} onClick={saveAccount} disabled={!form.username}>Sauvegarder</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
