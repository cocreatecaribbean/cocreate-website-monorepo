import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { Brand24Service } from './brand24.service'
import { SocialListeningSnapshotScheduler } from './social-listening-snapshot.scheduler'
import { SocialListeningSnapshotService } from './social-listening-snapshot.service'
import { SocialListeningReportService } from './social-listening-report.service'
import { SocialListeningService } from './social-listening.service'

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    Brand24Service,
    SocialListeningSnapshotService,
    SocialListeningSnapshotScheduler,
    SocialListeningService,
    SocialListeningReportService,
  ],
  exports: [
    SocialListeningService,
    SocialListeningSnapshotService,
    SocialListeningReportService,
  ],
})
export class SocialListeningModule {}
