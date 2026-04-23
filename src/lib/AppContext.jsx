import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, getProfile } from './supabase'

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

async function safeFetch(table) {
  try {
    const { data, error } = await supabase.from(table).select('*')
    if (error) { console.warn(`[IMPERIUM] ${table}:`, error.message); return [] }
    return data || []
  } catch(e) {
    console.warn(`[IMPERIUM] ${table} failed:`, e.message)
    return []
  }
}

async function fetchAll() {
  const [
    profiles, models, paliers, invoices, categories, media, formation,
    accounts, accountStats, modelRevenue, vaClicks, tlAssignments,
    vaWarns, payroll, modelDocs, stories, storyDays, storyItems
  ] = await Promise.all([
    safeFetch('profiles'), safeFetch('models'), safeFetch('paliers'),
    safeFetch('invoices'), safeFetch('categories'), safeFetch('media'),
    safeFetch('formation'), safeFetch('accounts'), safeFetch('account_stats'),
    safeFetch('model_revenue'), safeFetch('va_clicks'), safeFetch('tl_assignments'),
    safeFetch('va_warns'), safeFetch('payroll'), safeFetch('model_docs'),
    safeFetch('stories'), safeFetch('story_days'), safeFetch('story_items'),
  ])
  return {
    profiles, models, paliers, invoices, categories, media, formation,
    accounts, accountStats, modelRevenue, vaClicks, tlAssignments,
    vaWarns, payroll, modelDocs, stories, storyDays, storyItems,
  }
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const loadData = useCallback(async () => {
    setSyncing(true)
    try {
      const all = await fetchAll()
      setData(all)
    } catch(e) {
      console.warn('[IMPERIUM] Load failed:', e.message)
    } finally {
      setSyncing(false)
    }
  }, [])

  const initSession = useCallback(async (sessionUser) => {
    if (!sessionUser) { setLoading(false); return }
    setUser(sessionUser)
    const p = await getProfile(sessionUser.id)
    setProfile(p)
    await loadData()
    setLoading(false)
  }, [loadData])

  useEffect(() => {
    // 1. Charge la session existante immédiatement au mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        initSession(session.user)
      } else {
        setLoading(false)
      }
    })

    // 2. Écoute les changements (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Seulement si pas déjà initialisé
        setUser(prev => {
          if (!prev) initSession(session.user)
          return prev || session.user
        })
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setData(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [initSession])

  const upsert = useCallback(async (table, record, localKey) => {
    const { data: updated, error } = await supabase.from(table).upsert(record).select().single()
    if (error) { console.warn('[IMPERIUM] upsert error:', error.message); return false }
    if (localKey && updated) {
      setData(prev => ({
        ...prev,
        [localKey]: prev[localKey]?.some(r => r.id === record.id)
          ? prev[localKey].map(r => r.id === record.id ? updated : r)
          : [...(prev[localKey] || []), updated]
      }))
    }
    return true
  }, [])

  const insert = useCallback(async (table, record, localKey) => {
    const { data: inserted, error } = await supabase.from(table).insert(record).select().single()
    if (error) { console.warn('[IMPERIUM] insert error:', error.message); return null }
    if (localKey && inserted) {
      setData(prev => ({ ...prev, [localKey]: [...(prev[localKey] || []), inserted] }))
    }
    return inserted
  }, [])

  const remove = useCallback(async (table, id, localKey) => {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) { console.warn('[IMPERIUM] delete error:', error.message); return false }
    if (localKey) {
      setData(prev => ({ ...prev, [localKey]: prev[localKey].filter(r => r.id !== id) }))
    }
    return true
  }, [])

  return (
    <AppContext.Provider value={{
      user, profile, data, loading, syncing,
      loadData, upsert, insert, remove,
      isAdmin: profile?.role === 'owner' || profile?.role === 'admin',
      isOwner: profile?.role === 'owner',
      isTL: profile?.role === 'tl',
      isVA: profile?.role === 'va',
    }}>
      {children}
    </AppContext.Provider>
  )
}
