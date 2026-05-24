/**
 * Seed the first agency admin user in Prisma.
 *
 * Usage (from repo root):
 *   pnpm --filter @cocreate/database seed:admin traile@cocreatecaribbean.com
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { PrismaClient, UserRole, UserStatus } from '../generated/client/index.js'

const packageRoot = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.join(packageRoot, '..', '.env') })

const email = process.argv
  .slice(2)
  .find((arg) => arg.includes('@'))
  ?.trim()
  .toLowerCase()

if (!email) {
  console.error(
    'Usage: pnpm --filter @cocreate/database seed:admin your-admin@email.com',
  )
  process.exit(1)
}

const connectionString =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? ''

if (!connectionString) {
  console.error(
    'Missing DIRECT_URL or DATABASE_URL in packages/database/.env',
  )
  process.exit(1)
}

const pool = new Pool({ connectionString })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

try {
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      role: UserRole.ADMIN,
      status: UserStatus.INVITED,
    },
    update: {
      role: UserRole.ADMIN,
      status: UserStatus.INVITED,
    },
  })

  console.log(`Admin user ready: ${user.email} (${user.id})`)
  console.log('Sign in at http://localhost:3002/login with this email.')
} catch (error) {
  console.error('Failed to seed admin user:', error)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
  await pool.end()
}

if (process.exitCode === 1) {
  process.exit(1)
}
