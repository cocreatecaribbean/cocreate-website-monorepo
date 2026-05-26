import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { ClientProjectPhase } from '@cocreate/database'

export class CreatePhaseApprovalDto {
  @IsEnum(ClientProjectPhase)
  targetPhase!: ClientProjectPhase

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  description?: string
}
