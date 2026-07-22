import { Global, Module, forwardRef } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { AuthModule } from '../auth/auth.module'
import { OrgInboxModule } from '../org-inbox/org-inbox.module'
import { ProjectsModule } from '../projects/projects.module'
import { ProjectNotificationMailService } from '../projects/project-notification-mail.service'
import { MessageEmailDigestScheduler } from './message-email-digest.scheduler'
import { MessageEmailDigestService } from './message-email-digest.service'
import { MessagingEmitService } from './messaging-emit.service'
import { MessagingGateway } from './messaging.gateway'
import { MessagingPresenceService } from './messaging-presence.service'

@Global()
@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    forwardRef(() => ProjectsModule),
    forwardRef(() => OrgInboxModule),
  ],
  providers: [
    MessagingGateway,
    MessagingEmitService,
    MessagingPresenceService,
    MessageEmailDigestService,
    MessageEmailDigestScheduler,
    // Digest emails reuse the project notification Resend client
    ProjectNotificationMailService,
  ],
  exports: [
    MessagingEmitService,
    MessagingPresenceService,
    MessageEmailDigestService,
  ],
})
export class MessagingModule {}
