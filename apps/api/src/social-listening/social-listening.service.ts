import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { AuthenticatedClient } from '../auth/auth.service'
import { Brand24Service } from './brand24.service'
import type { SocialListeningAnalyticsResponse } from './social-listening.types'

@Injectable()
export class SocialListeningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly brand24: Brand24Service,
  ) {}

  async getAnalyticsForClient(
    client: AuthenticatedClient,
  ): Promise<SocialListeningAnalyticsResponse> {
    const organizationId = client.organization?.id
    if (!organizationId) {
      throw new ForbiddenException('No organization linked to this account')
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        isSocialListeningSubscriber: true,
        brand24ProjectId: true,
      },
    })

    if (!organization) {
      throw new NotFoundException('Organization not found')
    }

    if (!organization.isSocialListeningSubscriber) {
      throw new ForbiddenException('Social Listening is not enabled for this organization')
    }

    const { data, source } = await this.brand24.fetchAnalytics(
      organization.id,
      organization.brand24ProjectId,
    )

    return {
      ok: true,
      data,
      meta: {
        source,
        organizationId: organization.id,
        brand24ProjectId: organization.brand24ProjectId,
        fetchedAt: new Date().toISOString(),
      },
    }
  }
}
