import 'server-only'

import { draftMode, headers } from 'next/headers'

/** True when Presentation iframe has enabled draft mode (not a stale draft cookie alone). */
export async function getSanityPreviewContext(): Promise<boolean> {
  const { isEnabled } = await draftMode()
  if (!isEnabled) {
    return false
  }

  const isEmbedded = (await headers()).get('x-preview-context') === 'embedded'
  return isEmbedded
}
