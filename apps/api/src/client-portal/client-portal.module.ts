import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ClientsModule } from '../clients/clients.module'
import { SocialListeningModule } from '../social-listening/social-listening.module'
import { ClientPortalController } from './client-portal.controller'
import { AdminClientPortalController } from './admin-client-portal.controller'
import { ClientPortalService } from './client-portal.service'

@Module({
  imports: [AuthModule, ClientsModule, SocialListeningModule],
  controllers: [ClientPortalController, AdminClientPortalController],
  providers: [ClientPortalService],
})
export class ClientPortalModule {}
