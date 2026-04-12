import React, { useState } from 'react'
import { useApp } from '../lib/AppContext'
import { C, st } from '../lib/design'
import { Modal, EmptyState, Badge, Field } from '../components/UI'
import { supabase } from '../lib/supabase'

export default function GestionEquipe() {
  const { data, upsert, insert, remove, loadData } = useApp()
  const [selMember, setSelMember] = useState(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'va', pay_type: 'palier_a', pay_pct: 0 })
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [warnOpen, setWarnOpen] = useState(false)
  const [warnForm, setWarnForm] = useState({ motif: '', niveau: 'warning' })

  if (!data) return null
  const { profiles, models, vaWarns } = data
  const team = profiles.filter(p => p.role === 'va' || p.role === 'tl')
  const admins = profiles.filter(p => p.role === 'admin' || p.role === 'owner')

  const f = (k, v) => setInviteForm(p => ({ ...p, [k]: v }))
  const ef = (k, v) => setEditForm(p => ({ ...p, [k]: v }))

  async function inviteMember() {
    setInviting(true)
    setInviteMsg('')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        email: inviteForm.email,
        data: { name: inviteForm.name, role: inviteForm.role }
      })
    })
    if (res.ok) {
      setInviteMsg('✓ Invitation envoyée — l\'utilisateur recevra un email')
      setTimeout(() => { setInviteOpen(false); setInviteMsg(''); loadData() }, 2000)
    } else {
      const err = await res.json()
      setInviteMsg(`Erreur : ${err.message || 'Invitation échouée'}`)
    }
    setInviting(false)
  }

  function openEdit(member) {
    setEditForm({
      id: member.id,
      name: member.name || '',
      role: member.role || 'va',
      pay_type: member.pay_type || 'palier_a',
      pay_pct: member.pay_pct || 0,
      model_ids: member.model_ids || [],
    })
    setEditOpen(true)
  }

  async function saveMember() {
    await upsert('profiles', { ...editForm }, 'profiles')
    setEditOpen(false)
  }

  async function addWarn() {
    await insert('va_warns', {
      va_id: selMember.id,
      date: new Date().toISOString().slice(0, 10),
      motif: warnForm.motif,
      niveau: warnForm.niveau,
    }, 'vaWarns')
    setWarnOpen(false)
    setWarnForm({ motif: '', niveau: 'warning' })
  }

  async function removeMember(id) {
    if (window.confirm('Supprimer ce membre ?')) {
      await supabase.auth.admin.deleteUser(id)
      await loadData()
    }
  }

  const memberWarns = selMember ? vaWarns.filter(w => w.va_id === selMember.id) : []

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {/* Liste */}
      <div style={{ width: 240, flexShrink: 0 }}>
        <div style={{ ...st.card(0), overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={st.cTitle}>Équipe ({team.length})</div>
            <button style={st.btn('primary', 'xs')} onClick={() => setInviteOpen(true)}>+ Inviter</button>
          </div>

          {/* Admins */}
          {admins.length > 0 && (
            <div style={{ padding: '6px 0' }}>
              <div style={{ padding: '4px 14px', fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Admins</div>
              {admins.map(m => (
                <MemberRow key={m.id} member={m} active={selMember?.id === m.id} onClick={() => setSelMember(m)}/>
              ))}
            </div>
          )}

          {/* Team */}
          <div style={{ padding: '6px 0' }}>
            <div style={{ padding: '4px 14px', fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>VAs & TLs</div>
            {team.length === 0
              ? <div style={{ padding: '16px 14px', color: C.muted, fontSize: 12 }}>Aucun membre</div>
              : team.map(m => <MemberRow key={m.id} member={m} active={selMember?.id === m.id} onClick={() => setSelMember(m)}/>)
            }
          </div>
        </div>
      </div>

      {/* Détail */}
      <div style={{ flex: 1 }}>
        {!selMember
          ? <EmptyState icon="◐" title="Sélectionne un membre" sub="Clique sur un membre pour voir ses détails"/>
          : (
            <div>
              <div style={{ ...st.card(18), marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={st.row}>
                    <div style={{ ...st.avatar(C.accent), width: 44, height: 44, fontSize: 18 }}>
                      {(selMember.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 17 }}>{selMember.name}</div>
                      <div style={st.sub}>{selMember.email}</div>
                    </div>
                  </div>
                  <div style={st.row}>
                    <Badge label={selMember.role} color={selMember.role === 'tl' ? C.purple : C.green}/>
                    <button style={st.btn('ghost', 'sm')} onClick={() => openEdit(selMember)}>✏ Modifier</button>
                    {(selMember.role === 'va' || selMember.role === 'tl') && (
                      <button style={st.btn('danger', 'sm')} onClick={() => { setSelMember(selMember); setWarnOpen(true) }}>⚠ Avertir</button>
                    )}
                  </div>
                </div>

                {/* Infos paie */}
                {(selMember.role === 'va' || selMember.role === 'tl') && (
                  <div style={{ ...st.card2(14), marginBottom: 12 }}>
                    <div style={st.cTitle}>Contrat & Rémunération</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <div style={st.label}>Type de contrat</div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {selMember.pay_type === 'pct' ? `% du CA (${selMember.pay_pct}%)` :
                           selMember.pay_type === 'palier_a' ? 'Système A — 3 comptes' :
                           'Système B — 4 comptes'}
                        </div>
                      </div>
                      <div>
                        <div style={st.label}>Fréquence</div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{selMember.frequence_paye || 'Mensuel'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modèles assignés */}
                <div>
                  <div style={st.label}>Modèles assignés</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(Array.isArray(selMember.model_ids) ? selMember.model_ids : []).map(mid => {
                      const m = models.find(x => x.id === mid)
                      return m ? (
                        <span key={mid} style={{ background: `${m.color || C.accent}22`, color: m.color || C.accent, border: `1px solid ${m.color || C.accent}44`, borderRadius: 5, padding: '2px 9px', fontSize: 12, fontWeight: 700 }}>
                          {m.name}
                        </span>
                      ) : null
                    })}
                    {!(selMember.model_ids?.length) && <span style={{ color: C.muted, fontSize: 12 }}>Aucun modèle assigné</span>}
                  </div>
                </div>
              </div>

              {/* Avertissements */}
              {memberWarns.length > 0 && (
                <div style={st.card(16)}>
                  <div style={st.cTitle}>Avertissements ({memberWarns.length})</div>
                  {memberWarns.map(w => (
                    <div key={w.id} style={{ ...st.card2(10), marginBottom: 6, borderLeft: `3px solid ${w.niveau === 'grave' ? C.red : C.orange}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{w.motif}</span>
                        <span style={{ fontSize: 11, color: C.sub }}>{w.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        }
      </div>

      {/* Modal invitation */}
      {inviteOpen && (
        <Modal title="Inviter un membre" onClose={() => setInviteOpen(false)} width={460}>
          <Field label="Email"><input type="email" style={st.input} value={inviteForm.email} onChange={e => f('email', e.target.value)} placeholder="email@exemple.com"/></Field>
          <Field label="Nom"><input style={st.input} value={inviteForm.name} onChange={e => f('name', e.target.value)} placeholder="Prénom Nom"/></Field>
          <Field label="Rôle">
            <select style={st.input} value={inviteForm.role} onChange={e => f('role', e.target.value)}>
              <option value="va">VA</option>
              <option value="tl">Team Leader</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          {(inviteForm.role === 'va' || inviteForm.role === 'tl') && (
            <Field label="Type de contrat">
              <select style={st.input} value={inviteForm.pay_type} onChange={e => f('pay_type', e.target.value)}>
                <option value="palier_a">Système A — 3 comptes</option>
                <option value="palier_b">Système B — 4 comptes</option>
                <option value="pct">% du CA</option>
              </select>
            </Field>
          )}
          {inviteForm.pay_type === 'pct' && (
            <Field label="Pourcentage (%)"><input type="number" style={st.input} value={inviteForm.pay_pct} onChange={e => f('pay_pct', +e.target.value)}/></Field>
          )}
          {inviteMsg && (
            <div style={{ background: inviteMsg.startsWith('✓') ? C.greenDim : C.redDim, border: `1px solid ${inviteMsg.startsWith('✓') ? C.green : C.red}44`, borderRadius: 8, padding: '10px 14px', color: inviteMsg.startsWith('✓') ? C.green : C.red, fontSize: 13, marginBottom: 12 }}>
              {inviteMsg}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button style={st.btn('ghost')} onClick={() => setInviteOpen(false)}>Annuler</button>
            <button style={st.btn('primary')} onClick={inviteMember} disabled={inviting || !inviteForm.email}>
              {inviting ? 'Envoi...' : '✉ Envoyer l\'invitation'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal edit membre */}
      {editOpen && (
        <Modal title="Modifier le membre" onClose={() => setEditOpen(false)} width={460}>
          <Field label="Nom"><input style={st.input} value={editForm.name} onChange={e => ef('name', e.target.value)}/></Field>
          <Field label="Rôle">
            <select style={st.input} value={editForm.role} onChange={e => ef('role', e.target.value)}>
              <option value="va">VA</option>
              <option value="tl">Team Leader</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </Field>
          {(editForm.role === 'va' || editForm.role === 'tl') && (
            <>
              <Field label="Type de contrat">
                <select style={st.input} value={editForm.pay_type} onChange={e => ef('pay_type', e.target.value)}>
                  <option value="palier_a">Système A — 3 comptes (fixe 200$)</option>
                  <option value="palier_b">Système B — 4 comptes (fixe 300$)</option>
                  <option value="pct">% du CA</option>
                </select>
              </Field>
              {editForm.pay_type === 'pct' && (
                <Field label="Pourcentage (%)"><input type="number" style={st.input} value={editForm.pay_pct} onChange={e => ef('pay_pct', +e.target.value)}/></Field>
              )}
              <div>
                <div style={st.label}>Modèles assignés</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {data.models.map(m => {
                    const assigned = (editForm.model_ids || []).includes(m.id)
                    return (
                      <button key={m.id} style={{ ...st.btn(assigned ? 'primary' : 'ghost', 'sm'), background: assigned ? m.color || C.accent : 'transparent', color: assigned ? '#fff' : C.sub }}
                        onClick={() => ef('model_ids', assigned ? editForm.model_ids.filter(x => x !== m.id) : [...(editForm.model_ids || []), m.id])}>
                        {m.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button style={st.btn('ghost')} onClick={() => setEditOpen(false)}>Annuler</button>
            <button style={st.btn('primary')} onClick={saveMember}>Sauvegarder</button>
          </div>
        </Modal>
      )}

      {/* Modal avertissement */}
      {warnOpen && (
        <Modal title={`Avertir ${selMember?.name}`} onClose={() => setWarnOpen(false)} width={400}>
          <Field label="Motif"><input style={st.input} value={warnForm.motif} onChange={e => setWarnForm(p => ({ ...p, motif: e.target.value }))} placeholder="Ex : Retard de reporting"/></Field>
          <Field label="Niveau">
            <select style={st.input} value={warnForm.niveau} onChange={e => setWarnForm(p => ({ ...p, niveau: e.target.value }))}>
              <option value="warning">Avertissement</option>
              <option value="grave">Grave</option>
            </select>
          </Field>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button style={st.btn('ghost')} onClick={() => setWarnOpen(false)}>Annuler</button>
            <button style={st.btn('danger')} onClick={addWarn} disabled={!warnForm.motif}>Envoyer</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function MemberRow({ member, active, onClick }) {
  const colors = { owner: C.accent, admin: C.blue, tl: C.purple, va: C.green }
  const color = colors[member.role] || C.green
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left',
      background: active ? C.accentDim : 'transparent',
      border: 'none', borderLeft: active ? `2px solid ${C.accent}` : '2px solid transparent',
      padding: '8px 14px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 9,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ ...{ width: 28, height: 28, borderRadius: 7, background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color, flexShrink: 0 } }}>
        {(member.name || '?')[0].toUpperCase()}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? C.text : C.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name || member.email}</div>
        <div style={{ fontSize: 10, color: C.muted }}>{member.role?.toUpperCase()}</div>
      </div>
    </button>
  )
}
