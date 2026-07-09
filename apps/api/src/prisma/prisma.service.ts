import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@cocreate/database'
import { Pool } from 'pg'
import { softDeleteExtension } from './prisma-extensions'
import { tenantScopeExtension } from './tenant-scope.extension'
import { tenantContext } from './tenant-context'

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
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    })
    const adapter = new PrismaPg(pool)

    super({ adapter })
    this.pool = pool

    const extended = this.$extends(softDeleteExtension()).$extends(
      tenantScopeExtension(() => tenantContext.getOrganizationId()),
    )
    Object.assign(this, extended)
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
    await this.pool.end()
  }
}
