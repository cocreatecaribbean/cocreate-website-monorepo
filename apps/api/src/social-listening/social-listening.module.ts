import { Module } from '@nestjs/common'
import { Brand24Service } from './brand24.service'
import { SocialListeningService } from './social-listening.service'

@Module({
  providers: [Brand24Service, SocialListeningService],
  exports: [SocialListeningService],
})
export class SocialListeningModule {}
