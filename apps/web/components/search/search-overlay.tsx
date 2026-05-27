'use client'

import { FormEvent, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search } from 'lucide-react'
import type { SearchResult } from '@cocreate/types'
import * as fonts from '@/styles/fonts'
import { useSearch } from '@/components/search/search-provider'
import SearchResults from '@/components/search/search-results'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

export default function SearchOverlay() {
  const { isOpen, closeSearch } = useSearch()
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogId = useId()
  const headingId = `${dialogId}-heading`
  const subtextId = `${dialogId}-subtext`
  const labelId = `${dialogId}-label`
  const [mounted, setMounted] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.classList.add('search-open')

    const frame = requestAnimationFrame(() => inputRef.current?.focus())

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSearch()
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      cancelAnimationFrame(frame)
      document.documentElement.style.overflow = previousOverflow
      document.body.classList.remove('search-open')
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, closeSearch])

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setResults([])
      setLoading(false)
    }
  }, [isOpen])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&limit=12`,
          { signal: controller.signal },
        )
        if (!response.ok) throw new Error('Search failed')
        const data = (await response.json()) as { results: SearchResult[] }
        setResults(data.results)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setResults([])
        }
      } finally {
        setLoading(false)
      }
    }, 220)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [query])

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (results.length > 0) return
  }

  const handleResultSelect = () => {
    closeSearch()
  }

  const showResults = query.trim().length >= 2

  if (!mounted) return null

  return createPortal(
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-[200] ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        aria-label="Close search"
        tabIndex={isOpen ? 0 : -1}
        onClick={closeSearch}
        className={`absolute inset-0 bg-black/25 backdrop-blur-xl transition-opacity duration-500 ease-out ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{
          opacity: isOpen ? 1 : 0,
          transitionTimingFunction: EASE,
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={subtextId}
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-y-auto px-6 py-16"
      >
        <div
          className={`flex w-full max-w-[min(92vw,42rem)] flex-col items-center gap-3 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
          style={{
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(12px)',
            transition: `opacity 520ms ${EASE}, transform 520ms ${EASE}`,
          }}
        >
          <h2
            id={headingId}
            className={`
              max-w-[min(92vw,36rem)] text-balance text-center text-white
              text-[clamp(1.35rem,4.5vw,2.25rem)] leading-tight tracking-tight
              ${fonts.bricolage_grot600.className}
            `}
          >
            Search
          </h2>

          <p
            id={subtextId}
            className={`
              max-w-[min(92vw,36rem)] text-balance text-center text-white/85
              text-[clamp(0.8125rem,2.5vw,1rem)] leading-snug
              ${fonts.bricolage_grot400.className}
            `}
          >
            Search projects, clients and project categories.
          </p>

          <p
            className={`
              text-center text-sm text-white/85
              ${fonts.bricolage_grot400.className}
            `}
          >
            <span className="md:hidden">Tap outside to exit search</span>
            <span className="hidden md:inline">
              Press ESC or click outside to exit search
            </span>
          </p>
          <form
            onSubmit={onSubmit}
            className={`
              relative flex w-full items-center gap-3
              rounded-full bg-white px-6 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.18)]
              sm:px-8 sm:py-5
              ${fonts.bricolage_grot400.className}
            `}
            onClick={(event) => event.stopPropagation()}
          >
            <label id={labelId} htmlFor={`${dialogId}-input`} className="sr-only">
              Search the site
            </label>
            <input
              ref={inputRef}
              id={`${dialogId}-input`}
              name="q"
              type="search"
              autoComplete="off"
              placeholder="Looking for something ?"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              tabIndex={isOpen ? 0 : -1}
              className="
                min-w-0 flex-1 border-0 bg-transparent text-base text-black
                outline-none placeholder:text-black/70
                sm:text-lg md:text-xl
              "
            />
            <button
              type="submit"
              aria-label="Submit search"
              tabIndex={isOpen ? 0 : -1}
              className="shrink-0 text-black transition-opacity hover:opacity-70"
            >
              <Search className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.25} />
            </button>
          </form>
          {showResults ? (
            <SearchResults
              results={results}
              loading={loading}
              query={query}
              onSelect={handleResultSelect}
            />
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}
