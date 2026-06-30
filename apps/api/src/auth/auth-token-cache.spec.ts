import { AuthTokenCache } from './auth-token-cache'

describe('AuthTokenCache', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('stores and returns cached values within TTL', () => {
    const cache = new AuthTokenCache<string>()
    cache.set('token-a', 'user-1')

    expect(cache.get('token-a')).toBe('user-1')
  })

  it('expires entries after TTL', () => {
    const cache = new AuthTokenCache<string>(1_000)
    cache.set('token-a', 'user-1')

    jest.advanceTimersByTime(1_001)

    expect(cache.get('token-a')).toBeUndefined()
  })

  it('uses stable hashed keys for the same token', () => {
    const keyA = AuthTokenCache.tokenKey('same-token')
    const keyB = AuthTokenCache.tokenKey('same-token')
    const keyC = AuthTokenCache.tokenKey('other-token')

    expect(keyA).toBe(keyB)
    expect(keyA).not.toBe(keyC)
  })
})
