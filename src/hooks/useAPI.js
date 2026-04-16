import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../api/client'
import { cache, inflight, addFocusListener, invalidateCache, mutate } from './apiCache'

// ─── Re-exports for backward compatibility ─────────────────────────────────────
// All existing files import usePaginatedAPI, useMultiAPI, invalidateCache, mutate
// from this file. New code should import directly from the specific module.
export { usePaginatedAPI } from './usePaginatedAPI'
export { useMultiAPI } from './useMultiAPI'
export { invalidateCache, mutate } from './apiCache'

/**
 * useAPI — drop-in replacement for the useEffect+api.get+useState pattern.
 * Returns cached data instantly and revalidates in the background.
 *
 * @param {string|null} url
 * @param {object} options — { staleTime, revalidate, fallback, transform }
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

  const urlRef = useRef(url)
  urlRef.current = url

  const fetchData = useCallback(async (isBackground = false) => {
    const fetchUrl = urlRef.current
    if (!fetchUrl) return

    if (!isBackground) setLoading(true)
    setError(null)

    try {
      let promise = inflight.get(fetchUrl)
      if (!promise) {
        promise = api.get(fetchUrl)
        inflight.set(fetchUrl, promise)
      }

      const res = await promise
      const result = transform(res)

      if (urlRef.current === fetchUrl) {
        setData(result)
        setIsStale(false)
      }
      cache.set(fetchUrl, { data: result, ts: Date.now() })
    } catch (err) {
      if (urlRef.current === fetchUrl) setError(err)
    } finally {
      inflight.delete(fetchUrl)
      if (urlRef.current === fetchUrl && !isBackground) setLoading(false)
    }
  }, [transform])

  useEffect(() => {
    if (!url) { setData(fallback); setLoading(false); return }

    const cached = cache.get(url)
    if (cached) {
      setData(cached.data)
      setLoading(false)
      const isFresh = Date.now() - cached.ts < staleTime
      setIsStale(!isFresh)
      if (!isFresh || revalidate) fetchData(true)
    } else {
      setLoading(true)
      fetchData(false)
    }
  }, [url]) // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(() => {
    if (url) { cache.delete(url); return fetchData(false) }
  }, [url, fetchData])

  return { data, loading, error, refetch, isStale }
}


