/**
 * Promote an existing agency admin to SUPER_ADMIN.
 *
 * Usage:
 *   pnpm --filter @cocreate/database exec node scripts/promote-super-admin.mts you@agency.com
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { PrismaClient, UserRole } from '../generated/client/index.js'

const packageRoot = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.join(packageRoot, '..', '.env') })

const email = process.argv
  .slice(2)
  .find((arg) => arg.includes('@'))
  ?.trim()
  .toLowerCase()

if (!email) {
  console.error('Usage: node scripts/promote-super-admin.mts your-admin@email.com')
  process.exit(1)
}

const connectionString =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? ''

if (!connectionString) {
  console.error('Missing DIRECT_URL or DATABASE_URL')
  process.exit(1)
}

const pool = new Pool({ connectionString })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

try {
  const user = await prisma.user.update({
    where: { email },
    data: { role: UserRole.SUPER_ADMIN },
  })
  console.log(`Promoted to SUPER_ADMIN: ${user.email}`)
} catch (error) {
  console.error('Failed:', error)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
  await pool.end()
}

if (process.exitCode === 1) process.exit(1)
