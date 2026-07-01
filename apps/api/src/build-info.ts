import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function readMonorepoVersion(): string | null {
  try {
    const packagePath = join(__dirname, '../../../package.json')
    const pkg = JSON.parse(readFileSync(packagePath, 'utf8')) as { version?: string }
    return pkg.version ?? null
  } catch {
    return null
  }
}

export function getAppVersion(): string {
  return process.env.APP_VERSION ?? readMonorepoVersion() ?? '0.0.0'
}

export function getGitSha(): string | null {
  return (
    process.env.GIT_SHA ??
    process.env.RAILWAY_GIT_COMMIT_SHA ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    null
  )
}
