import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import {
  BillingReminderScheduler,
  SubscriptionExpiryScheduler,
} from './billing-reminder.scheduler'
import { FygaroWebhookController } from './fygaro-webhook.controller'
import { FygaroService } from './fygaro.service'
import { ResendBillingService } from './resend-billing.service'
import { SubscriptionService } from './subscription.service'

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [FygaroWebhookController],
  providers: [
    SubscriptionService,
    FygaroService,
    ResendBillingService,
    BillingReminderScheduler,
    SubscriptionExpiryScheduler,
  ],
  exports: [SubscriptionService, FygaroService, ResendBillingService],
})
export class BillingModule {}
