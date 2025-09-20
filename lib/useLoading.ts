import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'

export function useLoading() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Detecta mudanças de rota
  useEffect(() => {
    const handleStart = (url: string) => {
      setIsLoading(true)
    }

    const handleComplete = (url: string) => {
      setIsLoading(false)
    }

    const handleError = (error: Error, url: string) => {
      setIsLoading(false)
      console.error('Navigation error:', error)
    }

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleComplete)
    router.events.on('routeChangeError', handleError)

    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleComplete)
      router.events.off('routeChangeError', handleError)
    }
  }, [router])

  // Função para mostrar loading manualmente
  const showLoading = useCallback((message?: string) => {
    setIsLoading(true)
  }, [])

  // Função para esconder loading manualmente
  const hideLoading = useCallback(() => {
    setIsLoading(false)
  }, [])

  // Função para mostrar loading temporário
  const showTemporaryLoading = useCallback(async (action: () => Promise<any>) => {
    setIsLoading(true)
    
    try {
      const result = await action()
      return result
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isLoading,
    showLoading,
    hideLoading,
    showTemporaryLoading,
  }
}
