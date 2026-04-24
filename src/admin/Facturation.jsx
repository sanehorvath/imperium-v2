import React, { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext'
import { C, st, INV_CATS } from '../lib/design'
import { Modal, EmptyState, Field } from '../components/UI'

const BLANK = { libelle: '', categorie: 'autre', beneficiaire: '', montant: '', statut: 'en_cours', frequence: 'ponctuel', date_echeance: '' }

export default function Facturation() {
  const { data, upsert, insert, remove } = useApp()
  const [addOpen, setAddOpen] = useState(false)
  const [editInv, setEditInv] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [filterCat, setFilterCat] = useState('all')

  if (!data) return null
  const { invoices } = data
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const filtered = useMemo(() =>
    invoices.filter(i => filterCat === 'all' || i.categorie === filterCat),
    [invoices, filterCat]
  )

  const totByStatus = s => filtered.filter(i => i.statut === s).reduce((a, i) => a + Number(i.montant || 0), 0)

  function openEdit(inv) { setEditInv(inv); setForm({ ...inv, montant: String(inv.montant) }); setAddOpen(true) }
  function openAdd() { setEditInv(null); setForm(BLANK); setAddOpen(true) }

  async function save() {
    const record = { ...form, montant: Number(form.montant) || 0 }
    if (editInv) await upsert('invoices', { ...editInv, ...record }, 'invoices')
    else await insert('invoices', { ...record, id: `inv_${Date.now()}` }, 'invoices')
    setAddOpen(false)
  }

  async function markPaid(inv) {
    await upsert('invoices', { ...inv, statut: 'payé', date_paiement: new Date().toISOString().slice(0, 10) }, 'invoices')
  }

  async function deleteInv(id) {
    if (window.confirm('Supprimer cette facture ?')) await remove('invoices', id, 'invoices')
  }

  const catInfo = id => INV_CATS.find(c => c.id === id) || INV_CATS[INV_CATS.length - 1]

  const COLS = [
    { id: 'en_cours',  label: 'En cours',  color: C.accent },
    { id: 'en_retard', label: 'En retard', color: C.red },
    { id: 'payé',      label: 'Payé',      color: C.green },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={st.btn(filterCat === 'all' ? 'primary' : 'ghost', 'sm')} onClick={() => setFilterCat('all')}>Tout</button>
          {INV_CATS.map(cat => (
            <button key={cat.id} style={{ ...st.btn('ghost', 'sm'), background: filterCat === cat.id ? cat.color : 'transparent', color: filterCat === cat.id ? '#fff' : C.sub }}
              onClick={() => setFilterCat(cat.id)}>{cat.label}</button>
          ))}
        </div>
        <button style={st.btn('primary', 'sm')} onClick={openAdd}>+ Facture</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {COLS.map(col => (
          <div key={col.id}>
            <div style={{ ...st.card2(12), marginBottom: 10, borderLeft: `3px solid ${col.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 12, color: col.color }}>{col.label}</span>
              <span style={{ fontWeight: 800, color: col.color, fontSize: 13 }}>${totByStatus(col.id).toLocaleString()}</span>
            </div>
            {filtered.filter(i => i.statut === col.id).length === 0
              ? <div style={{ color: C.muted, fontSize: 12, textAlign: 'center', padding: '20px 0' }}>Aucune facture</div>
              : filtered.filter(i => i.statut === col.id).map(inv => {
                  const cat = catInfo(inv.categorie)
                  return (
                    <div key={inv.id} style={{ ...st.card(14), marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3, color: C.text }}>{inv.libelle}</div>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ background: `${cat.color}18`, color: cat.color, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{cat.label}</span>
                            {inv.beneficiaire && <span style={{ ...st.sub, color: C.sub }}>{inv.beneficiaire}</span>}
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: C.accent, marginLeft: 8 }}>${Number(inv.montant).toLocaleString()}</div>
                      </div>
                      {inv.date_echeance && (
                        <div style={{ fontSize: 11, color: inv.statut === 'en_retard' ? C.red : C.sub, marginBottom: 6 }}>
                          📅 Éch. {new Date(inv.date_echeance).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 5 }}>
                        {inv.statut !== 'payé' && <button style={st.btn('green', 'xs')} onClick={() => markPaid(inv)}>✓ Payé</button>}
                        <button style={st.btn('ghost', 'xs')} onClick={() => openEdit(inv)}>✏</button>
                        <button style={st.btn('danger', 'xs')} onClick={() => deleteInv(inv.id)}>✕</button>
                      </div>
                    </div>
                  )
                })
            }
          </div>
        ))}
      </div>

      {addOpen && (
        <Modal title={editInv ? 'Modifier la facture' : '+ Nouvelle facture'} onClose={() => setAddOpen(false)} width={500}>
          <div style={st.g2}>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="Libellé"><input style={st.input} value={form.libelle} onChange={e => f('libelle', e.target.value)} placeholder="Ex : Salaire VA"/></Field>
            </div>
            <Field label="Montant ($)"><input type="number" style={st.input} value={form.montant} onChange={e => f('montant', e.target.value)}/></Field>
            <Field label="Catégorie">
              <select style={st.input} value={form.categorie} onChange={e => f('categorie', e.target.value)}>
                {INV_CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Bénéficiaire"><input style={st.input} value={form.beneficiaire} onChange={e => f('beneficiaire', e.target.value)}/></Field>
            <Field label="Fréquence">
              <select style={st.input} value={form.frequence} onChange={e => f('frequence', e.target.value)}>
                <option value="ponctuel">Ponctuel</option>
                <option value="mensuel">Mensuel</option>
              </select>
            </Field>
            <Field label="Statut">
              <select style={st.input} value={form.statut} onChange={e => f('statut', e.target.value)}>
                <option value="en_cours">En cours</option>
                <option value="en_retard">En retard</option>
                <option value="payé">Payé</option>
              </select>
            </Field>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="Date d'échéance"><input type="date" style={st.input} value={form.date_echeance || ''} onChange={e => f('date_echeance', e.target.value)}/></Field>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button style={st.btn('ghost')} onClick={() => setAddOpen(false)}>Annuler</button>
            <button style={st.btn('primary')} onClick={save} disabled={!form.libelle || !form.montant}>Sauvegarder</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
