/**
 * @jest-environment node
 */

const mockLimit = jest.fn()
const mockSend = jest.fn()
const mockVerifyFetch = jest.fn()

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(
    jest.fn().mockImplementation(() => ({
      limit: mockLimit,
    })),
    {
      slidingWindow: jest.fn((limit: number, window: string) => ({ limit, window })),
    },
  ),
}))

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({})),
}))

jest.mock('@/lib/resend', () => ({
  getResend: () => ({
    emails: { send: mockSend },
  }),
  getResendFromEmail: () => 'noreply@mail.cocreatecaribbean.com',
}))

jest.mock('@/lib/env', () => ({
  getServerEnv: () => ({
    RESEND_API_KEY: 're_test',
    RESEND_FROM_EMAIL: 'noreply@mail.cocreatecaribbean.com',
    CONTACT_TO_EMAIL: 'requests@cocreatecaribbean.com',
    TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
    UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'token',
  }),
  resetServerEnvCacheForTests: jest.fn(),
  hasUpstashRateLimitConfig: () => true,
}))

const originalFetch = global.fetch

beforeAll(() => {
  global.fetch = mockVerifyFetch as unknown as typeof fetch
})

afterAll(() => {
  global.fetch = originalFetch
})

beforeEach(() => {
  jest.clearAllMocks()
  mockLimit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 })
  mockVerifyFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, action: 'contact', hostname: 'localhost' }),
  })
  mockSend.mockResolvedValue({ data: { id: 're_123' }, error: null })
})

function makeRequest(body: unknown, init?: RequestInit) {
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.10',
      ...(init?.headers ?? {}),
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
    ...init,
  })
}

const validBody = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'Hello there, I would like to discuss a project.',
  companyFax: '',
  turnstileToken: 'turnstile-token',
  startedAt: Date.now() - 5_000,
}

describe('POST /api/contact', () => {
  it('sends to requests@ and uses submitter only as replyTo', async () => {
    const { POST } = await import('@/app/api/contact/route')
    const response = await POST(makeRequest(validBody))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'requests@cocreatecaribbean.com',
        replyTo: 'ada@example.com',
        from: 'noreply@mail.cocreatecaribbean.com',
        text: expect.stringContaining('Ada Lovelace'),
      }),
    )
    expect(mockSend.mock.calls[0][0].from).not.toBe('ada@example.com')
  })

  it('rejects honeypot fills without sending email', async () => {
    const { POST } = await import('@/app/api/contact/route')
    const response = await POST(
      makeRequest({
        ...validBody,
        companyFax: 'http://spam.example',
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.ok).toBe(false)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('rejects submissions completed too quickly without sending email', async () => {
    const { POST } = await import('@/app/api/contact/route')
    const response = await POST(
      makeRequest({
        ...validBody,
        startedAt: Date.now() - 100,
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.ok).toBe(false)
    expect(json.message).toMatch(/wait a moment/i)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('rejects failed Turnstile verification', async () => {
    mockVerifyFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
    })

    const { POST } = await import('@/app/api/contact/route')
    const response = await POST(makeRequest(validBody))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.ok).toBe(false)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('returns 429 with Retry-After when rate limited', async () => {
    mockLimit.mockResolvedValueOnce({
      success: false,
      reset: Date.now() + 30_000,
    })

    const { POST } = await import('@/app/api/contact/route')
    const response = await POST(makeRequest(validBody))
    const json = await response.json()

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBeTruthy()
    expect(json.ok).toBe(false)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('returns 503 when Resend fails without leaking config', async () => {
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { name: 'application_error', message: 'boom' },
    })

    const { POST } = await import('@/app/api/contact/route')
    const response = await POST(makeRequest(validBody))
    const json = await response.json()

    expect(response.status).toBe(503)
    expect(json.message).not.toMatch(/RESEND|Doppler|API_KEY/i)
  })

  it('rejects non-JSON content types', async () => {
    const { POST } = await import('@/app/api/contact/route')
    const response = await POST(
      makeRequest(validBody, {
        headers: { 'content-type': 'text/plain' },
      }),
    )
    expect(response.status).toBe(400)
    expect(mockSend).not.toHaveBeenCalled()
  })
})
