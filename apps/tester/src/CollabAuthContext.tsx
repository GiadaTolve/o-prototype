import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getTesterContributionsApiBase } from './authoringApi'
import {
  clearCollabSession,
  getCollabDisplayUser,
  getCollabJwt,
  setCollabSession,
} from './collabAuth'

type CollabAuthValue = {
  user: string | null
  token: string | null
  /** null = in caricamento da /api/auth/config */
  collabLoginRequired: boolean | null
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<CollabAuthValue | null>(null)

export function CollabAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(() => getCollabDisplayUser())
  const [token, setToken] = useState<string | null>(() => getCollabJwt())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** In produzione senza URL API: true così «Idee e sviluppo» mostra subito il gate login (con messaggio a login se manca still base). */
  const [collabLoginRequired, setCollabLoginRequired] = useState<boolean | null>(() =>
    import.meta.env.PROD && !getTesterContributionsApiBase() ? true : null,
  )

  const apiBase = getTesterContributionsApiBase()

  useEffect(() => {
    setUser(getCollabDisplayUser())
    setToken(getCollabJwt())
  }, [])

  useEffect(() => {
    if (!apiBase) {
      setCollabLoginRequired(import.meta.env.PROD ? true : null)
      return
    }
    let cancel = false
    ;(async () => {
      try {
        const r = await fetch(`${apiBase}/api/auth/config`)
        const d = r.ok ? ((await r.json()) as { collabLoginRequired?: boolean }) : {}
        if (!cancel) setCollabLoginRequired(Boolean(d.collabLoginRequired))
      } catch {
        if (!cancel) setCollabLoginRequired(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [apiBase])

  const login = useCallback(
    async (username: string, password: string) => {
      const base = getTesterContributionsApiBase()
      if (!base) {
        throw new Error(
          'Indica prima l’URL del server API (campo «Server API» sopra) oppure ricarica dopo averlo salvato.',
        )
      }
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${base}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), password }),
        })
        if (!res.ok) {
          const t = await res.text()
          throw new Error(t || 'Accesso negato')
        }
        const data = (await res.json()) as { token?: string; user?: string }
        if (!data.token || !data.user) throw new Error('Risposta login non valida')
        setCollabSession(data.token, data.user)
        setToken(data.token)
        setUser(data.user)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        setError(msg)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const logout = useCallback(() => {
    clearCollabSession()
    setToken(null)
    setUser(null)
    setError(null)
  }, [])

  const value = useMemo<CollabAuthValue>(
    () => ({
      user,
      token,
      collabLoginRequired,
      loading,
      error,
      login,
      logout,
    }),
    [user, token, collabLoginRequired, loading, error, login, logout],
  )

  const localDevValue = useMemo<CollabAuthValue>(
    () => ({
      user: '_local_dev',
      token: null,
      collabLoginRequired: false,
      loading: false,
      error: null,
      login: async () => {},
      logout: () => {},
    }),
    [],
  )

  /** In dev senza VITE_TESTER_API_URL: niente gate (comportamento legacy). In produzione sempre stato reale (login + meta / env). */
  const bypassCollab = import.meta.env.DEV && !apiBase

  return (
    <Ctx.Provider value={bypassCollab ? localDevValue : value}>{children}</Ctx.Provider>
  )
}

export function useCollabAuth(): CollabAuthValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useCollabAuth: provider mancante')
  return v
}
