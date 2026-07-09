import { Global, Module, forwardRef } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { OrgInboxModule } from '../org-inbox/org-inbox.module'
import { ProjectsModule } from '../projects/projects.module'
import { MessagingEmitService } from './messaging-emit.service'
import { MessagingGateway } from './messaging.gateway'

@Global()
@Module({
  imports: [
    AuthModule,
    forwardRef(() => ProjectsModule),
    forwardRef(() => OrgInboxModule),
  ],
  providers: [MessagingGateway, MessagingEmitService],
  exports: [MessagingEmitService],
})
export class MessagingModule {}
