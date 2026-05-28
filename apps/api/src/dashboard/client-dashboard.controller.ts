import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common'
import { ClientAuthGuard } from '../auth/guards/client-auth.guard'
import type { ClientPortalRequest } from '../auth/guards/client-auth.guard'
import { ProjectsService } from '../projects/projects.service'
import { DashboardStatsService } from './dashboard-stats.service'

@Controller('client-portal/dashboard')
@UseGuards(ClientAuthGuard)
export class ClientDashboardController {
  constructor(
    private readonly dashboardStats: DashboardStatsService,
    private readonly projects: ProjectsService,
  ) {}

  @Get('stats')
  getStats(@Req() req: ClientPortalRequest) {
    return this.dashboardStats.getClientStats(req.clientUser!)
  }

  @Get('recent-activity')
  getRecentActivity(@Req() req: ClientPortalRequest, @Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 15
    const capped = Number.isFinite(parsed) ? Math.min(25, Math.max(1, parsed)) : 15
    return this.projects.listRecentActivityForClient(req.clientUser!, capped)
  }
}
