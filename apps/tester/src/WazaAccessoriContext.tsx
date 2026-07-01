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
  mergeAllAccessori,
  type WazaAccessoriPayload,
} from './wazaAccessoriMerge'

export type WazaAccessoriContextValue = {
  loading: boolean
  /** Errore ultimo fetch (solo se c’è API configurata). */
  fetchError: string | null
  /** Payload grezzo dall’API; null = mai ricevuto o nessuna API. */
  remote: WazaAccessoriPayload | null
  merged: ReturnType<typeof mergeAllAccessori>
  refetch: () => Promise<void>
}

const STATIC_MERGED = mergeAllAccessori(null)

const defaultValue: WazaAccessoriContextValue = {
  loading: false,
  fetchError: null,
  remote: null,
  merged: STATIC_MERGED,
  refetch: async () => {},
}

const Ctx = createContext<WazaAccessoriContextValue>(defaultValue)

export function WazaAccessoriProvider({ children }: { children: ReactNode }) {
  const base = getTesterContributionsApiBase()
  const [remote, setRemote] = useState<WazaAccessoriPayload | null>(null)
  const [loading, setLoading] = useState(Boolean(base))
  const [fetchError, setFetchError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!base) {
      setLoading(false)
      setRemote(null)
      setFetchError(null)
      return
    }
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch(`${base}/api/waza-accessori`)
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      const data = (await res.json()) as WazaAccessoriPayload
      setRemote({
        condizioni: Array.isArray(data.condizioni) ? data.condizioni : [],
        status: Array.isArray(data.status) ? data.status : [],
        counter: Array.isArray(data.counter) ? data.counter : [],
        deletedCondizioneIds: Array.isArray(data.deletedCondizioneIds)
          ? data.deletedCondizioneIds
          : [],
        deletedStatusIds: Array.isArray(data.deletedStatusIds)
          ? data.deletedStatusIds
          : [],
        deletedCounterIds: Array.isArray(data.deletedCounterIds)
          ? data.deletedCounterIds
          : [],
      })
    } catch (e) {
      setRemote(null)
      setFetchError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [base])

  useEffect(() => {
    refetch()
  }, [refetch])

  const merged = useMemo(() => mergeAllAccessori(remote), [remote])

  const value = useMemo<WazaAccessoriContextValue>(
    () => ({
      loading,
      fetchError,
      remote,
      merged: base ? merged : STATIC_MERGED,
      refetch,
    }),
    [loading, fetchError, remote, merged, refetch, base],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useWazaAccessori(): WazaAccessoriContextValue {
  return useContext(Ctx)
}
