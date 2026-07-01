import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  SKIRU_POOL,
  SKIRU_CATEGORY_ORDER,
  SKIRU_CATEGORY_LABELS,
  type SkiruDef,
} from './skiruPool'
import { getTesterContributionsApiBase } from './authoringApi'

type RuntimeSkiruValue = {
  pool: SkiruDef[]
  categoryOrder: string[]
  categoryLabels: Record<string, string>
  hasRemotePool: boolean
  hasRemoteCategories: boolean
  loading: boolean
  refetch: () => Promise<{ pool: SkiruDef[]; order: string[]; labels: Record<string, string> } | null>
}

const Ctx = createContext<RuntimeSkiruValue | null>(null)

const defaultLabels: Record<string, string> = { ...SKIRU_CATEGORY_LABELS }

export function RuntimeSkiruProvider({ children }: { children: ReactNode }) {
  const base = getTesterContributionsApiBase()
  const [pool, setPool] = useState<SkiruDef[]>(() => [...SKIRU_POOL])
  const [categoryOrder, setCategoryOrder] = useState<string[]>(() => [...SKIRU_CATEGORY_ORDER])
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>(() => ({
    ...defaultLabels,
  }))
  const [hasRemotePool, setHasRemotePool] = useState(false)
  const [hasRemoteCategories, setHasRemoteCategories] = useState(false)
  const [loading, setLoading] = useState(Boolean(base))

  const applyFetched = useCallback(
    (
      rp: { hasSnapshot?: boolean; entries?: unknown[] } | null,
      rc: { hasSnapshot?: boolean; order?: unknown[]; labels?: unknown } | null,
    ): { pool: SkiruDef[]; order: string[]; labels: Record<string, string> } => {
      let nextPool = [...SKIRU_POOL]
      let nextOrder: string[] = [...SKIRU_CATEGORY_ORDER]
      let nextLabels: Record<string, string> = { ...defaultLabels }
      let rpRem = false
      let rcRem = false

      if (rp?.hasSnapshot && Array.isArray(rp.entries) && rp.entries.length > 0) {
        nextPool = rp.entries as SkiruDef[]
        rpRem = true
      }
      if (
        rc?.hasSnapshot &&
        Array.isArray(rc.order) &&
        rc.order.length > 0 &&
        rc.labels &&
        typeof rc.labels === 'object' &&
        rc.labels !== null
      ) {
        nextOrder = rc.order.filter((x): x is string => typeof x === 'string')
        const lab: Record<string, string> = {}
        for (const [k, v] of Object.entries(rc.labels as Record<string, unknown>)) {
          if (typeof v === 'string') lab[k] = v
        }
        nextLabels = { ...lab }
        rcRem = true
      }

      setPool(nextPool)
      setCategoryOrder(nextOrder)
      setCategoryLabels(nextLabels)
      setHasRemotePool(rpRem)
      setHasRemoteCategories(rcRem)

      return { pool: nextPool, order: nextOrder, labels: nextLabels }
    },
    [],
  )

  const refetch = useCallback(async () => {
    if (!base) {
      const local = applyFetched(null, null)
      return local
    }
    setLoading(true)
    try {
      const [rp, rc] = await Promise.all([
        fetch(`${base}/api/runtime/skiru`).then((r) => r.json()),
        fetch(`${base}/api/runtime/skiru-categories`).then((r) => r.json()),
      ])
      return applyFetched(rp, rc)
    } catch {
      return applyFetched(null, null)
    } finally {
      setLoading(false)
    }
  }, [base, applyFetched])

  useEffect(() => {
    refetch()
  }, [refetch])

  const value = useMemo<RuntimeSkiruValue>(
    () => ({
      pool,
      categoryOrder,
      categoryLabels,
      hasRemotePool,
      hasRemoteCategories,
      loading,
      refetch,
    }),
    [pool, categoryOrder, categoryLabels, hasRemotePool, hasRemoteCategories, loading, refetch],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useRuntimeSkiru(): RuntimeSkiruValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useRuntimeSkiru: provider mancante')
  return v
}
