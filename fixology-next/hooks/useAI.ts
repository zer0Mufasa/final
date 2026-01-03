'use client'

import { useCallback, useState } from 'react'

interface UseAIOptions<T> {
  endpoint: string
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
}

export function useAI<T = any>({ endpoint, onSuccess, onError }: UseAIOptions<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(
    async (input: Record<string, any>) => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })

        const json = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(json?.error || 'Request failed')
        }

        const result = (json?.result ?? json) as T
        setData(result)
        onSuccess?.(result)
        return result
      } catch (err: any) {
        const message = err?.message || 'Unknown error'
        setError(message)
        onError?.(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [endpoint, onError, onSuccess]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
  }, [])

  return { data, loading, error, execute, reset }
}

