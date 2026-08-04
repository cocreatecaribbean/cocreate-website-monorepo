import { CONTACT_FIELD_LIMITS, contactRequestSchema } from '@/lib/contact-schema'

const validBase = {
  name: 'Ada Lovelace',
  email: 'Ada@Example.com',
  message: 'Hello there, I would like to discuss a project.',
  companyFax: '',
  turnstileToken: 'token-abc',
  startedAt: Date.now() - 5_000,
}

describe('contactRequestSchema', () => {
  it('accepts a valid payload and normalizes email', () => {
    const parsed = contactRequestSchema.parse(validBase)
    expect(parsed.email).toBe('ada@example.com')
    expect(parsed.name).toBe('Ada Lovelace')
  })

  it('rejects unknown keys', () => {
    const result = contactRequestSchema.safeParse({
      ...validBase,
      extra: 'nope',
    })
    expect(result.success).toBe(false)
  })

  it('rejects control characters in name', () => {
    const result = contactRequestSchema.safeParse({
      ...validBase,
      name: 'Ada\nLovelace',
    })
    expect(result.success).toBe(false)
  })

  it('accepts short non-empty messages', () => {
    const result = contactRequestSchema.safeParse({
      ...validBase,
      message: 'Hi',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.message).toBe('Hi')
    }
  })

  it('accepts messages with newlines and tabs', () => {
    const result = contactRequestSchema.safeParse({
      ...validBase,
      message: 'Line one\nLine two\r\n\tindented',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.message).toContain('\n')
    }
  })

  it('rejects null bytes in message', () => {
    const result = contactRequestSchema.safeParse({
      ...validBase,
      message: 'Hello\u0000world',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty messages', () => {
    const result = contactRequestSchema.safeParse({
      ...validBase,
      message: '   ',
    })
    expect(result.success).toBe(false)
  })

  it('rejects overlong emails', () => {
    const result = contactRequestSchema.safeParse({
      ...validBase,
      email: `${'a'.repeat(310)}@example.com`,
    })
    expect(result.success).toBe(false)
  })

  it('requires a turnstile token', () => {
    const result = contactRequestSchema.safeParse({
      ...validBase,
      turnstileToken: '',
    })
    expect(result.success).toBe(false)
  })

  it('caps honeypot length', () => {
    const result = contactRequestSchema.safeParse({
      ...validBase,
      companyFax: 'x'.repeat(CONTACT_FIELD_LIMITS.companyFax + 1),
    })
    expect(result.success).toBe(false)
  })
})
