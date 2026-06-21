import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator'
import {
  SocialListeningBillingSource,
  SocialListeningPlan,
  SocialListeningSubscriptionStatus,
} from '@cocreate/database'

export class GrantSubscriptionDto {
  @IsString()
  organizationId!: string

  @IsEnum(SocialListeningPlan)
  plan!: SocialListeningPlan

  @IsEnum(SocialListeningBillingSource)
  billingSource!: SocialListeningBillingSource

  @IsOptional()
  @IsInt()
  @Min(1)
  periodMonths?: number

  @IsOptional()
  @IsBoolean()
  autoRenewEnabled?: boolean
}

export class PatchSubscriptionDto {
  @IsOptional()
  @IsEnum(SocialListeningPlan)
  plan?: SocialListeningPlan

  @IsOptional()
  @IsInt()
  @Min(1)
  extendMonths?: number

  @IsOptional()
  @IsBoolean()
  autoRenewEnabled?: boolean
}

export class CancelSubscriptionDto {
  @IsBoolean()
  immediate!: boolean

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  cancelReason?: string
}

export class ListSubscriptionsQueryDto {
  @IsOptional()
  @IsEnum(SocialListeningSubscriptionStatus)
  status?: SocialListeningSubscriptionStatus

  @IsOptional()
  @IsEnum(SocialListeningPlan)
  plan?: SocialListeningPlan

  @IsOptional()
  @IsBoolean()
  expiringSoon?: boolean

  @IsOptional()
  @IsBoolean()
  noSetup?: boolean
}
