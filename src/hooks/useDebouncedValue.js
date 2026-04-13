import { useState, useEffect } from 'react'

/**
 * useDebouncedValue — delays propagating a value by `delay` ms.
 * Used to debounce search input before sending to the server.
 */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
