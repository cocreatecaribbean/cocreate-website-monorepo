import 'server-only'

import { draftMode, headers } from 'next/headers'

/**
 * joh dual gate: draftMode + proxy `x-preview-context: embedded`
 * (iframe or Studio referer). Leftover draft cookie alone stays published.
 */
export async function getSanityPreviewContext(): Promise<boolean> {
  const { isEnabled } = await draftMode()
  if (!isEnabled) {
    return false
  }

  const isEmbedded = (await headers()).get('x-preview-context') === 'embedded'
  return isEmbedded
}
