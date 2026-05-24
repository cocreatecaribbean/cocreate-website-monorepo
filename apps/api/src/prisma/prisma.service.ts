import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@cocreate/database'
import { Pool } from 'pg'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool

  constructor(config: ConfigService) {
    const connectionString = config.getOrThrow<string>('DATABASE_URL')
    const pool = new Pool({
      connectionString,
      // Keep below Supabase Supavisor pool size per instance (see docs/supabase-database-setup.md)
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    })
    const adapter = new PrismaPg(pool)

    super({ adapter })
    this.pool = pool
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
    await this.pool.end()
  }
}
