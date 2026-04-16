import { useState, useEffect, useCallback } from 'react'
import api from '../api/client'
import { cache, inflight } from './apiCache'

/**
 * useMultiAPI — fetch multiple URLs in parallel with caching.
 * Perfect for Overview/Dashboard pages loading stats + activity + recent items.
 *
 * @param {Array<{url, key, staleTime?, fallback?, transform?}>} queries
 * @returns {{ data, loading, error, refetch }}
 */
export function useMultiAPI(queries) {
  const [data, setData] = useState(() => {
    const initial = {}
    queries.forEach(q => {
      const cached = cache.get(q.url)
      initial[q.key] = cached?.data ?? q.fallback ?? null
    })
    return initial
  })
  const [loading, setLoading] = useState(() => queries.some(q => !cache.get(q.url)))
  const [error, setError] = useState(null)

  const queryKey = queries.map(q => q.url).join('|')

  const fetchAll = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true)

    try {
      const results = await Promise.all(
        queries.map(async (q) => {
          const cached = cache.get(q.url)
          const staleTime = q.staleTime || 60_000
          const transform = q.transform || (res => res.data.data)
          const isFresh = cached && (Date.now() - cached.ts < staleTime)

          if (isFresh && isBackground) return { key: q.key, data: cached.data }

          let promise = inflight.get(q.url)
          if (!promise) {
            promise = api.get(q.url)
            inflight.set(q.url, promise)
          }

          try {
            const res = await promise
            const result = transform(res)
            cache.set(q.url, { data: result, ts: Date.now() })
            return { key: q.key, data: result }
          } finally {
            inflight.delete(q.url)
          }
        })
      )

      const merged = {}
      results.forEach(r => { merged[r.key] = r.data })
      setData(merged)
    } catch (err) {
      setError(err)
    } finally {
      if (!isBackground) setLoading(false)
    }
  }, [queryKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const hasAnyCache = queries.some(q => cache.get(q.url))
    if (hasAnyCache) {
      const initial = {}
      queries.forEach(q => {
        const cached = cache.get(q.url)
        initial[q.key] = cached?.data ?? q.fallback ?? null
      })
      setData(initial)
      setLoading(false)
      fetchAll(true)
    } else {
      fetchAll(false)
    }
  }, [queryKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(() => {
    queries.forEach(q => cache.delete(q.url))
    return fetchAll(false)
  }, [fetchAll, queryKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch }
}
