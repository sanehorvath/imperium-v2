import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

// ── AUTH HELPERS ──────────────────────────────────────────────────────────────

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { ok: false, error: error.message }
  return { ok: true, user: data.user, session: data.session }
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function inviteUser(email, role, name) {
  // Invite via Supabase Auth — envoie un email automatique
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { role, name }
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, data }
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

// ── PROFILE HELPERS ───────────────────────────────────────────────────────────

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) return null
  return data
}

export async function updateProfile(userId, updates) {
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
  return !error
}

// ── DATA HELPERS ──────────────────────────────────────────────────────────────

export async function fetchAll() {
  const [
    { data: profiles },
    { data: models },
    { data: paliers },
    { data: invoices },
    { data: categories },
    { data: media },
    { data: formation },
    { data: accounts },
    { data: accountStats },
    { data: modelRevenue },
    { data: vaClicks },
    { data: tlAssignments },
    { data: vaWarns },
    { data: payroll },
    { data: modelDocs },
    { data: stories },
    { data: storyDays },
    { data: storyItems },
  ] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('models').select('*'),
    supabase.from('paliers').select('*'),
    supabase.from('invoices').select('*'),
    supabase.from('categories').select('*'),
    supabase.from('media').select('*'),
    supabase.from('formation').select('*'),
    supabase.from('accounts').select('*'),
    supabase.from('account_stats').select('*'),
    supabase.from('model_revenue').select('*'),
    supabase.from('va_clicks').select('*'),
    supabase.from('tl_assignments').select('*'),
    supabase.from('va_warns').select('*'),
    supabase.from('payroll').select('*'),
    supabase.from('model_docs').select('*'),
    supabase.from('stories').select('*'),
    supabase.from('story_days').select('*'),
    supabase.from('story_items').select('*'),
    supabase.from('candidatures').select('*'),
  ])

  return {
    profiles: profiles || [],
    models: models || [],
    paliers: paliers || [],
    invoices: invoices || [],
    categories: categories || [],
    media: media || [],
    formation: formation || [],
    accounts: accounts || [],
    accountStats: accountStats || [],
    modelRevenue: modelRevenue || [],
    vaClicks: vaClicks || [],
    tlAssignments: tlAssignments || [],
    vaWarns: vaWarns || [],
    payroll: payroll || [],
    modelDocs: modelDocs || [],
    stories: stories || [],
    storyDays: storyDays || [],
    storyItems: storyItems || [],
  }
}

// ── PAIE VA CALCULATOR ────────────────────────────────────────────────────────

export function calculateVAPay(va, paliers, vaClicksThisMonth) {
  const totalClics = vaClicksThisMonth
    .filter(c => c.va_id === va.id)
    .reduce((a, c) => a + (c.clics || 0), 0)

  if (va.pay_type === 'pct') {
    // % du CA — calculé ailleurs depuis les modèles assignés
    return { type: 'pct', clics: totalClics, pct: va.pay_pct }
  }

  // Palier A ou B
  const systeme = va.pay_type === 'palier_a' ? 'A' : 'B'
  const matching = paliers
    .filter(p => p.systeme === systeme)
    .find(p => totalClics >= p.clics_min && totalClics <= p.clics_max)

  if (!matching) return { type: 'palier', clics: totalClics, montant: 0, palier: null }

  // Bonus après le dernier palier
  let montant = matching.taux
  if (systeme === 'A' && totalClics > 27000) {
    montant += Math.floor((totalClics - 27000) / 1200) * 100
  } else if (systeme === 'B' && totalClics > 30000) {
    montant += Math.floor((totalClics - 30000) / 1500) * 100
  }

  return { type: 'palier', clics: totalClics, montant, palier: matching }
}

// ── MARGE MODÈLE CALCULATOR ───────────────────────────────────────────────────

export function calculateModelMarge(model, latestRevenue, vaList, paliers, vaClicksThisMonth) {
  if (!latestRevenue) return null

  const caBrut = latestRevenue.ca || 0
  // Split modèle : % ou fixe
  let caAgence = 0
  if (model.split_type === 'fixe') {
    caAgence = caBrut - (model.split_modele || 0)
  } else {
    const splitPct = model.split_modele || 40
    caAgence = caBrut * (1 - splitPct / 100)
  }

  // Chatting : toujours % du CA brut
  const coutChatting = caBrut * (model.cout_chatting_valeur || 22) / 100

  // VAs assignés à ce modèle
  const assignedVAs = vaList.filter(v =>
    Array.isArray(v.model_ids) && v.model_ids.includes(model.id)
  )

  let coutVA = 0
  assignedVAs.forEach(va => {
    const pay = calculateVAPay(va, paliers, vaClicksThisMonth)
    if (pay.type === 'pct') {
      coutVA += caAgence * (pay.pct / 100)
    } else {
      coutVA += pay.montant || 0
    }
  })

  const net = caAgence - coutChatting - coutVA
  const marge = caBrut > 0 ? Math.round((net / caBrut) * 100) : 0

  return { caBrut, splitPct, caAgence, coutChatting, coutVA, net, marge }
}
