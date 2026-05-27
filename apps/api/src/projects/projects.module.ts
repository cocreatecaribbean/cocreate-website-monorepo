import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { AdminProjectsController } from './admin-projects.controller'
import { ClientProjectsController } from './client-projects.controller'
import { ProjectNotificationMailService } from './project-notification-mail.service'
import { ProjectNotificationsService } from './project-notifications.service'
import { ProjectStorageService } from './project-storage.service'
import { ProjectsService } from './projects.service'
import { ClientTeamService } from './client-team.service'
import { ClientTeamController } from './client-team.controller'
import { AdminClientTeamController } from './admin-client-team.controller'

@Module({
  imports: [AuthModule],
  controllers: [
    ClientProjectsController,
    AdminProjectsController,
    ClientTeamController,
    AdminClientTeamController,
  ],
  providers: [
    ProjectsService,
    ClientTeamService,
    ProjectStorageService,
    ProjectNotificationsService,
    ProjectNotificationMailService,
  ],
  exports: [ProjectsService, ClientTeamService],
})
export class ProjectsModule {}
