import path from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv'
import { defineConfig } from 'prisma/config'

const packageRoot = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(packageRoot, '.env')
if (existsSync(envPath)) {
  loadEnv({ path: envPath })
}

/** Prisma CLI / migrations — prefer direct Supabase session URL when set. */
const migrationUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/cocreate?schema=public'

export default defineConfig({
  earlyAccess: true,
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: migrationUrl,
  },
})
