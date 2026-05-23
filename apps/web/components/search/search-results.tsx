'use client'

import Link from 'next/link'
import type { SearchResult, SearchResultKind } from '@cocreate/types'
import * as fonts from '@/styles/fonts'

const KIND_LABEL: Record<SearchResultKind, string> = {
  client: 'Clients',
  category: 'Categories',
  project: 'Work',
  original: 'Originals',
}

type SearchResultsProps = {
  results: SearchResult[]
  loading: boolean
  query: string
  onSelect: () => void
}

function groupResults(results: SearchResult[]) {
  const groups: { kind: SearchResultKind; items: SearchResult[] }[] = []
  const order: SearchResultKind[] = ['category', 'client', 'project', 'original']

  for (const kind of order) {
    const items = results.filter((r) => r.kind === kind)
    if (items.length > 0) groups.push({ kind, items })
  }

  return groups
}

export default function SearchResults({
  results,
  loading,
  query,
  onSelect,
}: SearchResultsProps) {
  const trimmed = query.trim()

  if (trimmed.length < 2) {
    return (
      <p
        className={`w-full text-center text-sm text-white/70 ${fonts.bricolage_grot400.className}`}
      >
        Type at least 2 characters to search work, clients, categories, and originals.
      </p>
    )
  }

  if (loading) {
    return (
      <p
        className={`w-full text-center text-sm text-white/80 ${fonts.bricolage_grot400.className}`}
        aria-live="polite"
      >
        Searching…
      </p>
    )
  }

  if (results.length === 0) {
    return (
      <p
        className={`w-full text-center text-sm text-white/80 ${fonts.bricolage_grot400.className}`}
      >
        No results for &ldquo;{trimmed}&rdquo;
      </p>
    )
  }

  const groups = groupResults(results)

  return (
    <div
      className={`
        w-full max-h-[min(50vh,22rem)] overflow-y-auto rounded-3xl bg-white/95 px-2 py-3
        shadow-[0_16px_48px_rgba(0,0,0,0.12)] backdrop-blur-sm
        ${fonts.bricolage_grot400.className}
      `}
      role="listbox"
      aria-label="Search results"
    >
      {groups.map(({ kind, items }) => (
        <div key={kind} className="mb-2 last:mb-0">
          <p className="px-4 py-1 text-xs font-medium uppercase tracking-wider text-sanmarino">
            {KIND_LABEL[kind]}
          </p>
          <ul>
            {items.map((result) => (
              <li key={result.id}>
                <Link
                  href={result.href}
                  role="option"
                  onClick={onSelect}
                  className="block rounded-2xl px-4 py-2.5 text-left transition-colors hover:bg-sanmarino/10"
                >
                  <span className="block text-base text-slate-900">{result.title}</span>
                  {result.subtitle ? (
                    <span className="mt-0.5 block text-sm text-slate-600">
                      {result.subtitle}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
