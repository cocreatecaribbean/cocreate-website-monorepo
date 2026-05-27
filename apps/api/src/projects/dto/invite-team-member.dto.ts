import { IsBoolean, IsEmail, IsEnum, IsOptional } from 'class-validator'
import { ClientOrgRole } from '@cocreate/database'

export class InviteTeamMemberDto {
  @IsEmail()
  email!: string

  @IsEnum(ClientOrgRole)
  clientOrgRole!: ClientOrgRole

  @IsOptional()
  @IsBoolean()
  canAccessSocialListening?: boolean
}
