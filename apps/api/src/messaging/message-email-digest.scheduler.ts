import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { MessageEmailDigestService } from './message-email-digest.service'

@Injectable()
export class MessageEmailDigestScheduler {
  private readonly logger = new Logger(MessageEmailDigestScheduler.name)

  constructor(private readonly digests: MessageEmailDigestService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async flushDueDigests(): Promise<void> {
    try {
      const sent = await this.digests.processDueDigests()
      if (sent > 0) {
        this.logger.log(`Sent ${sent} message email digest(s)`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`Digest cron failed: ${message}`)
    }
  }
}
