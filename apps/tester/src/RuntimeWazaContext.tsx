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
import { mergeWazaPoolWithRuntime, type WazaPoolRuntimePayload } from './runtimeWazaMerge'
import { WAZA_POOL, type WazaDef } from './wazaPool'

type RuntimeWazaValue = {
  pool: WazaDef[]
  hasRemoteOverlay: boolean
  loading: boolean
  fetchError: string | null
  refetch: () => Promise<void>
}

const Ctx = createContext<RuntimeWazaValue | null>(null)

const defaultPayload: WazaPoolRuntimePayload = {
  hasOverlay: false,
  replacements: [],
  removedIds: [],
}

export function RuntimeWazaProvider({ children }: { children: ReactNode }) {
  const base = getTesterContributionsApiBase()
  const [overlay, setOverlay] = useState<WazaPoolRuntimePayload>(defaultPayload)
  const [loading, setLoading] = useState(Boolean(base))
  const [fetchError, setFetchError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!base) {
      setOverlay(defaultPayload)
      setFetchError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch(`${base}/api/runtime/waza`)
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      const data = (await res.json()) as WazaPoolRuntimePayload
      setOverlay({
        hasOverlay: Boolean(data.hasOverlay),
        replacements: Array.isArray(data.replacements) ? data.replacements : [],
        removedIds: Array.isArray(data.removedIds) ? data.removedIds : [],
      })
    } catch (e) {
      setOverlay(defaultPayload)
      setFetchError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [base])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const pool = useMemo(
    () => mergeWazaPoolWithRuntime(WAZA_POOL, base ? overlay : null),
    [base, overlay],
  )

  const value = useMemo<RuntimeWazaValue>(
    () => ({
      pool,
      hasRemoteOverlay: Boolean(base && overlay.hasOverlay),
      loading,
      fetchError,
      refetch,
    }),
    [pool, base, overlay.hasOverlay, loading, fetchError, refetch],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useRuntimeWaza(): RuntimeWazaValue {
  const v = useContext(Ctx)
  if (!v) {
    return {
      pool: [...WAZA_POOL],
      hasRemoteOverlay: false,
      loading: false,
      fetchError: null,
      refetch: async () => {},
    }
  }
  return v
}
