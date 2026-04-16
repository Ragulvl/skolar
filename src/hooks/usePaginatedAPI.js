import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../api/client'
import { cache, inflight, addFocusListener } from './apiCache'

/**
 * usePaginatedAPI — caching + cursor pagination for list pages.
 * Caches the first page for instant revisits; subsequent pages fetched live.
 *
 * @param {string}   baseUrl
 * @param {object}   options — { params, pageSize, staleTime, transform }
 * @returns {{ items, loading, loadingMore, hasMore, total, loadMore, reset, setItems }}
 */
export function usePaginatedAPI(baseUrl, options = {}) {
  const {
    params = {},
    pageSize = 20,
    staleTime = 60_000,
    transform = (res) => res.data,
  } = options

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
        if (isInitial) setItems(newItems)
        else setItems(prev => [...prev, ...newItems])
        setHasMore(pagination.hasMore ?? false)
        setTotal(pagination.total ?? 0)
        cursorRef.current = pagination.nextCursor ?? null
      }

      if (isInitial) {
        cache.set(cacheKey, {
          data: { items: newItems, hasMore: pagination.hasMore, total: pagination.total },
          ts: Date.now(),
        })
      }

      inflight.delete(url)
    } catch (err) {
      inflight.delete(`${baseUrl}?${new URLSearchParams({ limit: pageSize, ...params })}`)
    } finally {
      if (isInitial && !isBackground) setLoading(false)
      setLoadingMore(false)
    }
  }, [baseUrl, cacheKey, pageSize, paramStr]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const cached = cache.get(cacheKey)
    cursorRef.current = null

    if (cached) {
      setItems(cached.data.items)
      setHasMore(cached.data.hasMore ?? false)
      setTotal(cached.data.total ?? 0)
      setLoading(false)
      if (Date.now() - cached.ts >= staleTime) fetchPage(null, true)
    } else {
      setItems([])
      fetchPage(null, false)
    }
  }, [cacheKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Window-focus revalidation
  useEffect(() => {
    return addFocusListener(() => {
      const cached = cache.get(cacheKeyRef.current)
      if (cached && Date.now() - cached.ts >= staleTime) fetchPage(null, true)
    })
  }, [staleTime, fetchPage])

  const loadMore = useCallback(() => {
    if (cursorRef.current && hasMore && !loadingMore) fetchPage(cursorRef.current)
  }, [hasMore, loadingMore, fetchPage])

  const reset = useCallback(() => {
    cache.delete(cacheKey)
    cursorRef.current = null
    return fetchPage(null, false)
  }, [cacheKey, fetchPage])

  return { items, loading, loadingMore, hasMore, total, loadMore, reset, setItems }
}
