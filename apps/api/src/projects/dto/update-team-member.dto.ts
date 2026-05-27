import { IsBoolean, IsEnum, IsOptional } from 'class-validator'
import { ClientOrgRole } from '@cocreate/database'

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsEnum(ClientOrgRole)
  clientOrgRole?: ClientOrgRole

  @IsOptional()
  @IsBoolean()
  canAccessSocialListening?: boolean
}
