import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import {
  ThreadSummaryRateLimitService,
  ThreadSummaryStoreService,
} from './thread-summary-store.service'

@Module({
  imports: [PrismaModule],
  providers: [ThreadSummaryStoreService, ThreadSummaryRateLimitService],
  exports: [ThreadSummaryStoreService, ThreadSummaryRateLimitService],
})
export class ThreadSummaryModule {}
