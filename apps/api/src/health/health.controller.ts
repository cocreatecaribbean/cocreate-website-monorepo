import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common'
import { getAppVersion, getGitSha } from '../build-info'
import { PrismaService } from '../prisma/prisma.service'

@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const version = getAppVersion()
    const gitSha = getGitSha()
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return {
        status: 'ok',
        database: 'connected',
        version,
        ...(gitSha ? { gitSha } : {}),
      }
    } catch {
      return {
        status: 'degraded',
        database: 'unavailable',
        version,
        ...(gitSha ? { gitSha } : {}),
      }
    }
  }
}
