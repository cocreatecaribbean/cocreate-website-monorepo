import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const redirectTo = request.nextUrl.searchParams.get('redirect') ?? '/work'

  const draft = await draftMode()
  draft.disable()

  redirect(redirectTo)
}
