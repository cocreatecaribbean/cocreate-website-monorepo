import { IsEmail, IsEnum } from 'class-validator'
import { ClientOrgRole } from '@cocreate/database'

export class RequestTeamInviteDto {
  @IsEmail()
  email!: string

  @IsEnum(ClientOrgRole)
  clientOrgRole!: ClientOrgRole
}
