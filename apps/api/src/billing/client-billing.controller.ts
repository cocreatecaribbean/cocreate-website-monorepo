import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ClientAuthGuard, type ClientPortalRequest } from '../auth/guards/client-auth.guard'
import { ClientOrgRole, SocialListeningSubscriptionCancelledBy } from '@cocreate/database'
import { FygaroService } from './fygaro.service'
import { ResendBillingService } from './resend-billing.service'
import { SubscriptionService } from './subscription.service'
import {
  CancelSubscriptionClientDto,
  SubscribeDto,
  ToggleAutoRenewDto,
} from './dto/client-billing.dto'

@Controller({ path: 'client-portal/social-listening', version: '1' })
@UseGuards(ClientAuthGuard)
export class ClientBillingController {
  constructor(
    private readonly subscriptions: SubscriptionService,
    private readonly fygaro: FygaroService,
    private readonly billingEmail: ResendBillingService,
  ) {}

  private assertOwner(request: ClientPortalRequest) {
    const client = request.clientUser!
    if (client.clientOrgRole !== ClientOrgRole.OWNER) {
      throw new ForbiddenException('Only organization owners can manage billing')
    }
    return client
  }

  @Get('subscription')
  async getSubscription(@Req() request: ClientPortalRequest) {
    const client = request.clientUser!
    const subscription = await this.subscriptions.getByOrganizationId(
      client.organization!.id,
    )
    return {
      subscription: this.subscriptions.formatSubscriptionForClient(subscription),
    }
  }

  @Post('subscribe')
  async subscribe(@Req() request: ClientPortalRequest, @Body() dto: SubscribeDto) {
    const client = this.assertOwner(request)
    const organizationId = client.organization!.id

    const subscription = await this.subscriptions.createPendingFygaroSubscription({
      organizationId,
      planId: dto.plan,
      createdByUserId: client.id,
    })

    if (!this.fygaro.isConfigured()) {
      return {
        ok: false as const,
        message: 'Online checkout is not configured yet. Contact CoCreate to activate your plan.',
      }
    }

    const checkoutUrl = this.fygaro.buildCheckoutUrlForPlanId({
      subscriptionId: subscription.id,
      planId: dto.plan,
      eventType: 'initial',
    })

    return { ok: true as const, checkoutUrl, subscriptionId: subscription.id }
  }

  @Post('subscription/renew')
  async renew(@Req() request: ClientPortalRequest) {
    const client = this.assertOwner(request)
    const subscription = await this.subscriptions.getByOrganizationId(
      client.organization!.id,
    )
    if (!subscription) {
      return { ok: false as const, message: 'No subscription found' }
    }

    const checkoutUrl = this.fygaro.buildCheckoutUrl({
      subscriptionId: subscription.id,
      plan: subscription.plan,
      eventType: 'manual_renewal',
    })

    return { ok: true as const, checkoutUrl }
  }

  @Post('subscription/update-payment')
  async updatePayment(@Req() request: ClientPortalRequest) {
    const client = this.assertOwner(request)
    const subscription = await this.subscriptions.getByOrganizationId(
      client.organization!.id,
    )
    if (!subscription) {
      return { ok: false as const, message: 'No subscription found' }
    }

    const checkoutUrl = this.fygaro.buildCheckoutUrl({
      subscriptionId: subscription.id,
      plan: subscription.plan,
      eventType: 'update_payment',
    })

    return { ok: true as const, checkoutUrl }
  }

  @Patch('subscription/auto-renew')
  async toggleAutoRenew(
    @Req() request: ClientPortalRequest,
    @Body() dto: ToggleAutoRenewDto,
  ) {
    const client = this.assertOwner(request)
    const updated = await this.subscriptions.toggleAutoRenew(
      client.organization!.id,
      dto.enabled,
      SocialListeningSubscriptionCancelledBy.CLIENT,
    )
    return {
      subscription: this.subscriptions.formatSubscriptionForClient(updated),
    }
  }

  @Post('subscription/cancel')
  async cancel(
    @Req() request: ClientPortalRequest,
    @Body() dto: CancelSubscriptionClientDto,
  ) {
    const client = this.assertOwner(request)
    const organizationId = client.organization!.id
    const updated = await this.subscriptions.cancel({
      organizationId,
      immediate: false,
      cancelledBy: SocialListeningSubscriptionCancelledBy.CLIENT,
      cancelReason: dto.cancelReason,
    })

    const ownerEmail = await this.subscriptions.getOwnerEmail(organizationId)
    if (ownerEmail && updated.currentPeriodEnd) {
      await this.billingEmail.sendSubscriptionCancelled({
        subscriptionId: updated.id,
        periodEnd: updated.currentPeriodEnd,
        to: ownerEmail,
        atPeriodEnd: true,
      })
    }

    return {
      subscription: this.subscriptions.formatSubscriptionForClient(updated),
    }
  }
}
