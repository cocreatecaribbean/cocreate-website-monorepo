import { NextResponse } from 'next/server'

const apiBase = () => process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/newsletter/confirm-error?reason=missing', request.url))
  }

  try {
    const response = await fetch(
      `${apiBase()}/newsletter/confirm?token=${encodeURIComponent(token)}`,
      { redirect: 'manual', cache: 'no-store' },
    )

    const location = response.headers.get('location')
    if (response.status >= 300 && response.status < 400 && location) {
      return NextResponse.redirect(location)
    }
  } catch {
    // fall through to error page
  }

  return NextResponse.redirect(new URL('/newsletter/confirm-error?reason=invalid', request.url))
}
