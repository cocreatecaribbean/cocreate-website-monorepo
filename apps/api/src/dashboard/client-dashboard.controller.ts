import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { ClientAuthGuard } from '../auth/guards/client-auth.guard'
import type { ClientPortalRequest } from '../auth/guards/client-auth.guard'
import { DashboardStatsService } from './dashboard-stats.service'

@Controller('client-portal/dashboard')
@UseGuards(ClientAuthGuard)
export class ClientDashboardController {
  constructor(private readonly dashboardStats: DashboardStatsService) {}

  @Get('stats')
  getStats(@Req() req: ClientPortalRequest) {
    return this.dashboardStats.getClientStats(req.clientUser!)
  }
}
