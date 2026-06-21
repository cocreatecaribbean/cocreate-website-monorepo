import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { BillingModule } from '../billing/billing.module'
import { SocialListeningModule } from '../social-listening/social-listening.module'
import { SocialListeningAdminController } from './social-listening-admin.controller'

@Module({
  imports: [AuthModule, BillingModule, SocialListeningModule],
  controllers: [SocialListeningAdminController],
})
export class SocialListeningAdminModule {}
