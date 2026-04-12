import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, fetchAll, getProfile } from './supabase'

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  // Charge toutes les données depuis Supabase
  const loadData = useCallback(async () => {
    setSyncing(true)
    try {
      const all = await fetchAll()
      setData(all)
    } catch (e) {
      console.warn('[IMPERIUM] Load failed:', e.message)
    }
    setSyncing(false)
  }, [])

  // Auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        getProfile(session.user.id).then(p => {
          setProfile(p)
          loadData().then(() => setLoading(false))
        })
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        const p = await getProfile(session.user.id)
        setProfile(p)
        await loadData()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setData(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadData])

  // Helpers pour mettre à jour les données localement ET dans Supabase
  const upsert = useCallback(async (table, record, localKey) => {
    const { error } = await supabase.from(table).upsert(record)
    if (!error && localKey) {
      setData(prev => ({
        ...prev,
        [localKey]: prev[localKey].map(r => r.id === record.id ? { ...r, ...record } : r)
      }))
    }
    return !error
  }, [])

  const insert = useCallback(async (table, record, localKey) => {
    const { data: inserted, error } = await supabase.from(table).insert(record).select().single()
    if (!error && localKey) {
      setData(prev => ({ ...prev, [localKey]: [...prev[localKey], inserted] }))
    }
    return error ? null : inserted
  }, [])

  const remove = useCallback(async (table, id, localKey) => {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (!error && localKey) {
      setData(prev => ({ ...prev, [localKey]: prev[localKey].filter(r => r.id !== id) }))
    }
    return !error
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
