import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../api/client'

// ─── Global Cache ──────────────────────────────────────────────────────────────
// A simple in-memory cache shared across all components. When a user navigates
// away and comes back, the cached data renders instantly while a background
// revalidation refreshes it silently. This eliminates the "loading spinner on
// every page visit" problem without adding any external dependencies.

const cache = new Map()

// In-flight request tracking — prevents duplicate requests when multiple
// components request the same URL simultaneously
const inflight = new Map()

/**
 * useAPI — drop-in replacement for the useEffect+api.get+useState pattern.
 *
 * Features:
 *  - Returns cached data instantly (no loading spinner on revisit)
 *  - Revalidates in the background if data is stale
 *  - Deduplicates concurrent requests to the same URL
 *  - Configurable stale time
 *
 * @param {string|null} url     — API path (e.g., '/superadmin/stats'). Pass null to skip.
 * @param {object}      options
 * @param {number}       options.staleTime   — ms before cached data is considered stale (default: 60s)
 * @param {boolean}      options.revalidate  — if true, always refetch in background even if cache is fresh (default: true)
 * @param {any}          options.fallback    — default value while loading (default: null)
 * @param {function}     options.transform   — transform response data (default: res => res.data.data)
 *
 * @returns {{ data, loading, error, refetch, isStale }}
 */
export default function useAPI(url, options = {}) {
  const {
    staleTime = 60_000,
    revalidate = true,
    fallback = null,
    transform = (res) => res.data.data,
  } = options

  const cached = url ? cache.get(url) : null
  const hasFreshCache = cached && (Date.now() - cached.ts < staleTime)

  const [data, setData] = useState(cached?.data ?? fallback)
  const [loading, setLoading] = useState(!cached && !!url)
  const [error, setError] = useState(null)
  const [isStale, setIsStale] = useState(!hasFreshCache && !!url)

  // Track the current URL to avoid stale closures
  const urlRef = useRef(url)
  urlRef.current = url

  const fetchData = useCallback(async (isBackground = false) => {
    const fetchUrl = urlRef.current
    if (!fetchUrl) return

    // Don't show loading spinner for background revalidation
    if (!isBackground) setLoading(true)
    setError(null)

    try {
      // Deduplicate — if this exact URL is already being fetched, wait for it
      let promise = inflight.get(fetchUrl)
      if (!promise) {
        promise = api.get(fetchUrl)
        inflight.set(fetchUrl, promise)
      }

      const res = await promise
      const result = transform(res)

      // Only update state if this is still the active URL
      if (urlRef.current === fetchUrl) {
        setData(result)
        setIsStale(false)
      }

      // Update cache
      cache.set(fetchUrl, { data: result, ts: Date.now() })
    } catch (err) {
      if (urlRef.current === fetchUrl) {
        setError(err)
        // Keep stale data visible on error
      }
    } finally {
      inflight.delete(fetchUrl)
      if (urlRef.current === fetchUrl && !isBackground) {
        setLoading(false)
      }
    }
  }, [transform])

  useEffect(() => {
    if (!url) {
      setData(fallback)
      setLoading(false)
      return
    }

    const cached = cache.get(url)

    if (cached) {
      // Serve cached data immediately — no loading spinner
      setData(cached.data)
      setLoading(false)

      const isFresh = Date.now() - cached.ts < staleTime
      setIsStale(!isFresh)

      // Revalidate in background if stale or if revalidate is forced
      if (!isFresh || revalidate) {
        fetchData(true) // background = true, no loading spinner
      }
    } else {
      // No cache — show loading and fetch
      setLoading(true)
      fetchData(false)
    }
  }, [url]) // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(() => {
    if (url) {
      cache.delete(url)
      return fetchData(false)
    }
  }, [url, fetchData])

  return { data, loading, error, refetch, isStale }
}

/**
 * useMultiAPI — fetch multiple URLs in parallel, with caching.
 * Perfect for Overview/Dashboard pages that load stats + activity + recent items.
 *
 * @param {Array<{url: string, key: string, staleTime?: number, fallback?: any, transform?: function}>} queries
 * @returns {{ data: Record<string, any>, loading: boolean, error: any, refetch: function }}
 */
export function useMultiAPI(queries) {
  const [data, setData] = useState(() => {
    const initial = {}
    queries.forEach(q => {
      const cached = cache.get(q.url)
      const transform = q.transform || (res => res.data.data)
      initial[q.key] = cached?.data ?? q.fallback ?? null
    })
    return initial
  })
  const [loading, setLoading] = useState(() => {
    return queries.some(q => !cache.get(q.url))
  })
  const [error, setError] = useState(null)

  // Serialize query URLs for dependency tracking
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

          if (isFresh && isBackground) {
            return { key: q.key, data: cached.data }
          }

          // Deduplicate
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
      // Serve whatever we have from cache immediately
      const initial = {}
      queries.forEach(q => {
        const cached = cache.get(q.url)
        const transform = q.transform || (res => res.data.data)
        initial[q.key] = cached?.data ?? q.fallback ?? null
      })
      setData(initial)
      setLoading(false)
      fetchAll(true) // background revalidate
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

/**
 * Invalidate cached data for a URL or URL prefix.
 * Call this after mutations to ensure the next visit gets fresh data.
 */
export function invalidateCache(urlOrPrefix) {
  if (!urlOrPrefix) {
    cache.clear()
    return
  }
  for (const key of cache.keys()) {
    if (key === urlOrPrefix || key.startsWith(urlOrPrefix)) {
      cache.delete(key)
    }
  }
}
