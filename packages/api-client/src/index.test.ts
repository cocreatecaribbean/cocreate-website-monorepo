/** @jest-environment node */
import { getApiBaseUrl, getApiVersion, nestApiUrl } from '@cocreate/api-client'

describe('nestApiUrl', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    process.env.API_URL = 'http://localhost:3001'
    process.env.API_VERSION = '1'
    delete process.env.NEXT_PUBLIC_API_VERSION
    delete process.env.NEXT_PUBLIC_API_URL
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('builds versioned paths', () => {
    expect(nestApiUrl('/admin/admins')).toBe('http://localhost:3001/v1/admin/admins')
    expect(nestApiUrl('client-portal/me')).toBe('http://localhost:3001/v1/client-portal/me')
  })

  it('respects API_VERSION env', () => {
    process.env.API_VERSION = '2'
    expect(getApiVersion()).toBe('2')
    expect(nestApiUrl('/health')).toBe('http://localhost:3001/v2/health')
  })

  it('strips trailing slash from base URL', () => {
    process.env.API_URL = 'http://localhost:3001/'
    expect(getApiBaseUrl()).toBe('http://localhost:3001')
  })
})
