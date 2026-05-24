'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import SearchOverlay from '@/components/search/search-overlay'

type SearchContextValue = {
  isOpen: boolean
  openSearch: () => void
  closeSearch: () => void
  toggleSearch: () => void
}

const SearchContext = createContext<SearchContextValue | null>(null)

function CloseSearchOnNavigate() {
  const pathname = usePathname()
  const { closeSearch } = useSearch()
  const previousPathname = useRef(pathname)

  useEffect(() => {
    if (previousPathname.current === pathname) return
    previousPathname.current = pathname
    closeSearch()
  }, [pathname, closeSearch])

  return null
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openSearch = useCallback(() => setIsOpen(true), [])
  const closeSearch = useCallback(() => setIsOpen(false), [])
  const toggleSearch = useCallback(() => setIsOpen((open) => !open), [])

  const value = useMemo(
    () => ({ isOpen, openSearch, closeSearch, toggleSearch }),
    [isOpen, openSearch, closeSearch, toggleSearch],
  )

  return (
    <SearchContext.Provider value={value}>
      {children}
      <CloseSearchOnNavigate />
      <SearchOverlay />
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider')
  }
  return context
}
