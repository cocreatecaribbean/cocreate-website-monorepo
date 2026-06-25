import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return { status: 'ok', database: 'connected' }
    } catch {
      return { status: 'degraded', database: 'unavailable' }
    }
  }
}
