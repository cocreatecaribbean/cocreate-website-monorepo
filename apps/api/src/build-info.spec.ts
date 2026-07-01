/** @jest-environment node */
import { getAppVersion, getGitSha } from './build-info'

describe('build-info', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.APP_VERSION
    delete process.env.GIT_SHA
    delete process.env.RAILWAY_GIT_COMMIT_SHA
    delete process.env.VERCEL_GIT_COMMIT_SHA
    delete process.env.GITHUB_SHA
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('getAppVersion reads monorepo root package.json when APP_VERSION is unset', () => {
    expect(getAppVersion()).toBe('0.2.0')
  })

  it('getAppVersion prefers APP_VERSION env', () => {
    process.env.APP_VERSION = '9.9.9'
    expect(getAppVersion()).toBe('9.9.9')
  })

  it('getGitSha returns null when no deploy env is set', () => {
    expect(getGitSha()).toBeNull()
  })

  it('getGitSha prefers GIT_SHA env', () => {
    process.env.GIT_SHA = 'abc123'
    expect(getGitSha()).toBe('abc123')
  })
})
