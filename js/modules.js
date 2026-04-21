// ============================================================
// SOLAIRE — Modules (tous les renderers de vues)
// ============================================================
// État mutable (copie des données démo, modifiable en session)
let INV  = DEMO_INVOICES.map(i=>({...i}));
let SUPP = DEMO_SUPPLIERS.map(s=>({...s}));
let CLI  = DEMO_CLIENTS.map(c=>({...c}));
let TASK = DEMO_TASKS.map(t=>({...t}));
let APT  = DEMO_APPOINTMENTS.map(a=>({...a}));
let OBJ  = DEMO_OBJECTIVES.map(o=>({...o}));

// ════════════════════════════════════════════════════════════
// OBJECTIFS
// ════════════════════════════════════════════════════════════
function renderObjectives() {
  const el = document.getElementById('view-objectives'); if(!el) return;
  const avg = OBJ.length ? Math.round(OBJ.reduce((s,o)=>s+o.progress,0)/OBJ.length) : 0;
  const grouped = {};
  OBJ.forEach(o => { (grouped[o.tranche]||(grouped[o.tranche]=[])).push(o); });

  el.innerHTML = `
    <div class="vh"><h2>Objectifs</h2>
      <div class="vhright"><span class="badge-info">Avancement moyen : ${avg}%</span>
        <button class="btn-primary" onclick="openModal('mo-obj')">+ Ajouter</button>
      </div>
    </div>
    ${Object.entries(grouped).map(([tr,items])=>`
      <div class="card mb16">
        <div class="card-label">Tranche ${tr}</div>
        ${items.map(o=>`
          <div class="obj-row">
            <div class="obj-label">${o.label}<span class="badge-neutral ml8">${o.owner}</span></div>
            <div class="progress-wrap"><div class="progress-fill" style="width:${o.progress}%"></div></div>
            <span class="obj-pct">${o.progress}%</span>
          </div>`).join('')}
      </div>`).join('')}
    <div id="mo-obj" class="modal-overlay">
      <div class="modal"><div class="mh"><span>Nouvel objectif</span><button onclick="closeModal('mo-obj')">✕</button></div>
        <div class="mb10"><label class="ml">Libellé</label><input id="on-label" class="inp" /></div>
        <div class="mb10"><label class="ml">Tranche</label><select id="on-tranche" class="inp"><option>T1</option><option>T2</option><option>T3</option></select></div>
        <div class="mb10"><label class="ml">Responsable</label><input id="on-owner" class="inp" /></div>
        <div class="mb10"><label class="ml">Avancement (%)</label><input id="on-prog" class="inp" type="number" min="0" max="100" value="0"/></div>
        <div class="mf"><button class="btn-sec" onclick="closeModal('mo-obj')">Annuler</button>
          <button class="btn-primary" onclick="saveObjective()">Enregistrer</button></div>
      </div></div>`;
}
function saveObjective() {
  const label = document.getElementById('on-label').value.trim();
  if (!label) return showToast('Libellé requis','err');
  OBJ.push({id:'o'+Date.now(), label, tranche:document.getElementById('on-tranche').value, owner:document.getElementById('on-owner').value||'–', progress:parseInt(document.getElementById('on-prog').value)||0});
  closeModal('mo-obj'); renderObjectives(); showToast('Objectif ajouté');
}

// ════════════════════════════════════════════════════════════
// TÂCHES
// ════════════════════════════════════════════════════════════
function renderTasks(userEmail, role) {
  const el = document.getElementById('view-tasks'); if(!el) return;
  const items = role==='founder' ? TASK : TASK.filter(t=>t.assignee===userEmail);
  const cols = {'à faire':[], 'en cours':[], 'complété':[]};
  items.forEach(t => { (cols[t.statut]||[]).push(t); });
  const labels = {'à faire':'À faire','en cours':'En cours','complété':'Complété'};

  el.innerHTML = `
    <div class="vh"><h2>Tâches</h2>
      <button class="btn-primary" onclick="openModal('mo-task')">+ Ajouter</button>
    </div>
    <div class="kanban">
      ${Object.entries(cols).map(([st,its])=>`
        <div class="kcol">
          <div class="kcol-h">${labels[st]}<span class="badge-count">${its.length}</span></div>
          ${its.map(t=>`
            <div class="kcard kp-${t.priorite}">
              <div class="kc-title">${t.titre}</div>
              <div class="kc-meta">${t.assignee.split('@')[0]} · ${fmtDate(t.due)}</div>
            </div>`).join('')}
        </div>`).join('')}
    </div>
    <div id="mo-task" class="modal-overlay">
      <div class="modal"><div class="mh"><span>Nouvelle tâche</span><button onclick="closeModal('mo-task')">✕</button></div>
        <div class="mb10"><label class="ml">Titre</label><input id="tn-titre" class="inp"/></div>
        <div class="mb10"><label class="ml">Assigné à</label><select id="tn-ass" class="inp">${Object.keys(DEMO_LOGINS).map(e=>`<option>${e}</option>`).join('')}</select></div>
        <div class="mb10"><label class="ml">Statut</label><select id="tn-stat" class="inp"><option>à faire</option><option>en cours</option><option>complété</option></select></div>
        <div class="mb10"><label class="ml">Priorité</label><select id="tn-prio" class="inp"><option>haute</option><option>normale</option></select></div>
        <div class="mb10"><label class="ml">Deadline</label><input id="tn-due" class="inp" type="date"/></div>
        <div class="mf"><button class="btn-sec" onclick="closeModal('mo-task')">Annuler</button>
          <button class="btn-primary" onclick="saveTask('${userEmail}','${role}')">Enregistrer</button></div>
      </div></div>`;
}
function saveTask(userEmail, role) {
  const titre = document.getElementById('tn-titre').value.trim();
  if (!titre) return showToast('Titre requis','err');
  TASK.push({id:'t'+Date.now(), titre, assignee:document.getElementById('tn-ass').value, statut:document.getElementById('tn-stat').value, priorite:document.getElementById('tn-prio').value, due:document.getElementById('tn-due').value});
  closeModal('mo-task'); renderTasks(userEmail, role); showToast('Tâche ajoutée');
}

// ════════════════════════════════════════════════════════════
// CALENDRIER
// ════════════════════════════════════════════════════════════
function renderCalendar(userEmail, role) {
  const el = document.getElementById('view-calendar'); if(!el) return;
  const items = (role==='founder' ? APT : APT.filter(a=>a.assignee===userEmail))
    .slice().sort((a,b)=>a.date.localeCompare(b.date));

  el.innerHTML = `
    <div class="vh"><h2>Calendrier</h2>
      <button class="btn-primary" onclick="openModal('mo-cal')">+ RDV</button>
    </div>
    ${items.length ? items.map(a=>`
      <div class="cal-row">
        <div class="cal-date">${fmtDate(a.date)}<span>${a.heure}</span></div>
        <div class="cal-body">
          <div class="cal-title">${a.titre}</div>
          <div class="cal-meta">📍 ${a.lieu} · 👤 ${a.assignee.split('@')[0]}</div>
        </div>
      </div>`).join('') : '<div class="empty">Aucun rendez-vous</div>'}
    <div id="mo-cal" class="modal-overlay">
      <div class="modal"><div class="mh"><span>Nouveau RDV</span><button onclick="closeModal('mo-cal')">✕</button></div>
        <div class="mb10"><label class="ml">Titre</label><input id="cn-titre" class="inp"/></div>
        <div class="mb10"><label class="ml">Date</label><input id="cn-date" class="inp" type="date"/></div>
        <div class="mb10"><label class="ml">Heure</label><input id="cn-heure" class="inp" type="time"/></div>
        <div class="mb10"><label class="ml">Lieu</label><input id="cn-lieu" class="inp"/></div>
        <div class="mb10"><label class="ml">Assigné à</label><select id="cn-ass" class="inp">${Object.keys(DEMO_LOGINS).map(e=>`<option>${e}</option>`).join('')}</select></div>
        <div class="mf"><button class="btn-sec" onclick="closeModal('mo-cal')">Annuler</button>
          <button class="btn-primary" onclick="saveCalendar('${userEmail}','${role}')">Enregistrer</button></div>
      </div></div>`;
}
function saveCalendar(userEmail, role) {
  const titre = document.getElementById('cn-titre').value.trim();
  if (!titre) return showToast('Titre requis','err');
  APT.push({id:'a'+Date.now(), titre, date:document.getElementById('cn-date').value, heure:document.getElementById('cn-heure').value||'–', lieu:document.getElementById('cn-lieu').value||'–', assignee:document.getElementById('cn-ass').value});
  closeModal('mo-cal'); renderCalendar(userEmail,role); showToast('RDV ajouté');
}

// ════════════════════════════════════════════════════════════
// FOURNISSEURS
// ════════════════════════════════════════════════════════════
function renderSuppliers(q='') {
  const el = document.getElementById('view-suppliers'); if(!el) return;
  const items = SUPP.filter(s=>!q || s.societe.toLowerCase().includes(q.toLowerCase())||s.categorie.toLowerCase().includes(q.toLowerCase())||s.prenom.toLowerCase().includes(q.toLowerCase()));
  el.innerHTML = `
    <div class="vh"><h2>Contacts Fournisseurs</h2>
      <div class="vhright">
        <input class="inp" placeholder="🔍 Rechercher..." oninput="renderSuppliers(this.value)" style="width:190px"/>
        <button class="btn-primary" onclick="openModal('mo-supp')">+ Ajouter</button>
      </div>
    </div>
    <div class="crm-grid">
      ${items.map(s=>`
        <div class="crm-card">
          <div class="crm-ch">
            <div class="crm-av">${(s.prenom!=='–'?s.prenom[0]:s.societe[0]).toUpperCase()}</div>
            <div><div class="crm-name">${s.prenom!=='–'?s.prenom+' '+s.nom:s.societe}</div><div class="crm-co">${s.societe}</div></div>
          </div>
          <div class="crm-tag">${s.categorie}</div>
          <div class="crm-row">📍 ${s.pays}</div>
          ${s.email!=='–'?`<div class="crm-row">✉️ ${s.email}</div>`:''}
          ${s.tel!=='–'?`<div class="crm-row">📞 ${s.tel}</div>`:''}
          <div class="crm-ft">
            <span class="bs bs-${s.statut.toLowerCase().replace(/\s/g,'-')}">${s.statut}</span>
            <span class="bp bp-${s.priorite.toLowerCase()}">${s.priorite}</span>
          </div>
          ${s.notes?`<div class="crm-notes">${s.notes}</div>`:''}
        </div>`).join('')}
    </div>
    ${suppModal()}`;
}
function suppModal() {
  return `<div id="mo-supp" class="modal-overlay">
    <div class="modal modal-w">
      <div class="mh"><span>Nouveau fournisseur</span><button onclick="closeModal('mo-supp')">✕</button></div>
      <div class="mgrid">
        <div><label class="ml">Société *</label><input id="sn-soc" class="inp"/></div>
        <div><label class="ml">Catégorie</label><select id="sn-cat" class="inp"><option>ODM & Manufacturing</option><option>Packaging & Équipement</option><option>Legal & Corporate</option><option>Tech & Freelances</option><option>Autre</option></select></div>
        <div><label class="ml">Prénom</label><input id="sn-pre" class="inp"/></div>
        <div><label class="ml">Nom</label><input id="sn-nom" class="inp"/></div>
        <div><label class="ml">Poste</label><input id="sn-pos" class="inp"/></div>
        <div><label class="ml">Email</label><input id="sn-email" class="inp"/></div>
        <div><label class="ml">Téléphone</label><input id="sn-tel" class="inp"/></div>
        <div><label class="ml">Pays / Ville</label><input id="sn-pays" class="inp"/></div>
        <div><label class="ml">Statut</label><select id="sn-stat" class="inp"><option>Actif</option><option>Froid</option><option>À contacter</option></select></div>
        <div><label class="ml">Priorité</label><select id="sn-prio" class="inp"><option>Haute</option><option>Normale</option><option>Basse</option></select></div>
        <div style="grid-column:1/-1"><label class="ml">Notes</label><textarea id="sn-notes" class="inp" rows="3"></textarea></div>
      </div>
      <div class="mf"><button class="btn-sec" onclick="closeModal('mo-supp')">Annuler</button>
        <button class="btn-primary" onclick="saveSupplier()">Enregistrer</button></div>
    </div></div>`;
}
function saveSupplier() {
  const s = document.getElementById('sn-soc').value.trim();
  if (!s) return showToast('Société requise','err');
  SUPP.push({id:'s'+Date.now(), societe:s, categorie:document.getElementById('sn-cat').value, prenom:document.getElementById('sn-pre').value||'–', nom:document.getElementById('sn-nom').value||'–', poste:document.getElementById('sn-pos').value||'–', email:document.getElementById('sn-email').value||'–', tel:document.getElementById('sn-tel').value||'–', pays:document.getElementById('sn-pays').value||'–', statut:document.getElementById('sn-stat').value, priorite:document.getElementById('sn-prio').value, notes:document.getElementById('sn-notes').value});
  closeModal('mo-supp'); renderSuppliers(); showToast('Fournisseur ajouté');
}

// ════════════════════════════════════════════════════════════
// CLIENTS
// ════════════════════════════════════════════════════════════
function renderClients(q='') {
  const el = document.getElementById('view-clients'); if(!el) return;
  const items = CLI.filter(c=>!q||c.societe.toLowerCase().includes(q.toLowerCase())||c.prenom.toLowerCase().includes(q.toLowerCase()));
  el.innerHTML = `
    <div class="vh"><h2>Contacts Clients</h2>
      <div class="vhright">
        <input class="inp" placeholder="🔍 Rechercher..." oninput="renderClients(this.value)" style="width:190px"/>
        <button class="btn-primary" onclick="openModal('mo-cli')">+ Ajouter</button>
      </div>
    </div>
    <div class="crm-grid">
      ${items.map(c=>`
        <div class="crm-card crm-cli">
          <div class="crm-ch">
            <div class="crm-av crm-av-cli">${(c.prenom!=='–'?c.prenom[0]:c.societe[0]).toUpperCase()}</div>
            <div><div class="crm-name">${c.prenom!=='–'?c.prenom+' '+c.nom:c.societe}</div><div class="crm-co">${c.societe}</div></div>
          </div>
          ${c.email!=='–'?`<div class="crm-row">✉️ ${c.email}</div>`:''}
          ${c.tel!=='–'?`<div class="crm-row">📞 ${c.tel}</div>`:''}
          <div class="crm-row">📍 ${c.pays}</div>
          <div class="crm-ft">
            <span class="bs bs-${c.statut.toLowerCase().replace(/\s/g,'-')}">${c.statut}</span>
            <span class="bp bp-${c.priorite.toLowerCase()}">${c.priorite}</span>
          </div>
          ${c.notes?`<div class="crm-notes">${c.notes}</div>`:''}
        </div>`).join('')}
    </div>
    <div id="mo-cli" class="modal-overlay">
      <div class="modal modal-w">
        <div class="mh"><span>Nouveau client</span><button onclick="closeModal('mo-cli')">✕</button></div>
        <div class="mgrid">
          <div><label class="ml">Société *</label><input id="cl-soc" class="inp"/></div>
          <div><label class="ml">Statut</label><select id="cl-stat" class="inp"><option>Actif</option><option>En approche</option><option>À qualifier</option><option>Froid</option></select></div>
          <div><label class="ml">Prénom</label><input id="cl-pre" class="inp"/></div>
          <div><label class="ml">Nom</label><input id="cl-nom" class="inp"/></div>
          <div><label class="ml">Poste</label><input id="cl-pos" class="inp"/></div>
          <div><label class="ml">Email</label><input id="cl-email" class="inp"/></div>
          <div><label class="ml">Téléphone</label><input id="cl-tel" class="inp"/></div>
          <div><label class="ml">Pays / Ville</label><input id="cl-pays" class="inp"/></div>
          <div><label class="ml">Priorité</label><select id="cl-prio" class="inp"><option>Haute</option><option>Normale</option><option>Basse</option></select></div>
          <div style="grid-column:1/-1"><label class="ml">Notes</label><textarea id="cl-notes" class="inp" rows="3"></textarea></div>
        </div>
        <div class="mf"><button class="btn-sec" onclick="closeModal('mo-cli')">Annuler</button>
          <button class="btn-primary" onclick="saveClient()">Enregistrer</button></div>
      </div></div>`;
}
function saveClient() {
  const s = document.getElementById('cl-soc').value.trim();
  if (!s) return showToast('Société requise','err');
  CLI.push({id:'c'+Date.now(), societe:s, statut:document.getElementById('cl-stat').value, prenom:document.getElementById('cl-pre').value||'–', nom:document.getElementById('cl-nom').value||'–', poste:document.getElementById('cl-pos').value||'–', email:document.getElementById('cl-email').value||'–', tel:document.getElementById('cl-tel').value||'–', pays:document.getElementById('cl-pays').value||'–', priorite:document.getElementById('cl-prio').value, notes:document.getElementById('cl-notes').value});
  closeModal('mo-cli'); renderClients(); showToast('Client ajouté');
}

// ════════════════════════════════════════════════════════════
// FACTURATION
// ════════════════════════════════════════════════════════════
function renderInvoices(role, filter='all') {
  const el = document.getElementById('view-invoices'); if(!el) return;
  const active = INV.filter(i=>!i.archived);
  const visible = filter==='all' ? active : active.filter(i=>i.statut===filter);

  const totals = {cours:0, retard:0, paye:0};
  active.forEach(i=>{
    if(i.statut==='en cours')  totals.cours  += i.montant;
    if(i.statut==='en retard') totals.retard += i.montant;
    if(i.statut==='payée')     totals.paye   += i.montant;
  });

  // Top spending
  const spend = {};
  active.forEach(i=>{ spend[i.fournisseur] = (spend[i.fournisseur]||0)+i.montant; });
  const topSpend = Object.entries(spend).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const tabs = [['all','Toutes'],['en cours','En cours'],['en retard','En retard'],['payée','Payées']];

  el.innerHTML = `
    <div class="vh"><h2>Facturation</h2>
      <button class="btn-primary" onclick="openInvModal('${role}')">+ Nouvelle facture</button>
    </div>
    <div class="kpi-row">
      <div class="kpi"><div class="kpi-l">En cours</div><div class="kpi-v kpi-blue">${fmt(totals.cours)}</div></div>
      <div class="kpi"><div class="kpi-l">En retard</div><div class="kpi-v kpi-red">${fmt(totals.retard)}</div></div>
      <div class="kpi"><div class="kpi-l">Payé</div><div class="kpi-v kpi-green">${fmt(totals.paye)}</div></div>
    </div>
    <div class="inv-layout">
      <div class="inv-main">
        <div class="filter-tabs">${tabs.map(([k,l])=>`<button class="ftab${filter===k?' active':''}" onclick="renderInvoices('${role}','${k}')">${l}</button>`).join('')}</div>
        <table class="t-inv">
          <thead><tr><th>Réf</th><th>Fournisseur</th><th>Poste budgétaire</th><th>Montant</th><th>Date</th><th>Échéance</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            ${visible.length ? visible.map(i=>`
              <tr>
                <td class="t-ref">${i.ref}</td>
                <td>${i.fournisseur}</td>
                <td class="t-poste">${i.poste}</td>
                <td class="t-amt">${fmt(i.montant)}</td>
                <td>${fmtDate(i.date)}</td>
                <td class="${i.statut==='en retard'?'t-late':''}">${fmtDate(i.echeance)}</td>
                <td><span class="ibadge ib-${i.statut.replace(' ','-')}">${i.statut}</span></td>
                <td class="t-act">
                  ${i.statut!=='payée'?`<button class="bxs bxs-g" onclick="markPaid('${i.id}','${role}')">✓ Payée</button>`:''}
                  <button class="bxs bxs-sec" onclick="archiveInv('${i.id}','${role}')">Archiver</button>
                </td>
              </tr>`).join('') : `<tr><td colspan="8" class="empty">Aucune facture dans cette catégorie</td></tr>`}
          </tbody>
        </table>
      </div>
      <div class="inv-side card">
        <div class="card-label">💸 Top spending</div>
        ${topSpend.length ? topSpend.map(([name,total],i)=>`
          <div class="spend-row">
            <span class="spend-rank">#${i+1}</span>
            <span class="spend-name">${name}</span>
            <span class="spend-amt">${fmt(total)}</span>
          </div>`).join('') : '<div class="empty-sm">Aucune donnée</div>'}
      </div>
    </div>
    <div id="mo-inv" class="modal-overlay">
      <div class="modal modal-w">
        <div class="mh"><span id="mo-inv-title">Nouvelle facture</span><button onclick="closeModal('mo-inv')">✕</button></div>
        <div class="mgrid">
          <div><label class="ml">Référence</label><input id="in-ref" class="inp" placeholder="FAC-2025-XXX"/></div>
          <div><label class="ml">Statut</label><select id="in-stat" class="inp"><option value="en cours">En cours</option><option value="en retard">En retard</option><option value="payée">Payée</option></select></div>
          <div><label class="ml">Fournisseur (CRM)</label><select id="in-supp" class="inp" onchange="onSuppChange()"><option value="">-- Choisir --</option>${SUPP.map(s=>`<option value="${s.id}">${s.societe}</option>`).join('')}</select></div>
          <div><label class="ml">Ou saisir manuellement</label><input id="in-supp-txt" class="inp" placeholder="Nom fournisseur"/></div>
          <div><label class="ml">Poste budgétaire *</label><select id="in-poste" class="inp" onchange="onPosteChange()"><option value="">-- Choisir --</option>${BUDGET_POSTES.map(p=>`<option value="${p.id}" data-pid="${p.id}">[${p.tranche}] ${p.label}</option>`).join('')}</select></div>
          <div><label class="ml">Tranche (auto)</label><input id="in-tranche" class="inp" readonly placeholder="Auto"/></div>
          <div><label class="ml">Montant HT (€) *</label><input id="in-mnt" class="inp" type="number" min="0"/></div>
          <div><label class="ml">Date</label><input id="in-date" class="inp" type="date"/></div>
          <div><label class="ml">Échéance</label><input id="in-ech" class="inp" type="date"/></div>
          <div style="grid-column:1/-1"><label class="ml">Description</label><input id="in-desc" class="inp" placeholder="Objet de la facture"/></div>
        </div>
        <div class="mf"><button class="btn-sec" onclick="closeModal('mo-inv')">Annuler</button>
          <button class="btn-primary" onclick="saveInvoice('${role}')">Enregistrer</button></div>
      </div></div>`;
}
function openInvModal(role) {
  const last = INV.reduce((m,i)=>{const n=parseInt(i.ref.split('-').pop()||0);return n>m?n:m;},0);
  document.getElementById('in-ref').value = `FAC-${new Date().getFullYear()}-${String(last+1).padStart(3,'0')}`;
  document.getElementById('in-date').value = new Date().toISOString().split('T')[0];
  openModal('mo-inv');
}
function onSuppChange() {
  const sid = document.getElementById('in-supp').value;
  const s = SUPP.find(x=>x.id===sid);
  if (s) document.getElementById('in-supp-txt').value = s.societe;
}
function onPosteChange() {
  const sel = document.getElementById('in-poste');
  const opt = sel.options[sel.selectedIndex];
  const poste = BUDGET_POSTES.find(p=>p.id===sel.value);
  document.getElementById('in-tranche').value = poste ? poste.tranche : '';
}
function saveInvoice(role) {
  const pid = document.getElementById('in-poste').value;
  const mnt = parseFloat(document.getElementById('in-mnt').value);
  const sid = document.getElementById('in-supp').value;
  const suppTxt = document.getElementById('in-supp-txt').value.trim();
  const fournisseur = sid ? (SUPP.find(s=>s.id===sid)?.societe||suppTxt) : suppTxt;
  if (!pid) return showToast('Poste budgétaire requis','err');
  if (!fournisseur) return showToast('Fournisseur requis','err');
  if (!mnt || mnt<=0) return showToast('Montant requis','err');
  const poste = BUDGET_POSTES.find(p=>p.id===pid);
  INV.push({id:'inv'+Date.now(), ref:document.getElementById('in-ref').value, sid:sid||null, fournisseur, pid, poste:poste?.label||'–', montant:mnt, date:document.getElementById('in-date').value, echeance:document.getElementById('in-ech').value, statut:document.getElementById('in-stat').value, description:document.getElementById('in-desc').value, archived:false});
  closeModal('mo-inv'); renderInvoices(role); showToast('Facture enregistrée — budget mis à jour');
}
function markPaid(id, role) {
  const i = INV.find(x=>x.id===id); if(i) i.statut='payée';
  renderInvoices(role); showToast('Facture marquée payée');
}
function archiveInv(id, role) {
  const i = INV.find(x=>x.id===id); if(i) i.archived=true;
  renderInvoices(role); showToast('Facture archivée');
}

// ════════════════════════════════════════════════════════════
// BUDGET (founder only)
// ════════════════════════════════════════════════════════════
function renderBudget() {
  const el = document.getElementById('view-budget'); if(!el) return;
  const eng = budgetFromInvoices(INV);
  const totalBudget = BUDGET_POSTES.reduce((s,p)=>s+p.budget,0);
  const totalEngage = Object.values(eng).reduce((s,v)=>s+v.engage,0);
  const totalPaye   = Object.values(eng).reduce((s,v)=>s+v.paye,0);
  const grouped = {};
  BUDGET_POSTES.forEach(p=>{ (grouped[p.tranche]||(grouped[p.tranche]=[])).push(p); });

  el.innerHTML = `
    <div class="vh"><h2>Budget</h2>
      <span class="badge-info">Alimenté automatiquement par les factures</span>
    </div>
    <div class="kpi-row kpi4">
      <div class="kpi"><div class="kpi-l">Budget total</div><div class="kpi-v">${fmt(totalBudget)}</div></div>
      <div class="kpi"><div class="kpi-l">Engagé</div><div class="kpi-v kpi-orange">${fmt(totalEngage)}</div><div class="kpi-s">${fmtPct(totalEngage,totalBudget)}</div></div>
      <div class="kpi"><div class="kpi-l">Payé</div><div class="kpi-v kpi-red">${fmt(totalPaye)}</div><div class="kpi-s">${fmtPct(totalPaye,totalBudget)}</div></div>
      <div class="kpi"><div class="kpi-l">Disponible</div><div class="kpi-v kpi-green">${fmt(totalBudget-totalEngage)}</div></div>
    </div>
    ${Object.entries(grouped).map(([tr,postes])=>`
      <div class="card mb16">
        <div class="card-label">Tranche ${tr}
          <span style="font-weight:400;color:var(--text2);margin-left:12px;font-size:12px">
            Budget: ${fmt(postes.reduce((s,p)=>s+p.budget,0))} · Engagé: ${fmt(postes.reduce((s,p)=>s+(eng[p.id]?.engage||0),0))}
          </span>
        </div>
        <table class="t-bud">
          <thead><tr><th>Catégorie</th><th>Poste</th><th>Budget</th><th>Engagé</th><th>Payé</th><th>Dispo</th></tr></thead>
          <tbody>
            ${postes.map(p=>{
              const e = eng[p.id]||{engage:0,paye:0};
              const pct = p.budget>0 ? Math.min(100,Math.round(e.engage/p.budget*100)) : 0;
              const over = e.engage > p.budget;
              return `<tr class="${over?'row-over':''}">
                <td class="t-cat">${p.categorie}</td><td>${p.label}</td>
                <td>${fmt(p.budget)}</td>
                <td><div class="pbar-w"><div class="pbar-f ${pct>=100?'over':pct>=80?'warn':''}" style="width:${pct}%"></div></div>${fmt(e.engage)}</td>
                <td>${fmt(e.paye)}</td>
                <td class="${p.budget-e.engage<0?'neg':'pos'}">${fmt(p.budget-e.engage)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`).join('')}`;
}

// ════════════════════════════════════════════════════════════
// CALCULATEUR
// ════════════════════════════════════════════════════════════
function renderCalculator() {
  const el = document.getElementById('view-calculator'); if(!el) return;
  const dests = Object.keys(CALC_DESTINATIONS);
  el.innerHTML = `
    <div class="vh"><h2>Calculateur Helios</h2></div>
    <div class="calc-layout">
      <div class="calc-form card">
        <div class="calc-sec">Destination</div>
        <select id="calc-dest" class="inp" onchange="loadDest(this.value)">
          ${dests.map(d=>`<option value="${d}">${CALC_DESTINATIONS[d].label}</option>`).join('')}
          <option value="_custom">+ Nouvelle destination</option>
        </select>
        <div class="calc-sec mt16">Trafic & Saisonnalité</div>
        <div class="calc-row"><label>Visiteurs / jour</label><input id="cp-vis" class="inp calc-inp" type="number"/></div>
        <div class="calc-row"><label>Taux adoption (%)</label><input id="cp-ado" class="inp calc-inp" type="number" step="0.1"/></div>
        <div class="calc-row"><label>Jours / mois</label><input id="cp-jm" class="inp calc-inp" type="number"/></div>
        <div class="calc-row"><label>Haute saison (mois)</label><input id="cp-hs" class="inp calc-inp" type="number"/></div>
        <div class="calc-row"><label>Épaule (mois)</label><input id="cp-ep" class="inp calc-inp" type="number"/></div>
        <div class="calc-row"><label>Nb machines</label><input id="cp-nb" class="inp calc-inp" type="number"/></div>
        <div class="calc-sec mt16">Prix & Coûts</div>
        <div class="calc-row"><label>Prix brumisation (€)</label><input id="cp-pbr" class="inp calc-inp" type="number" step="0.01"/></div>
        <div class="calc-row"><label>Conso / passage (ml)</label><input id="cp-cml" class="inp calc-inp" type="number"/></div>
        <div class="calc-row"><label>Coût machine BKK (€)</label><input id="cp-cm" class="inp calc-inp" type="number"/></div>
        <div class="calc-row"><label>Coût refill 5L labo (€)</label><input id="cp-cr" class="inp calc-inp" type="number"/></div>
        <div class="calc-row"><label>Frais Nayax (%)</label><input id="cp-nx" class="inp calc-inp" type="number" step="0.1"/></div>
        <div class="calc-sec mt16">Modèle A</div>
        <div class="calc-row"><label>Abonnement / mois (€)</label><input id="cp-aA" class="inp calc-inp" type="number"/></div>
        <div class="calc-row"><label>Prix refill facturé (€)</label><input id="cp-rA" class="inp calc-inp" type="number"/></div>
        <div class="calc-row"><label>Refills offerts / mois</label><input id="cp-oA" class="inp calc-inp" type="number"/></div>
        <div class="calc-sec mt16">Modèle B</div>
        <div class="calc-row"><label>Abonnement sponsor (€)</label><input id="cp-aB" class="inp calc-inp" type="number"/></div>
        <div class="calc-row"><label>Prix refill établissement (€)</label><input id="cp-rB" class="inp calc-inp" type="number"/></div>
        <div class="calc-sec mt16">Modèle E</div>
        <div class="calc-row"><label>Prix vente machine (€)</label><input id="cp-pE" class="inp calc-inp" type="number"/></div>
        <div class="calc-row"><label>Prix vente refill (€)</label><input id="cp-rE" class="inp calc-inp" type="number"/></div>
        <div class="calc-row"><label>Maintenance annuelle (€)</label><input id="cp-mE" class="inp calc-inp" type="number"/></div>
        <div class="calc-row"><label>Commission (%)</label><input id="cp-cE" class="inp calc-inp" type="number" step="0.1"/></div>
        <div class="calc-sec mt16">Mix modèles (%)</div>
        <div class="calc-row"><label>% Modèle A</label><input id="cp-mxA" class="inp calc-inp" type="number"/></div>
        <div class="calc-row"><label>% Modèle B</label><input id="cp-mxB" class="inp calc-inp" type="number"/></div>
        <div class="calc-row"><label>% Modèle D</label><input id="cp-mxD" class="inp calc-inp" type="number"/></div>
        <div class="calc-row"><label>% Modèle E</label><input id="cp-mxE" class="inp calc-inp" type="number"/></div>
        <button class="btn-primary mt16 w100" onclick="runCalc()">⚡ Calculer</button>
      </div>
      <div id="calc-out"></div>
    </div>`;
  loadDest(dests[0]);
}
function loadDest(key) {
  if (!CALC_DESTINATIONS[key]) return;
  const p = CALC_DESTINATIONS[key].p;
  const m = {'cp-vis':p.visiteurs_jour,'cp-ado':p.taux_adoption,'cp-jm':p.jours_mois,'cp-hs':p.haute_saison,'cp-ep':p.epaule,'cp-nb':p.nb_machines,'cp-pbr':p.prix_brumisation,'cp-cml':p.conso_ml,'cp-cm':p.cout_machine,'cp-cr':p.cout_refill_5L,'cp-nx':p.nayax,'cp-aA':p.abo_A,'cp-rA':p.refill_A,'cp-oA':p.offerts_A,'cp-aB':p.abo_B,'cp-rB':p.refill_B,'cp-pE':p.prix_E,'cp-rE':p.refill_E,'cp-mE':p.maintenance_E,'cp-cE':p.commission_E,'cp-mxA':p.mix_A,'cp-mxB':p.mix_B,'cp-mxD':p.mix_D,'cp-mxE':p.mix_E};
  Object.entries(m).forEach(([id,v])=>{ const el=document.getElementById(id); if(el) el.value=v; });
  runCalc();
}
function runCalc() {
  const g = id => parseFloat(document.getElementById(id)?.value)||0;
  const p = {visiteurs_jour:g('cp-vis'),taux_adoption:g('cp-ado'),jours_mois:g('cp-jm'),haute_saison:g('cp-hs'),epaule:g('cp-ep'),nb_machines:g('cp-nb'),prix_brumisation:g('cp-pbr'),conso_ml:g('cp-cml'),cout_machine:g('cp-cm'),cout_refill_5L:g('cp-cr'),nayax:g('cp-nx'),abo_A:g('cp-aA'),refill_A:g('cp-rA'),offerts_A:g('cp-oA'),abo_B:g('cp-aB'),refill_B:g('cp-rB'),prix_E:g('cp-pE'),refill_E:g('cp-rE'),maintenance_E:g('cp-mE'),commission_E:g('cp-cE'),mix_A:g('cp-mxA'),mix_B:g('cp-mxB'),mix_D:g('cp-mxD'),mix_E:g('cp-mxE')};
  const r = calcHelios(p);
  const destKey = document.getElementById('calc-dest')?.value;
  const destLabel = CALC_DESTINATIONS[destKey]?.label || 'Custom';
  const mdesc = {A:"Abonnement mensuel + refills facturés − coût labo",B:"50/50 CA net + abonnement sponsor + refills labo − labo",D:"CA net après Nayax − coût labo (100% Solaire)",E:"Marge machine + maintenance + marge refills + commission"};
  document.getElementById('calc-out').innerHTML = `
    <div class="card">
      <div class="card-label">Résultats — ${destLabel}</div>
      <div class="kpi-row kpi4 mb16">
        <div class="kpi"><div class="kpi-l">Passages / an</div><div class="kpi-v">${r.passages_annuels.toLocaleString('fr-FR')}</div></div>
        <div class="kpi"><div class="kpi-l">Volume</div><div class="kpi-v">${r.vol_litres} L</div></div>
        <div class="kpi"><div class="kpi-l">CA net (après Nayax)</div><div class="kpi-v">${fmt(r.ca_net)}</div></div>
        <div class="kpi"><div class="kpi-l">Coût labo total</div><div class="kpi-v kpi-red">${fmt(r.cout_labo)}</div></div>
      </div>
      <div class="calc-models">
        ${['A','B','D','E'].map(m=>`
          <div class="cm ${r[m]<0?'cm-neg':'cm-pos'}">
            <div class="cm-top"><span class="cm-label">Modèle ${m}</span><span class="cm-val ${r[m]<0?'neg':'pos'}">${fmt(r[m])}</span></div>
            <div class="cm-desc">${mdesc[m]}</div>
            <div class="cm-sub">× ${p.nb_machines} machines : <strong>${fmt(r[m+'_total'])}</strong></div>
          </div>`).join('')}
      </div>
      <div class="calc-mix-result">
        <div>
          <div style="font-size:12px;color:var(--text2)">Profit mix (A:${p.mix_A}% B:${p.mix_B}% D:${p.mix_D}% E:${p.mix_E}%)</div>
          <div style="font-size:26px;font-weight:700;color:${r.mix_total>=0?'var(--green)':'var(--red)'}">${fmt(r.mix_total)}</div>
        </div>
        <div style="font-size:22px">${r.mix_total>=500000?'✅ Objectif 500K€ atteint':'⚠️ En dessous de 500K€'}</div>
      </div>
    </div>`;
}

// ════════════════════════════════════════════════════════════
// MESSAGERIE (stub)
// ════════════════════════════════════════════════════════════
function renderMessages() {
  const el = document.getElementById('view-messages'); if(!el) return;
  el.innerHTML = `<div class="vh"><h2>Messagerie</h2></div><div class="empty">Module messagerie — bientôt disponible (Microsoft 365)</div>`;
}
