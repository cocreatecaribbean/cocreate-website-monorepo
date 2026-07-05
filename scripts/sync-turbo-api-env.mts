/**
 * Scan apps/api for server-side env keys and sync @cocreate/api#build.env in turbo.json.
 *
 * Usage (from repo root):
 *   pnpm sync:turbo-env
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const scanRoots = [
  path.join(repoRoot, 'apps', 'api', 'src'),
  path.join(repoRoot, 'packages', 'ai-core', 'src'),
]
const turboPath = path.join(repoRoot, 'turbo.json')
const apiBuildTask = '@cocreate/api#build'

const patterns = [
  /process\.env\.([A-Z][A-Z0-9_]*)/g,
  /process\.env\[['"]([A-Z][A-Z0-9_]*)['"]\]/g,
  /(?:config|this\.config)\.get(?:<[^>]+>)?\(['"]([A-Z][A-Z0-9_]*)['"]\)/g,
  /getOrThrow(?:<[^>]+>)?\(['"]([A-Z][A-Z0-9_]*)['"]\)/g,
  /this\.env\(['"]([A-Z][A-Z0-9_]*)['"]\)/g,
]

const ignoredKeys = new Set(['NODE_ENV'])

async function walkTsFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walkTsFiles(fullPath)))
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(fullPath)
    }
  }

  return files
}

function extractKeys(source: string): Set<string> {
  const keys = new Set<string>()

  for (const pattern of patterns) {
    pattern.lastIndex = 0
    for (const match of source.matchAll(pattern)) {
      const key = match[1]
      if (key && !ignoredKeys.has(key)) {
        keys.add(key)
      }
    }
  }

  for (const match of source.matchAll(/readEnv\(([^)]*)\)/g)) {
    for (const keyMatch of match[1].matchAll(/['"]([A-Z][A-Z0-9_]*)['"]/g)) {
      const key = keyMatch[1]
      if (key && !ignoredKeys.has(key)) {
        keys.add(key)
      }
    }
  }

  return keys
}

async function collectApiEnvKeys(): Promise<string[]> {
  const keys = new Set<string>()

  for (const root of scanRoots) {
    const files = await walkTsFiles(root)
    for (const file of files) {
      const source = await readFile(file, 'utf8')
      for (const key of extractKeys(source)) {
        keys.add(key)
      }
    }
  }

  return [...keys].sort()
}

async function main() {
  const envKeys = await collectApiEnvKeys()
  const turboRaw = await readFile(turboPath, 'utf8')
  const turbo = JSON.parse(turboRaw) as {
    tasks?: Record<string, { env?: string[] } & Record<string, unknown>>
  }

  turbo.tasks ??= {}
  turbo.tasks[apiBuildTask] = {
    ...(turbo.tasks[apiBuildTask] ?? {}),
    env: envKeys,
  }

  const nextTurbo = `${JSON.stringify(turbo, null, 2)}\n`
  if (nextTurbo === turboRaw) {
    console.log(`turbo.json already in sync (${envKeys.length} API env keys).`)
    return
  }

  await writeFile(turboPath, nextTurbo, 'utf8')
  console.log(`Updated ${apiBuildTask}.env with ${envKeys.length} keys:`)
  for (const key of envKeys) {
    console.log(`  - ${key}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
