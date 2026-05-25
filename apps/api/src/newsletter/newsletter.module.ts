import { Module } from '@nestjs/common'
import { NewsletterController } from './newsletter.controller'
import { NewsletterService } from './newsletter.service'
import { ResendNewsletterService } from './resend-newsletter.service'

@Module({
  controllers: [NewsletterController],
  providers: [NewsletterService, ResendNewsletterService],
  exports: [NewsletterService],
})
export class NewsletterModule {}
