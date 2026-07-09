import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

type SanityWebhookBody = {
  _type?: string
  slug?: { current?: string }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.SANITY_REVALIDATE_SECRET

  if (!secret) {
    return NextResponse.json({ error: 'Revalidate secret is not configured' }, { status: 500 })
  }

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: SanityWebhookBody = {}
  try {
    body = (await request.json()) as SanityWebhookBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const revalidateTypes = new Set(['workProject', 'client'])
  if (body._type && !revalidateTypes.has(body._type)) {
    return NextResponse.json({ revalidated: false, skipped: true })
  }

  revalidatePath('/work')

  const slug = body.slug?.current?.trim()
  if (slug) {
    revalidatePath(`/work/${slug}`)
  }

  return NextResponse.json({ revalidated: true, now: Date.now() })
}
