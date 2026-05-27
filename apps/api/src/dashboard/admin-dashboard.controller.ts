import { Controller, Get, UseGuards } from '@nestjs/common'
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard'
import { DashboardStatsService } from './dashboard-stats.service'

@Controller('admin/dashboard')
@UseGuards(AdminAuthGuard)
export class AdminDashboardController {
  constructor(private readonly dashboardStats: DashboardStatsService) {}

  @Get('stats')
  getStats() {
    return this.dashboardStats.getAdminStats()
  }
}
