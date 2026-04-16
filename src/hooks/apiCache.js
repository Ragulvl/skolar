// ─── Shared cache and inflight tracker ─────────────────────────────────────────
// Single instances shared across all hook files. Centralising them here avoids
// multiple Map instances when modules are hot-replaced by Vite.

export const cache = new Map()
export const inflight = new Map()

// ─── Window Focus Revalidation ──────────────────────────────────────────────────
const FOCUS_LISTENERS = new Set()

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      FOCUS_LISTENERS.forEach(fn => fn())
    }
  })
}

export function addFocusListener(fn) {
  FOCUS_LISTENERS.add(fn)
  return () => FOCUS_LISTENERS.delete(fn)
}

// ─── Cache helpers ──────────────────────────────────────────────────────────────
export function invalidateCache(urlOrPrefix) {
  if (!urlOrPrefix) { cache.clear(); return }
  for (const key of cache.keys()) {
    if (key === urlOrPrefix || key.startsWith(urlOrPrefix)) cache.delete(key)
  }
}

export async function mutate(method, url, data, invalidate = []) {
  const api = (await import('../api/client')).default
  const res = await api[method](url, data)
  invalidate.forEach(prefix => invalidateCache(prefix))
  return res
}
