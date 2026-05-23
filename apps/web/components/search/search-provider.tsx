'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import SearchOverlay from '@/components/search/search-overlay'

type SearchContextValue = {
  isOpen: boolean
  openSearch: () => void
  closeSearch: () => void
  toggleSearch: () => void
}

const SearchContext = createContext<SearchContextValue | null>(null)

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
