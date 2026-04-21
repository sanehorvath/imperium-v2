// ============================================================
// SOLAIRE — Module Recrutement (pipeline candidats)
// ============================================================

const ETAPES = [
  { id:'lead',       label:'Lead capturé',      icon:'📥', color:'var(--blue)',   alert_h:48  },
  { id:'prequalif',  label:'Pré-qualification',  icon:'🔍', color:'var(--purple)', alert_h:120 },
  { id:'call_plan',  label:'Call planifié',       icon:'📅', color:'var(--orange)', alert_h:120 },
  { id:'discovery',  label:'Discovery call',     icon:'🎯', color:'var(--gold,#f59e0b)', alert_h:72  },
  { id:'onboarding', label:'Onboarding',         icon:'🚀', color:'var(--green)',  alert_h:null},
];

const ETAPE_IDS = ETAPES.map(e=>e.id);

// ── Demo data ─────────────────────────────────────────────
let REC_CANDIDATES = [
  { id:'r1', nom:'Marco Santini',     whatsapp:'+39 333 444 5555', email:'marco@example.com', source:'LinkedIn Jobs',  zones:['Phuket','Bali'],    reseau:'10-15', disponibilite:'Temps plein', commission:'Oui',       message:'7 ans dans l\'hôtellerie de luxe en Asie du Sud-Est.', etape:'lead',      statut:'actif',  file_url:null, file_name:null, created_at:new Date(Date.now()-50*3600000).toISOString(), notes_internes:[], score:null, criteres:{zone:null,reseau:null,commission:null,dispo:null,background:null}, call_date:null, call_canal:null, call_notes:'', decision:null, contacts_cites:[] },
  { id:'r2', nom:'Sophie Laurent',    whatsapp:'+33 6 12 34 56 78', email:'sophie@example.com', source:'Recommandation', zones:['Samui'],            reseau:'5-10',  disponibilite:'20-30h',     commission:'A discuter', message:'Directrice commerciale hôtel 5* à Samui depuis 3 ans.',  etape:'prequalif', statut:'actif',  file_url:null, file_name:null, created_at:new Date(Date.now()-72*3600000).toISOString(), notes_internes:[{text:'Très bon profil, réseau solide',date:new Date().toISOString(),author:'Sane'}], score:null, criteres:{zone:true,reseau:true,commission:true,dispo:true,background:true}, call_date:null, call_canal:null, call_notes:'', decision:null, contacts_cites:[] },
  { id:'r3', nom:'James Thornton',    whatsapp:'+44 7890 123456',  email:'james@example.com', source:'Meta Ads',       zones:['Phuket'],           reseau:'15+',   disponibilite:'Temps plein', commission:'Oui',       message:'Ex-GM Marriott Phuket. Réseau de 20+ établissements.',  etape:'call_plan', statut:'actif',  file_url:null, file_name:null, created_at:new Date(Date.now()-30*3600000).toISOString(), notes_internes:[], score:null, criteres:{zone:true,reseau:true,commission:true,dispo:true,background:true}, call_date:new Date(Date.now()+24*3600000).toISOString().split('T')[0], call_canal:'Zoom', call_notes:'', decision:null, contacts_cites:[] },
  { id:'r4', nom:'Aisha Okonkwo',     whatsapp:'+234 812 345 6789',email:'aisha@example.com', source:'Chasse directe', zones:['Bali','Pattaya'],   reseau:'5-10',  disponibilite:'10-20h',     commission:'Oui',       message:'Consultante hospitality. Bali et Pattaya principalement.', etape:'discovery', statut:'actif',  file_url:null, file_name:null, created_at:new Date(Date.now()-24*3600000).toISOString(), notes_internes:[{text:'Call réalisé le 18/04. Très motivée.',date:new Date().toISOString(),author:'Hugo'}], score:15, criteres:{zone:true,reseau:true,commission:true,dispo:false,background:true}, call_date:new Date(Date.now()-24*3600000).toISOString().split('T')[0], call_canal:'WhatsApp video', call_notes:'Excellent réseau Bali. Dispo limitée mais compensée par qualité réseau.', decision:'go', contacts_cites:['Alaya Resort','Katamama','W Bali','Como Uma','Potato Head'] },
  { id:'r5', nom:'Remi Beaumont',     whatsapp:'+66 91 234 5678',  email:'remi@example.com',  source:'Post organique', zones:['Phuket','Samui'],   reseau:'1-5',   disponibilite:'Flexible',   commission:'Non',       message:'Freelance dans l\'événementiel. Cherche opportunité.',   etape:'lead',      statut:'no_go',  file_url:null, file_name:null, created_at:new Date(Date.now()-96*3600000).toISOString(), notes_internes:[{text:'Commission refusée — éliminé',date:new Date().toISOString(),author:'Sane'}], score:null, criteres:{zone:true,reseau:false,commission:false,dispo:true,background:false}, call_date:null, call_canal:null, call_notes:'', decision:'no_go', contacts_cites:[] },
];

// ── State ─────────────────────────────────────────────────
let REC_FILTER_ETAPE = 'all';
let REC_FILTER_ZONE  = 'all';
let REC_SEARCH       = '';
let REC_DETAIL_ID    = null;

// ── Supabase (optionnel) ──────────────────────────────────
const REC_SUPABASE_URL = typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : null;
const REC_SUPABASE_KEY = typeof SUPABASE_KEY !== 'undefined' ? SUPABASE_KEY : null;
let recSupa = null;
try {
  if (REC_SUPABASE_URL && REC_SUPABASE_URL !== 'VOTRE_SUPABASE_URL' && window.supabase) {
    recSupa = window.supabase.createClient(REC_SUPABASE_URL, REC_SUPABASE_KEY);
    loadCandidatesFromSupabase();
  }
} catch(e) {}

async function loadCandidatesFromSupabase() {
  if (!recSupa) return;
  const { data, error } = await recSupa.from('candidates').select('*').order('created_at',{ascending:false});
  if (!error && data && data.length) {
    REC_CANDIDATES = data.map(normCandidate);
    renderRecruitment();
  }
}
function normCandidate(d) {
  return {
    id: d.id, nom: d.nom, whatsapp: d.whatsapp, email: d.email,
    source: d.source, zones: d.zones||[], reseau: d.reseau,
    disponibilite: d.disponibilite, commission: d.commission,
    message: d.message, etape: d.etape||'lead', statut: d.statut||'actif',
    file_url: d.file_url, file_name: d.file_name,
    created_at: d.created_at, notes_internes: d.notes_internes||[],
    score: d.score, criteres: d.criteres||{zone:null,reseau:null,commission:null,dispo:null,background:null},
    call_date: d.call_date, call_canal: d.call_canal,
    call_notes: d.call_notes||'', decision: d.decision,
    contacts_cites: d.contacts_cites||[],
  };
}
async function saveCandidate(c) {
  if (!recSupa) return;
  const { error } = await recSupa.from('candidates').upsert([c]);
  if (error) console.warn('Save error:', error);
}

// ── Utils ─────────────────────────────────────────────────
function hoursAgo(iso) {
  if (!iso) return 0;
  return Math.round((Date.now() - new Date(iso).getTime()) / 3600000);
}
function isBlocked(c) {
  const etape = ETAPES.find(e=>e.id===c.etape);
  if (!etape || !etape.alert_h) return false;
  return hoursAgo(c.created_at) > etape.alert_h && c.statut === 'actif';
}
function fmtAgo(iso) {
  const h = hoursAgo(iso);
  if (h < 1) return 'À l\'instant';
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h/24)}j`;
}
function fmtRecDate(iso) {
  if (!iso) return '–';
  return new Date(iso).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'});
}

// ── Main render ───────────────────────────────────────────
function renderRecruitment() {
  const el = document.getElementById('view-recrutement'); if(!el) return;

  // KPIs
  const active = REC_CANDIDATES.filter(c=>c.statut==='actif');
  const kpis = {
    total: active.length,
    blocked: REC_CANDIDATES.filter(c=>isBlocked(c)).length,
    byEtape: {},
    bySource: {},
    byZone: {},
  };
  ETAPE_IDS.forEach(e => { kpis.byEtape[e] = active.filter(c=>c.etape===e).length; });
  active.forEach(c => {
    kpis.bySource[c.source] = (kpis.bySource[c.source]||0)+1;
    (c.zones||[]).forEach(z => { kpis.byZone[z] = (kpis.byZone[z]||0)+1; });
  });

  // Filtered list
  let items = [...REC_CANDIDATES];
  if (REC_FILTER_ETAPE !== 'all') items = items.filter(c=>c.etape===REC_FILTER_ETAPE);
  if (REC_FILTER_ZONE  !== 'all') items = items.filter(c=>(c.zones||[]).includes(REC_FILTER_ZONE));
  if (REC_SEARCH) {
    const s = REC_SEARCH.toLowerCase();
    items = items.filter(c=>c.nom.toLowerCase().includes(s)||c.email.toLowerCase().includes(s));
  }

  el.innerHTML = `
    <div class="vh">
      <h2>Recrutement</h2>
      <div class="vhright">
        <span class="badge-info">${kpis.blocked > 0 ? `⚠️ ${kpis.blocked} candidat${kpis.blocked>1?'s':''} bloqué${kpis.blocked>1?'s':''}` : '✅ Aucun blocage'}</span>
      </div>
    </div>

    <!-- KPI row -->
    <div class="kpi-row kpi4 mb16">
      <div class="kpi"><div class="kpi-l">Candidats actifs</div><div class="kpi-v kpi-blue">${kpis.total}</div></div>
      <div class="kpi"><div class="kpi-l">En lead</div><div class="kpi-v">${kpis.byEtape['lead']||0}</div></div>
      <div class="kpi"><div class="kpi-l">En qualification</div><div class="kpi-v">${(kpis.byEtape['prequalif']||0)+(kpis.byEtape['call_plan']||0)+(kpis.byEtape['discovery']||0)}</div></div>
      <div class="kpi"><div class="kpi-l">En onboarding</div><div class="kpi-v kpi-green">${kpis.byEtape['onboarding']||0}</div></div>
    </div>

    <!-- Pipeline funnel -->
    <div class="card mb16">
      <div class="card-label">Pipeline</div>
      <div class="rec-funnel">
        ${ETAPES.map(e=>{
          const n = active.filter(c=>c.etape===e.id).length;
          const total = active.length || 1;
          const pct = Math.round(n/total*100);
          return `
            <div class="funnel-step ${REC_FILTER_ETAPE===e.id?'active':''}" onclick="recSetFilter('etape','${e.id}')">
              <div class="funnel-icon">${e.icon}</div>
              <div class="funnel-label">${e.label}</div>
              <div class="funnel-count" style="color:${e.color}">${n}</div>
              <div class="funnel-bar-w"><div class="funnel-bar-f" style="width:${pct}%;background:${e.color}"></div></div>
            </div>`;
        }).join('<div class="funnel-arrow">›</div>')}
      </div>
    </div>

    <!-- Filters -->
    <div class="rec-filters mb16">
      <input class="inp" placeholder="🔍 Nom, email..." oninput="recSearch(this.value)" style="width:200px" value="${REC_SEARCH}"/>
      <select class="inp" onchange="recSetFilter('etape',this.value)" style="width:160px">
        <option value="all" ${REC_FILTER_ETAPE==='all'?'selected':''}>Toutes les étapes</option>
        ${ETAPES.map(e=>`<option value="${e.id}" ${REC_FILTER_ETAPE===e.id?'selected':''}>${e.label}</option>`).join('')}
      </select>
      <select class="inp" onchange="recSetFilter('zone',this.value)" style="width:130px">
        <option value="all">Toutes zones</option>
        <option value="Phuket">Phuket</option>
        <option value="Samui">Samui</option>
        <option value="Pattaya">Pattaya</option>
        <option value="Bali">Bali</option>
      </select>
      ${REC_FILTER_ETAPE!=='all'||REC_FILTER_ZONE!=='all'||REC_SEARCH?
        `<button class="btn-sec" onclick="recClearFilters()" style="white-space:nowrap">✕ Effacer</button>`:''}
    </div>

    <!-- Candidates table -->
    <div class="card" style="padding:0">
      <table class="t-rec">
        <thead>
          <tr>
            <th>Candidat</th>
            <th>Source</th>
            <th>Zones</th>
            <th>Étape</th>
            <th>Reçu</th>
            <th>Statut</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${items.length ? items.map(c=>{
            const etape = ETAPES.find(e=>e.id===c.etape);
            const blocked = isBlocked(c);
            const zones = (c.zones||[]).join(', ');
            const statut_label = c.statut==='actif'?'Actif':c.statut==='no_go'?'No-go':'Onboarding';
            return `
              <tr class="${blocked?'row-alert':''}" onclick="openCandidateDetail('${c.id}')" style="cursor:pointer">
                <td>
                  <div class="rec-name">${c.nom}${blocked?` <span class="alert-dot" title="Bloqué depuis plus de ${etape?.alert_h}h">⚠️</span>`:''}</div>
                  <div class="rec-sub">${c.whatsapp}</div>
                </td>
                <td class="rec-source">${c.source||'–'}</td>
                <td><div class="rec-zones">${zones||'–'}</div></td>
                <td>
                  <span class="etape-badge" style="background:${etape?.color}20;color:${etape?.color}">
                    ${etape?.icon||''} ${etape?.label||c.etape}
                  </span>
                </td>
                <td class="rec-ago">${fmtAgo(c.created_at)}</td>
                <td>
                  <span class="bs bs-${c.statut==='actif'?'actif':c.statut==='no_go'?'à-contacter':'actif'}">
                    ${statut_label}
                  </span>
                </td>
                <td onclick="event.stopPropagation()">
                  <button class="bxs bxs-g" onclick="openCandidateDetail('${c.id}')">Voir →</button>
                </td>
              </tr>`;
          }).join('') : `<tr><td colspan="7" class="empty">Aucun candidat trouvé</td></tr>`}
        </tbody>
      </table>
    </div>

    <!-- DETAIL MODAL -->
    <div id="mo-candidate" class="modal-overlay ${REC_DETAIL_ID?'active':''}">
      <div class="modal modal-rec" onclick="event.stopPropagation()">
        <div id="mo-candidate-content"></div>
      </div>
    </div>
  `;

  // Reopen detail if was open
  if (REC_DETAIL_ID) openCandidateDetail(REC_DETAIL_ID);

  // Close on backdrop
  document.getElementById('mo-candidate')?.addEventListener('click', () => {
    REC_DETAIL_ID = null;
    document.getElementById('mo-candidate')?.classList.remove('active');
  });
}

function recSearch(v) { REC_SEARCH = v; renderRecruitment(); }
function recSetFilter(type, val) {
  if (type==='etape') REC_FILTER_ETAPE = val;
  if (type==='zone')  REC_FILTER_ZONE  = val;
  renderRecruitment();
}
function recClearFilters() { REC_FILTER_ETAPE='all'; REC_FILTER_ZONE='all'; REC_SEARCH=''; renderRecruitment(); }

// ── Candidate detail modal ────────────────────────────────
function openCandidateDetail(id) {
  REC_DETAIL_ID = id;
  const c = REC_CANDIDATES.find(x=>x.id===id); if(!c) return;
  const etape = ETAPES.find(e=>e.id===c.etape);
  const blocked = isBlocked(c);

  const content = document.getElementById('mo-candidate-content');
  if (!content) return;
  document.getElementById('mo-candidate')?.classList.add('active');

  const criteresItems = [
    { key:'zone',       label:'Zone match' },
    { key:'reseau',     label:'Réseau ≥ 1 établissement' },
    { key:'commission', label:'Accepte commission' },
    { key:'dispo',      label:'Disponibilité ≥ 10h/sem' },
    { key:'background', label:'Background pertinent' },
  ];

  content.innerHTML = `
    <div class="mh" style="position:sticky;top:0;background:var(--bg2);z-index:5">
      <div>
        <div style="font-size:17px;font-weight:700">${c.nom}</div>
        <div style="font-size:12px;color:var(--text2);margin-top:2px">${c.email} · ${c.whatsapp}</div>
      </div>
      <button onclick="closeCandidateDetail()">✕</button>
    </div>

    <div style="padding:20px;display:flex;flex-direction:column;gap:20px">

      <!-- Status row -->
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        ${blocked?`<div style="background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.2);color:var(--red);padding:6px 12px;border-radius:6px;font-size:12px">⚠️ Bloqué depuis ${hoursAgo(c.created_at)}h (seuil : ${etape?.alert_h}h)</div>`:''}
        <span class="etape-badge" style="background:${etape?.color}20;color:${etape?.color}">${etape?.icon} ${etape?.label}</span>
        <span class="bs bs-${c.statut==='actif'?'actif':'à-contacter'}">${c.statut==='actif'?'Actif':c.statut==='no_go'?'No-go':'Onboarding'}</span>
        ${c.score !== null ? `<span style="background:rgba(245,158,11,.15);color:var(--acc);padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700">Score : ${c.score}/20</span>` : ''}
      </div>

      <!-- Basic info -->
      <div class="card" style="padding:16px">
        <div class="card-label">Informations</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
          <div><span style="color:var(--text2)">Source : </span>${c.source||'–'}</div>
          <div><span style="color:var(--text2)">Zones : </span>${(c.zones||[]).join(', ')||'–'}</div>
          <div><span style="color:var(--text2)">Réseau : </span>${c.reseau||'–'}</div>
          <div><span style="color:var(--text2)">Dispo : </span>${c.disponibilite||'–'}</div>
          <div><span style="color:var(--text2)">Commission : </span>${c.commission||'–'}</div>
          <div><span style="color:var(--text2)">Reçu : </span>${fmtRecDate(c.created_at)}</div>
        </div>
        ${c.message?`<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--bord);font-size:13px;color:var(--text2);line-height:1.6">"${c.message}"</div>`:''}
      </div>

      <!-- CV -->
      ${c.file_url||c.file_name?`
        <div class="card" style="padding:14px 16px">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:20px">📎</span>
            <div style="flex:1;overflow:hidden">
              <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.file_name||'Pièce jointe'}</div>
            </div>
            ${c.file_url?`<a href="${c.file_url}" target="_blank" rel="noopener" class="bxs bxs-g" style="text-decoration:none;flex-shrink:0">Télécharger ↗</a>`:'<span style="font-size:12px;color:var(--text3)">URL non disponible</span>'}
          </div>
        </div>`:''}

      <!-- Avancer dans le pipeline -->
      <div class="card" style="padding:16px">
        <div class="card-label">Avancer dans le pipeline</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
          ${ETAPES.map(e=>`
            <button onclick="moveCandidate('${c.id}','${e.id}')"
              style="padding:7px 12px;border-radius:6px;border:1px solid ${c.etape===e.id?e.color:'var(--bord)'};background:${c.etape===e.id?e.color+'20':'var(--bg3)'};color:${c.etape===e.id?e.color:'var(--text2)'};font-size:12px;cursor:pointer;font-family:inherit;transition:all .15s">
              ${e.icon} ${e.label}
            </button>`).join('')}
        </div>
        ${c.etape==='lead'||c.etape==='prequalif'?`
          <div class="card-label" style="margin-top:12px">Critères pré-qualification</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${criteresItems.map(cr=>`
              <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--bg3);border-radius:6px;font-size:13px">
                <span>${cr.label}</span>
                <div style="display:flex;gap:5px">
                  <button onclick="setCritere('${c.id}','${cr.key}',true)" style="padding:3px 10px;border-radius:4px;border:none;background:${c.criteres[cr.key]===true?'var(--green)':'var(--bg2)'};color:${c.criteres[cr.key]===true?'#fff':'var(--text2)'};font-size:11px;cursor:pointer;font-family:inherit">✓ Oui</button>
                  <button onclick="setCritere('${c.id}','${cr.key}',false)" style="padding:3px 10px;border-radius:4px;border:none;background:${c.criteres[cr.key]===false?'var(--red)':'var(--bg2)'};color:${c.criteres[cr.key]===false?'#fff':'var(--text2)'};font-size:11px;cursor:pointer;font-family:inherit">✗ Non</button>
                </div>
              </div>`).join('')}
          </div>`:''}
      </div>

      <!-- Call / RDV -->
      ${c.etape==='call_plan'||c.etape==='discovery'?`
        <div class="card" style="padding:16px">
          <div class="card-label">Call / RDV</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
            <div>
              <label class="ml">Date call</label>
              <input type="date" class="inp" value="${c.call_date||''}" onchange="updateCallField('${c.id}','call_date',this.value)"/>
            </div>
            <div>
              <label class="ml">Canal</label>
              <select class="inp" onchange="updateCallField('${c.id}','call_canal',this.value)">
                <option value="">–</option>
                <option value="Zoom" ${c.call_canal==='Zoom'?'selected':''}>Zoom</option>
                <option value="WhatsApp video" ${c.call_canal==='WhatsApp video'?'selected':''}>WhatsApp vidéo</option>
                <option value="Téléphone" ${c.call_canal==='Téléphone'?'selected':''}>Téléphone</option>
                <option value="RDV physique" ${c.call_canal==='RDV physique'?'selected':''}>RDV physique</option>
              </select>
            </div>
          </div>
          ${c.etape==='discovery'?`
            <div style="margin-bottom:10px">
              <label class="ml">Notes du call</label>
              <textarea class="inp" rows="3" onblur="updateCallField('${c.id}','call_notes',this.value)" placeholder="Observations, points clés...">${c.call_notes||''}</textarea>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
              <div>
                <label class="ml">Score /20</label>
                <input type="number" class="inp" min="0" max="20" value="${c.score||''}" onblur="updateCallField('${c.id}','score',parseFloat(this.value)||null)" placeholder="Ex: 15"/>
              </div>
              <div>
                <label class="ml">Décision</label>
                <select class="inp" onchange="setDecision('${c.id}',this.value)">
                  <option value="">– En attente –</option>
                  <option value="go" ${c.decision==='go'?'selected':''}>✅ Go → Onboarding</option>
                  <option value="no_go" ${c.decision==='no_go'?'selected':''}>❌ No-go</option>
                  <option value="call2" ${c.decision==='call2'?'selected':''}>🔄 Second call</option>
                </select>
              </div>
            </div>
            <div>
              <label class="ml">5 contacts cités (un par ligne)</label>
              <textarea class="inp" rows="4" onblur="updateContacts('${c.id}',this.value)" placeholder="Nom établissement 1&#10;Nom établissement 2...">${(c.contacts_cites||[]).join('\n')}</textarea>
            </div>`:''}
        </div>`:''}

      <!-- Notes internes -->
      <div class="card" style="padding:16px">
        <div class="card-label">Notes internes</div>
        ${(c.notes_internes||[]).length ? c.notes_internes.map(n=>`
          <div style="background:var(--bg3);border-radius:6px;padding:10px 12px;margin-bottom:8px;font-size:13px">
            <div style="font-weight:500;margin-bottom:3px">${n.text}</div>
            <div style="font-size:11px;color:var(--text3)">${n.author} · ${fmtRecDate(n.date)}</div>
          </div>`).join('') : '<div style="color:var(--text3);font-size:13px;margin-bottom:12px">Aucune note</div>'}
        <div style="display:flex;gap:8px;margin-top:8px">
          <input id="note-input-${c.id}" class="inp" placeholder="Ajouter une note interne..." style="flex:1"/>
          <button class="btn-primary" onclick="addNote('${c.id}')">Ajouter</button>
        </div>
      </div>

      <!-- No-go button -->
      ${c.statut!=='no_go'?`
        <button onclick="setNoGo('${c.id}')" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);color:var(--red);border-radius:6px;padding:10px;font-size:13px;cursor:pointer;font-family:inherit;transition:all .15s;width:100%">
          ❌ Marquer No-go — sortir du pipeline
        </button>`:''}

    </div>
  `;
}

function closeCandidateDetail() {
  REC_DETAIL_ID = null;
  document.getElementById('mo-candidate')?.classList.remove('active');
}

// ── Pipeline actions ──────────────────────────────────────
function moveCandidate(id, etape) {
  const c = REC_CANDIDATES.find(x=>x.id===id); if(!c) return;
  c.etape = etape;
  if (etape === 'onboarding') c.statut = 'onboarding';
  saveCandidate(c);
  openCandidateDetail(id);
  renderRecruitment();
  showToast('Candidat déplacé → '+ETAPES.find(e=>e.id===etape)?.label);
}

function setCritere(id, key, val) {
  const c = REC_CANDIDATES.find(x=>x.id===id); if(!c) return;
  if (!c.criteres) c.criteres = {};
  c.criteres[key] = val;
  saveCandidate(c);
  openCandidateDetail(id);
}

function updateCallField(id, field, val) {
  const c = REC_CANDIDATES.find(x=>x.id===id); if(!c) return;
  c[field] = val;
  saveCandidate(c);
}

function updateContacts(id, text) {
  const c = REC_CANDIDATES.find(x=>x.id===id); if(!c) return;
  c.contacts_cites = text.split('\n').map(s=>s.trim()).filter(Boolean);
  saveCandidate(c);
}

function setDecision(id, val) {
  const c = REC_CANDIDATES.find(x=>x.id===id); if(!c) return;
  c.decision = val || null;
  if (val === 'go') { c.etape = 'onboarding'; c.statut = 'actif'; }
  if (val === 'no_go') { c.statut = 'no_go'; }
  saveCandidate(c);
  openCandidateDetail(id);
  renderRecruitment();
  if (val) showToast(val==='go'?'✅ Go — déplacé en Onboarding':val==='no_go'?'❌ No-go enregistré':'🔄 Second call planifié');
}

function setNoGo(id) {
  const c = REC_CANDIDATES.find(x=>x.id===id); if(!c) return;
  if (!confirm(`Confirmer le No-go pour ${c.nom} ?`)) return;
  c.statut = 'no_go';
  c.decision = 'no_go';
  saveCandidate(c);
  closeCandidateDetail();
  renderRecruitment();
  showToast('Candidat sorti du pipeline');
}

function addNote(id) {
  const c = REC_CANDIDATES.find(x=>x.id===id); if(!c) return;
  const el = document.getElementById('note-input-'+id);
  const text = el?.value.trim();
  if (!text) return showToast('Saisissez une note','warn');
  if (!c.notes_internes) c.notes_internes = [];
  const u = getCurrentUser();
  c.notes_internes.push({ text, date: new Date().toISOString(), author: u?.name||'Équipe' });
  saveCandidate(c);
  openCandidateDetail(id);
  showToast('Note ajoutée');
}
