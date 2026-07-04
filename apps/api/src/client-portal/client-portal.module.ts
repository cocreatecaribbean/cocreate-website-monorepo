import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { BillingModule } from '../billing/billing.module'
import { ClientsModule } from '../clients/clients.module'
import { SocialListeningModule } from '../social-listening/social-listening.module'
import { UsersModule } from '../users/users.module'
import { ClientBillingController } from '../billing/client-billing.controller'
import { ClientPortalController } from './client-portal.controller'
import { AdminClientPortalController } from './admin-client-portal.controller'
import { ClientPortalService } from './client-portal.service'

@Module({
  imports: [AuthModule, ClientsModule, SocialListeningModule, BillingModule, UsersModule],
  controllers: [ClientPortalController, AdminClientPortalController, ClientBillingController],
  providers: [ClientPortalService],
})
export class ClientPortalModule {}
