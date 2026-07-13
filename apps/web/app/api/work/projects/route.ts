import { draftMode } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fetchWorkProjectPreviews } from '@/lib/cms/work-projects'

export const dynamic = 'force-dynamic'

/**
 * joh FX pattern: draft tiles only when draftMode + client sends X-Preview-Context
 * from a Presentation iframe. Soft-back to /work can refill without widening proxy.
 */
export async function GET(request: NextRequest) {
  try {
    const { isEnabled } = await draftMode()
    const isEmbedded = request.headers.get('x-preview-context') === 'embedded'
    const preview = isEnabled && isEmbedded

    const projects = await fetchWorkProjectPreviews(preview)

    const response = NextResponse.json({ projects, preview })
    response.headers.set('Cache-Control', 'no-store')
    return response
  } catch (error) {
    console.error('[api/work/projects]', error)
    return NextResponse.json(
      { error: 'Unable to load work projects' },
      { status: 503 },
    )
  }
}
