import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ProjectsModule } from '../projects/projects.module'
import { AdminDashboardController } from './admin-dashboard.controller'
import { ClientDashboardController } from './client-dashboard.controller'
import { DashboardStatsService } from './dashboard-stats.service'

@Module({
  imports: [AuthModule, ProjectsModule],
  controllers: [ClientDashboardController, AdminDashboardController],
  providers: [DashboardStatsService],
  exports: [DashboardStatsService],
})
export class DashboardModule {}
