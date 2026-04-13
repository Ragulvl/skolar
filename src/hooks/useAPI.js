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

// ─── Window Focus Revalidation ──────────────────────────────────────────────
// When the user returns to the tab after being away, mark all cached entries as
// stale so the next useAPI mount triggers a background revalidation. This keeps
// data fresh without polling.

const FOCUS_LISTENERS = new Set()

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      FOCUS_LISTENERS.forEach(fn => fn())
    }
  })
}

/**
 * Register a callback to run when the window regains focus.
 * Used internally by useAPI to trigger background revalidation.
 */
function useWindowFocus(callback) {
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    const handler = () => cbRef.current()
    FOCUS_LISTENERS.add(handler)
    return () => FOCUS_LISTENERS.delete(handler)
  }, [])
}

/**
 * usePaginatedAPI — caching wrapper for paginated list pages with cursor
 * pagination, search, and filters.
 *
 * Caches the first page of results. On revisit, the cached first page renders
 * instantly while a background revalidation refreshes it silently. Subsequent
 * "load more" pages are fetched live (not cached) to keep memory bounded.
 *
 * @param {string}   baseUrl    — API path without query (e.g. '/superadmin/users')
 * @param {object}   options
 * @param {object}    options.params     — filter/search params (merged into URL)
 * @param {number}    options.pageSize   — items per page (default: 20)
 * @param {number}    options.staleTime  — ms before cache is stale (default: 60s)
 * @param {function}  options.transform  — transform response (default: res => res.data)
 *
 * @returns {{ items, loading, loadingMore, hasMore, total, fetchPage, reset }}
 */
export function usePaginatedAPI(baseUrl, options = {}) {
  const {
    params = {},
    pageSize = 20,
    staleTime = 60_000,
    transform = (res) => res.data,
  } = options

  // Build cache key from baseUrl + sorted params (excludes cursor)
  const paramStr = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'all')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
  const cacheKey = paramStr ? `${baseUrl}?${paramStr}` : baseUrl

  const cached = cache.get(cacheKey)

  const [items, setItems] = useState(cached?.data?.items ?? [])
  const [loading, setLoading] = useState(!cached)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(cached?.data?.hasMore ?? false)
  const [total, setTotal] = useState(cached?.data?.total ?? 0)
  const cursorRef = useRef(null)
  const cacheKeyRef = useRef(cacheKey)
  cacheKeyRef.current = cacheKey

  const fetchPage = useCallback(async (cursor = null, isBackground = false) => {
    const isInitial = !cursor
    if (isInitial && !isBackground) setLoading(true)
    if (!isInitial) setLoadingMore(true)

    try {
      const qp = new URLSearchParams({ limit: pageSize, ...params })
      if (cursor) qp.set('cursor', cursor)
      const url = `${baseUrl}?${qp}`

      let promise = inflight.get(url)
      if (!promise) {
        promise = api.get(url)
        inflight.set(url, promise)
      }

      const res = await promise
      const result = transform(res)
      const newItems = result.data || []
      const pagination = result.pagination || {}

      if (cacheKeyRef.current === cacheKey) {
        if (isInitial) {
          setItems(newItems)
        } else {
          setItems(prev => [...prev, ...newItems])
        }
        setHasMore(pagination.hasMore ?? false)
        setTotal(pagination.total ?? 0)
        cursorRef.current = pagination.nextCursor ?? null
      }

      // Cache only the first page for instant revisit
      if (isInitial) {
        cache.set(cacheKey, {
          data: { items: newItems, hasMore: pagination.hasMore, total: pagination.total },
          ts: Date.now(),
        })
      }

      inflight.delete(url)
    } catch (err) {
      inflight.delete(`${baseUrl}?${new URLSearchParams({ limit: pageSize, ...params })}`)
      // Keep stale data on error
    } finally {
      if (isInitial && !isBackground) setLoading(false)
      setLoadingMore(false)
    }
  }, [baseUrl, cacheKey, pageSize, paramStr]) // eslint-disable-line react-hooks/exhaustive-deps

  // Initial fetch or serve from cache
  useEffect(() => {
    const cached = cache.get(cacheKey)
    cursorRef.current = null

    if (cached) {
      setItems(cached.data.items)
      setHasMore(cached.data.hasMore ?? false)
      setTotal(cached.data.total ?? 0)
      setLoading(false)

      const isFresh = Date.now() - cached.ts < staleTime
      if (!isFresh) {
        fetchPage(null, true)
      }
    } else {
      setItems([])
      fetchPage(null, false)
    }
  }, [cacheKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Window-focus revalidation
  useWindowFocus(() => {
    const cached = cache.get(cacheKeyRef.current)
    if (cached && Date.now() - cached.ts >= staleTime) {
      fetchPage(null, true)
    }
  })

  const loadMore = useCallback(() => {
    if (cursorRef.current && hasMore && !loadingMore) {
      fetchPage(cursorRef.current)
    }
  }, [hasMore, loadingMore, fetchPage])

  const reset = useCallback(() => {
    cache.delete(cacheKey)
    cursorRef.current = null
    return fetchPage(null, false)
  }, [cacheKey, fetchPage])

  return { items, loading, loadingMore, hasMore, total, loadMore, reset, setItems }
}

/**
 * mutate — perform a mutation (POST/PATCH/DELETE) and auto-invalidate caches.
 *
 * @param {'post'|'patch'|'delete'} method
 * @param {string}                  url
 * @param {any}                     data        — request body (omit for DELETE)
 * @param {string[]}                invalidate  — URL prefixes to invalidate after success
 * @returns {Promise} — the axios response
 */
export async function mutate(method, url, data, invalidate = []) {
  const res = await api[method](url, data)
  invalidate.forEach(prefix => invalidateCache(prefix))
  return res
}
