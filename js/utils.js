// ============================================================
// SOLAIRE — Utils (chargé synchrone en <head>)
// ============================================================

// ── Formatters ────────────────────────────────────────────────
function fmt(n) {
  if (n === undefined || n === null || isNaN(n)) return '–';
  return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
}
function fmtDate(d) {
  if (!d) return '–';
  const [y,m,day] = String(d).split('-');
  return `${day}/${m}/${y}`;
}
function fmtPct(n,total) {
  if (!total) return '0%';
  return Math.round(n/total*100)+'%';
}

// ── Theme ─────────────────────────────────────────────────────
function initTheme() {
  const t = localStorage.getItem('solaire_theme') || 'dark';
  applyTheme(t, false);
}
function applyTheme(mode, save=true) {
  document.body.classList.toggle('light', mode==='light');
  if (save) localStorage.setItem('solaire_theme', mode);
  document.querySelectorAll('.theme-toggle').forEach(b => b.textContent = mode==='light' ? '🌙' : '☀️');
}
function toggleTheme() {
  applyTheme(document.body.classList.contains('light') ? 'dark' : 'light');
}

// ── Modal / Toast ─────────────────────────────────────────────
function openModal(id) { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }
function showToast(msg, type='ok') {
  const el = document.createElement('div');
  el.className = 'toast toast-'+type;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3200);
}

// ── Budget from invoices ──────────────────────────────────────
function budgetFromInvoices(invList) {
  const r = {};
  BUDGET_POSTES.forEach(p => { r[p.id] = {engage:0, paye:0}; });
  (invList || DEMO_INVOICES).filter(i => !i.archived).forEach(i => {
    if (!i.pid || !r[i.pid]) return;
    if (i.statut === 'payée') {
      r[i.pid].engage += i.montant;
      r[i.pid].paye   += i.montant;
    } else if (i.statut === 'en cours' || i.statut === 'en retard') {
      r[i.pid].engage += i.montant;
    }
  });
  return r;
}

// ── Helios calculator ─────────────────────────────────────────
function calcHelios(p) {
  const passages_jour    = p.visiteurs_jour * (p.taux_adoption/100);
  const passages_haute   = passages_jour * p.jours_mois * p.haute_saison;
  const passages_epaule  = passages_jour * p.jours_mois * p.epaule * 0.5;
  const passages_annuels = passages_haute + passages_epaule;
  const vol_litres       = passages_annuels * (p.conso_ml/1000);
  const refills_annuels  = Math.ceil(vol_litres / 5);
  const mois_actifs      = p.haute_saison + p.epaule;
  const ca_brut          = passages_annuels * p.prix_brumisation;
  const ca_net           = ca_brut * (1 - p.nayax/100);
  const cout_labo        = refills_annuels * p.cout_refill_5L;

  // Modèle A
  const refills_factures_A = Math.max(0, refills_annuels - (p.offerts_A * mois_actifs));
  const A = (p.abo_A * mois_actifs) + (refills_factures_A * p.refill_A) - cout_labo;

  // Modèle B
  const B = (ca_net * 0.5) + (p.abo_B * mois_actifs) + (refills_annuels * p.refill_B) - cout_labo;

  // Modèle D
  const D = ca_net - cout_labo;

  // Modèle E y1
  const marge_machine_E = p.prix_E - p.cout_machine;
  const marge_refill_E  = (p.refill_E * refills_annuels) - cout_labo;
  const commission_E    = ca_net * ((p.commission_E - p.nayax)/100);
  const E = marge_machine_E + p.maintenance_E + marge_refill_E + commission_E;

  const m_A = p.nb_machines * (p.mix_A/100);
  const m_B = p.nb_machines * (p.mix_B/100);
  const m_D = p.nb_machines * (p.mix_D/100);
  const m_E = p.nb_machines * (p.mix_E/100);
  const mix_total = m_A*A + m_B*B + m_D*D + m_E*E;

  return {
    passages_annuels: Math.round(passages_annuels),
    vol_litres: Math.round(vol_litres*10)/10,
    refills_annuels,
    ca_net: Math.round(ca_net),
    cout_labo: Math.round(cout_labo),
    A: Math.round(A), A_total: Math.round(A * p.nb_machines),
    B: Math.round(B), B_total: Math.round(B * p.nb_machines),
    D: Math.round(D), D_total: Math.round(D * p.nb_machines),
    E: Math.round(E), E_total: Math.round(E * p.nb_machines),
    mix_total: Math.round(mix_total),
    mix_machines: {A:m_A, B:m_B, D:m_D, E:m_E},
  };
}
