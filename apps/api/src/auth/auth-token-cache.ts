import { createHash } from 'node:crypto'

const DEFAULT_TTL_MS = 60_000

type CacheEntry<T> = { value: T; expiresAt: number }

export class AuthTokenCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>()

  constructor(private readonly ttlMs = DEFAULT_TTL_MS) {}

  static tokenKey(accessToken: string): string {
    return createHash('sha256').update(accessToken).digest('hex')
  }

  get(accessToken: string): T | undefined {
    const key = AuthTokenCache.tokenKey(accessToken)
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry.value
  }

  set(accessToken: string, value: T): void {
    const key = AuthTokenCache.tokenKey(accessToken)
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs })
  }
}
