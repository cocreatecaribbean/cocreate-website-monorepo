import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator'
import type { SocialListeningPlanId } from '@cocreate/social-listening-plans'

export class SubscribeDto {
  @IsIn(['pulse', 'growth', 'scale'])
  plan!: SocialListeningPlanId
}

export class ToggleAutoRenewDto {
  @IsBoolean()
  enabled!: boolean
}

export class CancelSubscriptionClientDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  cancelReason?: string
}
