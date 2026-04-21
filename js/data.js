// ============================================================
// SOLAIRE — Data & Auth (chargé synchrone en <head>)
// ============================================================

const DEMO_LOGINS = {
  'sane@solaire.com':    { password:'demo1234', role:'founder',    name:'Sane',    initials:'SA' },
  'matheo@solaire.com':  { password:'demo1234', role:'founder',    name:'Mathéo',  initials:'MA' },
  'clement@solaire.com': { password:'demo1234', role:'founder',    name:'Clément', initials:'CL' },
  'hugo@solaire.com':    { password:'demo1234', role:'founder',    name:'Hugo',    initials:'HU' },
  'lucas@solaire.com':   { password:'demo1234', role:'commercial', name:'Lucas',   initials:'LU' },
  'sarah@solaire.com':   { password:'demo1234', role:'commercial', name:'Sarah',   initials:'SA' },
};

function getCurrentUser() {
  try { return JSON.parse(sessionStorage.getItem('solaire_user') || 'null'); } catch { return null; }
}

function requireAuth(expectedRole) {
  const u = getCurrentUser();
  if (!u) { window.location.href = 'index.html'; return null; }
  if (expectedRole && u.role !== expectedRole) {
    window.location.href = u.role === 'founder' ? 'dashboard-founder.html' : 'dashboard-commercial.html';
    return null;
  }
  return u;
}

// ── Fournisseurs (CRM XLSX) ───────────────────────────────────
const DEMO_SUPPLIERS = [
  { id:'s1',  prenom:'Sittidej', nom:'Somprakit',   societe:'B.T. Spaceship',              poste:'Sales & Marketing Director',   email:'–',                            tel:'+66 82 229 4646', pays:'Bangkok, TH',   langue:'TH/EN', statut:'Actif',       priorite:'Haute',   categorie:'ODM & Manufacturing',     notes:'ODM Bangkok principal. Devis reçu 9 avr. Réunion confirmée 8 avr.' },
  { id:'s2',  prenom:'Renna',    nom:'A.',           societe:'Aquatonale FZC',              poste:'Sales Manager',                email:'sales@aquatonale.ae',          tel:'–',               pays:'Sharjah, UAE',  langue:'EN/AR', statut:'Actif',       priorite:'Haute',   categorie:'ODM & Manufacturing',     notes:'Devis SCL091025 — Sun Water SPF50 120ml / 9.38 AED. MOQ 1,250.' },
  { id:'s3',  prenom:'Kalea',    nom:'–',            societe:'Guangzhou Youthtour Plastic', poste:'Account Manager',              email:'–',                            tel:'+86 186 6398 2276',pays:'Guangzhou, CN', langue:'EN/ZH', statut:'Actif',       priorite:'Haute',   categorie:'Packaging & Équipement',  notes:'Flacons packaging principal. Confirmé fournisseur hero SKU.' },
  { id:'s4',  prenom:'Mint',     nom:'Pimwika K.',   societe:'A.Best Inter Products',       poste:'–',                            email:'–',                            tel:'–',               pays:'Bangkok, TH',   langue:'TH',    statut:'Froid',       priorite:'Normale', categorie:'Packaging & Équipement',  notes:'Non retenu pour hero SKU.' },
  { id:'s5',  prenom:'Meng',     nom:'Wang',         societe:'TCN / Changsha Zhonggu',      poste:'Account Manager',              email:'–',                            tel:'–',               pays:'Changsha, CN',  langue:'EN/ZH', statut:'Actif',       priorite:'Haute',   categorie:'Packaging & Équipement',  notes:'Contrat CZG-WXS-2603-0095-WM. MOQ 50 unités. Exclusivité Art.7.1.' },
  { id:'s6',  prenom:'Dan',      nom:'–',            societe:'UV Equipment Specialist',     poste:'Partenaire technologique kiosque', email:'–',                        tel:'–',               pays:'–',             langue:'EN',    statut:'Actif',       priorite:'Haute',   categorie:'Packaging & Équipement',  notes:'Crédité partenaire tech sur kiosques UV Reveal.' },
  { id:'s7',  prenom:'–',        nom:'–',            societe:'MaxMax / LDP LLC',            poste:'Fournisseur caméra UV',        email:'–',                            tel:'–',               pays:'USA',           langue:'EN',    statut:'À contacter', priorite:'Normale', categorie:'Packaging & Équipement',  notes:'Caméra XNiteUSB8M-MNCUVL. Candidat primaire UV Reveal kiosk.' },
  { id:'s8',  prenom:'–',        nom:'–',            societe:'Fret Free Productions',       poste:'Fabricant enclosure kiosque',  email:'info@fretfreeproductions.com', tel:'–',               pays:'Bangkok, TH',   langue:'EN',    statut:'À contacter', priorite:'Haute',   categorie:'Packaging & Équipement',  notes:'Top priorité pour enclosure premium + intégration hardware.' },
  { id:'s9',  prenom:'Paul',     nom:'Ashburn',      societe:'HLB Thailand',                poste:'Partner',                      email:'paul.a@hlbthailand.com',       tel:'+66 81 499 5707', pays:'Bangkok, TH',   langue:'EN',    statut:'Actif',       priorite:'Haute',   categorie:'Legal & Corporate',       notes:'Conseil corporate BOI Thailand.' },
  { id:'s10', prenom:'Wimontri', nom:'Kaewprachum',  societe:'FRANK Legal & Tax Ltd.',      poste:'Secretary',                    email:'porramutt@franklegaltax.com',  tel:'+66 2 026 3284',  pays:'Bangkok, TH',   langue:'TH/EN', statut:'Actif',       priorite:'Haute',   categorie:'Legal & Corporate',       notes:'Entité BOI Bangkok. Réunion confirmée 9 avr.' },
];

// ── Clients ───────────────────────────────────────────────────
const DEMO_CLIENTS = [
  { id:'c1', prenom:'Lewis', nom:'–',  societe:'Un Hour',              poste:'CEO',              email:'–',                      tel:'+44 7402 262171', pays:'Bangkok, TH',  langue:'EN', statut:'À qualifier', priorite:'Normale', notes:"Propriétaire café branché Bangkok. Idéal pour workshop." },
  { id:'c2', prenom:'–',    nom:'–',  societe:'Hôtel Pouquet Paris',   poste:'Directeur Spa',    email:'spa@hotel-pouquet.com',  tel:'–',               pays:'Paris, FR',    langue:'FR', statut:'Actif',       priorite:'Haute',   notes:'Destination pilote Helios. Déploiement confirmé Q2 2025.' },
  { id:'c3', prenom:'–',    nom:'–',  societe:'Four Seasons Bangkok',  poste:'Wellness Manager', email:'–',                      tel:'–',               pays:'Bangkok, TH',  langue:'EN', statut:'En approche', priorite:'Haute',   notes:'Prospect haut de gamme Helios. À recontacter après prototype.' },
  { id:'c4', prenom:'–',    nom:'–',  societe:'Rosewood Phuket',       poste:'Spa Director',     email:'–',                      tel:'–',               pays:'Phuket, TH',   langue:'EN', statut:'En approche', priorite:'Normale', notes:'Piste Helios resort luxe.' },
];

// ── Budget postes ─────────────────────────────────────────────
const BUDGET_POSTES = [
  { id:'b1',  tranche:'T1', categorie:'Développement produit', label:'Formulation & R&D ODM',        budget:15000 },
  { id:'b2',  tranche:'T1', categorie:'Développement produit', label:'Packaging & flacons proto',    budget:8000  },
  { id:'b3',  tranche:'T1', categorie:'Développement produit', label:'Tests & certification SPF',    budget:5000  },
  { id:'b4',  tranche:'T1', categorie:'Machine Helios',        label:'Développement machine TCN',    budget:20000 },
  { id:'b5',  tranche:'T1', categorie:'Machine Helios',        label:'Prototype kiosque UV',         budget:12000 },
  { id:'b6',  tranche:'T1', categorie:'Structuration',         label:'Frais juridiques & BOI',       budget:8000  },
  { id:'b7',  tranche:'T1', categorie:'Structuration',         label:'Comptabilité & audit',         budget:3000  },
  { id:'b8',  tranche:'T1', categorie:'Marketing',             label:'Branding & identité visuelle', budget:5000  },
  { id:'b9',  tranche:'T2', categorie:'Production',            label:'Première production ODM',      budget:30000 },
  { id:'b10', tranche:'T2', categorie:'Production',            label:'Packaging série 1',            budget:10000 },
  { id:'b11', tranche:'T2', categorie:'Machine Helios',        label:'Fabrication série 0 (x5)',     budget:25000 },
  { id:'b12', tranche:'T2', categorie:'Distribution',          label:'Logistique & fret',            budget:8000  },
  { id:'b13', tranche:'T2', categorie:'Marketing',             label:'Lancement & activation',       budget:15000 },
  { id:'b14', tranche:'T3', categorie:'Production',            label:'Production scale-up',          budget:80000 },
  { id:'b15', tranche:'T3', categorie:'Machine Helios',        label:'Série 1 (x20 machines)',       budget:60000 },
  { id:'b16', tranche:'T3', categorie:'Distribution',          label:'Expansion ASEAN',              budget:20000 },
  { id:'b17', tranche:'T3', categorie:'Marketing',             label:'Campagne régionale',           budget:25000 },
  { id:'b18', tranche:'T3', categorie:'Structuration',         label:'RH & recrutement',             budget:15000 },
];

// ── Factures (demo) ───────────────────────────────────────────
const DEMO_INVOICES = [
  { id:'inv1', ref:'FAC-2025-001', sid:'s1',  fournisseur:'B.T. Spaceship',         pid:'b1', poste:'Formulation & R&D ODM',     montant:9500,  date:'2025-02-15', echeance:'2025-03-15', statut:'payée',     description:'Formulation Sun Water SPF50 — proto batch', archived:false },
  { id:'inv2', ref:'FAC-2025-002', sid:'s5',  fournisseur:'TCN / Changsha Zhonggu', pid:'b4', poste:'Développement machine TCN',  montant:10000, date:'2025-03-01', echeance:'2025-04-01', statut:'en cours',  description:'Acompte 30% développement machine Helios',  archived:false },
  { id:'inv3', ref:'FAC-2025-003', sid:'s10', fournisseur:'FRANK Legal & Tax',      pid:'b6', poste:'Frais juridiques & BOI',     montant:3500,  date:'2025-03-10', echeance:'2025-04-10', statut:'payée',     description:'Structuration entité BOI + frais dossier',  archived:false },
  { id:'inv4', ref:'FAC-2025-004', sid:'s3',  fournisseur:'Guangzhou Youthtour',    pid:'b2', poste:'Packaging & flacons proto',  montant:4200,  date:'2025-03-20', echeance:'2025-04-20', statut:'en retard', description:'Échantillons flacons 120ml — 500 unités',    archived:false },
  { id:'inv5', ref:'FAC-2025-005', sid:'s9',  fournisseur:'HLB Thailand',           pid:'b7', poste:'Comptabilité & audit',       montant:1800,  date:'2025-04-01', echeance:'2025-05-01', statut:'en cours',  description:'Audit comptable Q1 2025',                   archived:false },
  { id:'inv6', ref:'FAC-2025-006', sid:'s5',  fournisseur:'TCN / Changsha Zhonggu', pid:'b5', poste:'Prototype kiosque UV',       montant:7500,  date:'2025-04-10', echeance:'2025-05-10', statut:'en cours',  description:'Prototype kiosque UV enclosure v1',         archived:false },
];

// ── Tâches ────────────────────────────────────────────────────
const DEMO_TASKS = [
  { id:'t1', titre:'Finaliser devis B.T. Spaceship',       assignee:'sane@solaire.com',    statut:'en cours',  priorite:'haute',   due:'2025-04-25' },
  { id:'t2', titre:'Relancer TCN sur prototype machine',   assignee:'matheo@solaire.com',  statut:'en cours',  priorite:'haute',   due:'2025-04-20' },
  { id:'t3', titre:'Réunion BOI avec FRANK Legal',         assignee:'clement@solaire.com', statut:'complété',  priorite:'haute',   due:'2025-04-09' },
  { id:'t4', titre:'Sourcer flacons alternatifs Lumson',   assignee:'hugo@solaire.com',    statut:'à faire',   priorite:'normale', due:'2025-05-01' },
  { id:'t5', titre:'Démo Helios — Hôtel Pouquet Paris',    assignee:'lucas@solaire.com',   statut:'à faire',   priorite:'haute',   due:'2025-05-15' },
  { id:'t6', titre:'Envoyer deck investisseurs',           assignee:'sarah@solaire.com',   statut:'en cours',  priorite:'normale', due:'2025-04-30' },
];

// ── RDV ───────────────────────────────────────────────────────
const DEMO_APPOINTMENTS = [
  { id:'a1', titre:'Réunion HLB Thailand (Paul Ashburn)', date:'2025-04-22', heure:'10:00', lieu:'Bangkok',  assignee:'clement@solaire.com' },
  { id:'a2', titre:'Call TCN — suivi proto machine',      date:'2025-04-24', heure:'14:00', lieu:'Zoom',     assignee:'matheo@solaire.com'  },
  { id:'a3', titre:'Démo Helios — Hôtel Pouquet',         date:'2025-05-10', heure:'11:00', lieu:'Paris',    assignee:'lucas@solaire.com'   },
  { id:'a4', titre:'Visite usine B.T. Spaceship',         date:'2025-04-30', heure:'09:00', lieu:'Bangkok',  assignee:'sane@solaire.com'    },
];

// ── Objectifs ─────────────────────────────────────────────────
const DEMO_OBJECTIVES = [
  { id:'o1', label:'Valider 2 ODM partenaires H1',          progress:60, tranche:'T1', owner:'Sane'    },
  { id:'o2', label:'Prototype machine Helios livré',         progress:40, tranche:'T1', owner:'Mathéo'  },
  { id:'o3', label:'Structuration juridique BOI finalisée',  progress:80, tranche:'T1', owner:'Clément' },
  { id:'o4', label:'Première production ODM confirmée',      progress:10, tranche:'T2', owner:'Sane'    },
  { id:'o5', label:'5 hôtels partenaires signés',            progress:20, tranche:'T2', owner:'Lucas'   },
];

// ── Calculateur destinations ──────────────────────────────────
const CALC_DESTINATIONS = {
  'Pouquet': {
    label: 'Hôtel Pouquet Paris',
    p: {
      visiteurs_jour:350, taux_adoption:15, jours_mois:25,
      haute_saison:6, epaule:2,
      prix_brumisation:1.67, conso_ml:30,
      cout_machine:1340, cout_refill_5L:65, nayax:3,
      abo_A:750, refill_A:192, offerts_A:1,
      abo_B:200, refill_B:70, part_B:50,
      prix_E:3500, refill_E:141, maintenance_E:615, commission_E:8,
      nb_machines:50,
      mix_A:40, mix_B:20, mix_D:30, mix_E:10,
    }
  }
};
