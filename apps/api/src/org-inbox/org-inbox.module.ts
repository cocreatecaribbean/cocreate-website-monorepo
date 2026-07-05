import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ThreadSummaryModule } from '../messaging-summary/thread-summary.module'
import { ProjectsModule } from '../projects/projects.module'
import { AdminOrgInboxController } from './admin-org-inbox.controller'
import { ClientOrgInboxController } from './client-org-inbox.controller'
import { OrgInboxService } from './org-inbox.service'

@Module({
  imports: [AuthModule, ProjectsModule, ThreadSummaryModule],
  controllers: [ClientOrgInboxController, AdminOrgInboxController],
  providers: [OrgInboxService],
  exports: [OrgInboxService],
})
export class OrgInboxModule {}
