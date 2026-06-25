import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard'
import { ProjectsService } from '../projects/projects.service'
import { DashboardStatsService } from './dashboard-stats.service'

@Controller({ path: 'admin/dashboard', version: '1' })
@UseGuards(AdminAuthGuard)
export class AdminDashboardController {
  constructor(
    private readonly dashboardStats: DashboardStatsService,
    private readonly projects: ProjectsService,
  ) {}

  @Get('stats')
  getStats() {
    return this.dashboardStats.getAdminStats()
  }

  @Get('recent-activity')
  getRecentActivity(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 15
    const capped = Number.isFinite(parsed) ? Math.min(25, Math.max(1, parsed)) : 15
    return this.projects.listRecentActivityForAdmin(capped)
  }
}
