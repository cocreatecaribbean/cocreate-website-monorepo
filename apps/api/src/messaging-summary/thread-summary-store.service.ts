import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import type { ThreadSummarySourceType } from '@cocreate/message-summary'
import { Prisma } from '@cocreate/database'
import { PrismaService } from '../prisma/prisma.service'

const WINDOW_MS = 60 * 60 * 1000
const MAX_GENERATIONS_PER_WINDOW = 10

@Injectable()
export class ThreadSummaryRateLimitService {
  private readonly buckets = new Map<string, number[]>()

  assertWithinLimit(userId: string): void {
    const now = Date.now()
    const recent = (this.buckets.get(userId) ?? []).filter(
      (timestamp) => now - timestamp < WINDOW_MS,
    )
    if (recent.length >= MAX_GENERATIONS_PER_WINDOW) {
      throw new HttpException(
        'Summary generation limit reached. Try again in about an hour.',
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }
    recent.push(now)
    this.buckets.set(userId, recent)
  }
}

export type StoredThreadSummary = {
  id: string
  sourceType: ThreadSummarySourceType
  sourceId: string
  messageCount: number
  lastMessageAt: Date
  content: unknown
  model: string
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class ThreadSummaryStoreService {
  constructor(private readonly prisma: PrismaService) {}

  async findCached(
    sourceType: ThreadSummarySourceType,
    sourceId: string,
  ): Promise<StoredThreadSummary | null> {
    const row = await this.prisma.threadSummary.findUnique({
      where: {
        sourceType_sourceId: { sourceType, sourceId },
      },
    })
    return row as StoredThreadSummary | null
  }

  async upsert(options: {
    sourceType: ThreadSummarySourceType
    sourceId: string
    messageCount: number
    lastMessageAt: Date
    content: unknown
    model: string
  }): Promise<StoredThreadSummary> {
    const content = options.content as Prisma.InputJsonValue
    const row = await this.prisma.threadSummary.upsert({
      where: {
        sourceType_sourceId: {
          sourceType: options.sourceType,
          sourceId: options.sourceId,
        },
      },
      create: {
        sourceType: options.sourceType,
        sourceId: options.sourceId,
        messageCount: options.messageCount,
        lastMessageAt: options.lastMessageAt,
        content,
        model: options.model,
      },
      update: {
        messageCount: options.messageCount,
        lastMessageAt: options.lastMessageAt,
        content,
        model: options.model,
      },
    })
    return row as StoredThreadSummary
  }

  async invalidate(
    sourceType: ThreadSummarySourceType,
    sourceId: string,
  ): Promise<void> {
    await this.prisma.threadSummary.deleteMany({
      where: { sourceType, sourceId },
    })
  }
}
