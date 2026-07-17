import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ThreadSummaryModule } from '../messaging-summary/thread-summary.module'
import { AdminProjectsController } from './admin-projects.controller'
import { ClientProjectsController } from './client-projects.controller'
import { ProjectNotificationMailService } from './project-notification-mail.service'
import { ProjectNotificationsService } from './project-notifications.service'
import { ProjectStorageService } from './project-storage.service'
import { OrganizationBrandAssetsService } from './organization-brand-assets.service'
import { ProjectsService } from './projects.service'
import { ProjectFileReactionsService } from './project-file-reactions.service'
import { ClientTeamService } from './client-team.service'
import { ClientTeamController } from './client-team.controller'
import { AdminClientTeamController } from './admin-client-team.controller'
import { AdminAgencyCollaboratorsController } from './admin-agency-collaborators.controller'
import { AdminCollaboratorsController } from './admin-collaborators.controller'
import { AgencyCollaboratorsService } from './agency-collaborators.service'

@Module({
  imports: [AuthModule, ThreadSummaryModule],
  controllers: [
    ClientProjectsController,
    AdminProjectsController,
    ClientTeamController,
    AdminClientTeamController,
    AdminAgencyCollaboratorsController,
    AdminCollaboratorsController,
  ],
  providers: [
    ProjectsService,
    ProjectFileReactionsService,
    AgencyCollaboratorsService,
    OrganizationBrandAssetsService,
    ClientTeamService,
    ProjectStorageService,
    ProjectNotificationsService,
    ProjectNotificationMailService,
  ],
  exports: [
    ProjectsService,
    ProjectFileReactionsService,
    ClientTeamService,
    ProjectNotificationsService,
    ProjectStorageService,
  ],
})
export class ProjectsModule {}
