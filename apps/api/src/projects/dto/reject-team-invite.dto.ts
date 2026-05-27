import { IsOptional, IsString, MaxLength } from 'class-validator'

export class RejectTeamInviteDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string
}
