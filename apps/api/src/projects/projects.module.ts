import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { AdminProjectsController } from './admin-projects.controller'
import { ClientProjectsController } from './client-projects.controller'
import { ProjectNotificationMailService } from './project-notification-mail.service'
import { ProjectNotificationsService } from './project-notifications.service'
import { ProjectStorageService } from './project-storage.service'
import { ProjectsService } from './projects.service'

@Module({
  imports: [AuthModule],
  controllers: [ClientProjectsController, AdminProjectsController],
  providers: [
    ProjectsService,
    ProjectStorageService,
    ProjectNotificationsService,
    ProjectNotificationMailService,
  ],
  exports: [ProjectsService],
})
export class ProjectsModule {}
