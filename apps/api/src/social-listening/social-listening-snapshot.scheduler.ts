import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { SocialListeningSnapshotService } from './social-listening-snapshot.service'

@Injectable()
export class SocialListeningSnapshotScheduler {
  private readonly logger = new Logger(SocialListeningSnapshotScheduler.name)

  constructor(private readonly snapshots: SocialListeningSnapshotService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async captureDailySnapshots(): Promise<void> {
    if (!this.snapshots.isEnabled()) return
    this.logger.log('Running daily social listening snapshot capture')
    await this.snapshots.captureAllSubscriberSnapshots()
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async pruneOldSnapshots(): Promise<void> {
    if (!this.snapshots.isEnabled()) return
    await this.snapshots.pruneRetention()
  }
}
