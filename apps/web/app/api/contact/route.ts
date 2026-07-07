import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getResend, getResendFromEmail } from '@/lib/resend'

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('A valid email is required'),
  message: z.string().trim().min(1, 'Message is required').max(5000),
  website: z.string().optional(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 })
  }

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid form data'
    return NextResponse.json({ ok: false, message }, { status: 400 })
  }

  const { name, email, message, website } = parsed.data
  if (website?.trim()) {
    return NextResponse.json({ ok: true, message: 'Thanks! Your message has been sent.' })
  }

  const to = process.env.CONTACT_TO_EMAIL ?? 'hello@cocreatecaribbean.com'

  try {
    const resend = getResend()
    const { error } = await resend.emails.send({
      from: getResendFromEmail(),
      to,
      replyTo: email,
      subject: `Website contact from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    })

    if (error) {
      return NextResponse.json(
        { ok: false, message: 'Unable to send your message right now. Please try again shortly.' },
        { status: 503 },
      )
    }

    return NextResponse.json({
      ok: true,
      message: 'Thanks! Your message has been sent.',
    })
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message:
          'Contact form is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL in Doppler.',
      },
      { status: 503 },
    )
  }
}
