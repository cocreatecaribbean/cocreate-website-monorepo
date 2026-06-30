import { Body, Controller, ForbiddenException, Get, NotFoundException, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common'
import type { Response } from 'express'
import {
  AdminCreateSetupSchema,
  type AdminCreateSetupInput,
  CancelSubscriptionSchema,
  type CancelSubscriptionInput,
  GrantSubscriptionSchema,
  type GrantSubscriptionInput,
  ListSubscriptionsQuerySchema,
  type ListSubscriptionsQueryInput,
  PatchSubscriptionSchema,
  type PatchSubscriptionInput,
} from '@cocreate/api-contracts/v1/requests/social-listening-admin'
import { AdminAuthGuard, type AdminRequest } from '../auth/guards/admin-auth.guard'
import { SocialListeningSubscriptionCancelledBy } from '@cocreate/database'
import { zodBody, zodQuery } from '../common/zod/zod-validation.pipe'
import { SocialListeningService } from '../social-listening/social-listening.service'
import { SubscriptionService } from '../billing/subscription.service'
import { ResendBillingService } from '../billing/resend-billing.service'
import { PrismaService } from '../prisma/prisma.service'
import { SocialListeningReportService } from '../social-listening/social-listening-report.service'

@Controller({ path: 'admin/social-listening', version: '1' })
@UseGuards(AdminAuthGuard)
export class SocialListeningAdminController {
  constructor(
    private readonly subscriptions: SubscriptionService,
    private readonly socialListening: SocialListeningService,
    private readonly socialListeningReports: SocialListeningReportService,
    private readonly billingEmail: ResendBillingService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('stats')
  stats() {
    return this.subscriptions.getAdminStats()
  }

  @Get('subscriptions')
  listSubscriptions(
    @Query(zodQuery(ListSubscriptionsQuerySchema)) query: ListSubscriptionsQueryInput,
  ) {
    return this.subscriptions.listAdminSubscriptions({
      status: query.status,
      plan: query.plan,
      expiringWithinDays: query.expiringSoon ? 7 : undefined,
      noActiveSetup: query.noSetup,
    })
  }

  @Get('subscriptions/:organizationId')
  async getSubscription(@Param('organizationId') organizationId: string) {
    const subscription = await this.subscriptions.getByOrganizationId(organizationId)
    const setups = await this.prisma.socialListeningSetup.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    })
    return { subscription, setups }
  }

  @Post('subscriptions')
  grantSubscription(
    @Req() req: AdminRequest,
    @Body(zodBody(GrantSubscriptionSchema)) body: GrantSubscriptionInput,
  ) {
    return this.subscriptions.grantAdminSubscription({
      organizationId: body.organizationId,
      plan: body.plan,
      billingSource: body.billingSource,
      periodMonths: body.periodMonths,
      autoRenewEnabled: body.autoRenewEnabled,
      createdByUserId: req.adminUser?.id,
    })
  }

  @Patch('subscriptions/:organizationId')
  patchSubscription(
    @Param('organizationId') organizationId: string,
    @Body(zodBody(PatchSubscriptionSchema)) body: PatchSubscriptionInput,
  ) {
    return this.subscriptions.patchAdminSubscription(organizationId, body)
  }

  @Post('subscriptions/:organizationId/cancel')
  async cancelSubscription(
    @Param('organizationId') organizationId: string,
    @Body(zodBody(CancelSubscriptionSchema)) body: CancelSubscriptionInput,
  ) {
    const updated = await this.subscriptions.cancel({
      organizationId,
      immediate: body.immediate,
      cancelledBy: SocialListeningSubscriptionCancelledBy.ADMIN,
      cancelReason: body.cancelReason,
    })

    const ownerEmail = await this.subscriptions.getOwnerEmail(organizationId)
    if (ownerEmail && updated.currentPeriodEnd) {
      await this.billingEmail.sendSubscriptionCancelled({
        subscriptionId: updated.id,
        periodEnd: updated.currentPeriodEnd,
        to: ownerEmail,
        atPeriodEnd: !body.immediate,
      })
    }

    return updated
  }

  @Get('setups')
  listSetups(@Query('organizationId') organizationId?: string) {
    return this.prisma.socialListeningSetup.findMany({
      where: organizationId ? { organizationId } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        organization: { select: { id: true, name: true, slug: true } },
      },
    })
  }

  @Post('setups')
  createSetup(
    @Req() req: AdminRequest,
    @Body(zodBody(AdminCreateSetupSchema)) body: AdminCreateSetupInput,
  ) {
    return this.socialListening.createListeningSetup({
      organizationId: body.organizationId,
      dto: body,
      actor: 'ADMIN',
      userId: req.adminUser?.id,
    })
  }

  @Post('setups/:setupId/archive')
  async archiveSetup(@Param('setupId') setupId: string) {
    return this.prisma.socialListeningSetup.update({
      where: { id: setupId },
      data: { status: 'ARCHIVED' },
    })
  }

  @Get('organizations/:organizationId/analytics')
  async getAnalytics(
    @Param('organizationId') organizationId: string,
    @Query('asOf') asOf?: string,
  ) {
    const organization = await this.requireSubscriberOrganization(organizationId)
    return this.socialListening.getAnalyticsForOrganization(organization, asOf)
  }

  @Get('organizations/:organizationId/analytics/snapshots')
  async listSnapshotDates(
    @Param('organizationId') organizationId: string,
    @Query('limit') limit?: string,
  ) {
    await this.requireSubscriberOrganization(organizationId)
    return this.socialListening.listSnapshotDatesForOrganization(
      organizationId,
      limit ? Number.parseInt(limit, 10) : undefined,
    )
  }

  @Get('organizations/:organizationId/analytics/compare')
  async compareAnalytics(
    @Param('organizationId') organizationId: string,
    @Query('baseline') baseline: string,
    @Query('current') current?: string,
  ) {
    const organization = await this.requireSubscriberOrganization(organizationId)
    return this.socialListening.compareForOrganization(organization, baseline, current)
  }

  @Get('organizations/:organizationId/reports/templates')
  listReportTemplates() {
    return this.socialListeningReports.listTemplates()
  }

  @Post('organizations/:organizationId/reports/generate')
  async generateReport(
    @Param('organizationId') organizationId: string,
    @Res() res: Response,
    @Query('templateId') templateId: string,
    @Query('asOf') asOf?: string,
    @Query('baseline') baseline?: string,
    @Query('current') current?: string,
  ) {
    const organization = await this.requireSubscriberOrganization(organizationId)
    const { buffer, filename } =
      await this.socialListeningReports.generatePdfForOrganization(
        {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          logoUrl: organization.logoUrl,
          brand24ProjectId: organization.brand24ProjectId,
        },
        templateId,
        asOf,
        baseline,
        current,
      )

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  }

  private async requireSubscriberOrganization(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        isSocialListeningSubscriber: true,
        brand24ProjectId: true,
      },
    })

    if (!organization) {
      throw new NotFoundException('Organization not found')
    }

    if (!organization.isSocialListeningSubscriber) {
      throw new ForbiddenException(
        'Social Listening is not enabled for this organization',
      )
    }

    return organization
  }
}
