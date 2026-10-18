import { useEffect } from 'react'

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · CreditFlow` : 'CreditFlow'
    return () => {
      document.title = 'CreditFlow'
    }
  }, [title])
}

export function useViewportWidth() {
  if (typeof window === 'undefined') return 1440
  return window.innerWidth
}
