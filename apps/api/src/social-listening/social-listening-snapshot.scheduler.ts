import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { SocialListeningSnapshotService } from './social-listening-snapshot.service'

@Injectable()
export class SocialListeningSnapshotScheduler {
  private readonly logger = new Logger(SocialListeningSnapshotScheduler.name)

  constructor(private readonly snapshots: SocialListeningSnapshotService) {}

  /** 02:00 UTC on the 1st of each month — captures the previous complete calendar month. */
  @Cron('0 0 2 1 * *')
  async captureMonthlySnapshots(): Promise<void> {
    if (!this.snapshots.isEnabled()) return
    this.logger.log('Running monthly social listening snapshot capture')
    await this.snapshots.captureAllSubscriberSnapshots()
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async pruneOldSnapshots(): Promise<void> {
    if (!this.snapshots.isEnabled()) return
    await this.snapshots.pruneRetention()
  }
}
