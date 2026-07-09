'use client'

import { useSyncExternalStore } from 'react'
import { VisualEditing } from 'next-sanity/visual-editing'

function subscribe() {
  return () => {}
}

function getIsEmbedded() {
  return typeof window !== 'undefined' && window.self !== window.top
}

export function SanityVisualEditing() {
  const isEmbedded = useSyncExternalStore(subscribe, getIsEmbedded, () => false)

  if (!isEmbedded) {
    return null
  }

  return <VisualEditing />
}
