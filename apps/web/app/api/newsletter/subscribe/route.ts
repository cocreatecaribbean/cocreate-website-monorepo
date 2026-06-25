import { nestApiUrl } from '@cocreate/api-client'
import { NextResponse } from 'next/server'


export async function POST(request: Request) {
  let body: { email?: string; website?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Invalid request body' },
      { status: 400 },
    )
  }

  try {
    const response = await fetch(nestApiUrl('/newsletter/subscribe'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: body.email ?? '',
        website: body.website ?? '',
      }),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: 'Unable to reach the newsletter service. Please try again shortly.',
      },
      { status: 503 },
    )
  }
}
