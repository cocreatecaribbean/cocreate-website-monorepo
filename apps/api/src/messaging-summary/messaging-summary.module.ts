import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { OrgInboxModule } from '../org-inbox/org-inbox.module'
import { ProjectsModule } from '../projects/projects.module'
import { AdminThreadSummaryController } from './admin-thread-summary.controller'
import { AiConfigService } from './ai-config.service'
import { ClientThreadSummaryController } from './client-thread-summary.controller'
import { MessagingSummaryService } from './messaging-summary.service'
import { ThreadSummaryModule } from './thread-summary.module'

@Module({
  imports: [AuthModule, ThreadSummaryModule, ProjectsModule, OrgInboxModule],
  controllers: [AdminThreadSummaryController, ClientThreadSummaryController],
  providers: [AiConfigService, MessagingSummaryService],
  exports: [MessagingSummaryService],
})
export class MessagingSummaryModule {}
