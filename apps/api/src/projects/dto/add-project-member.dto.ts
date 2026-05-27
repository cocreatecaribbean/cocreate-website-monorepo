import { IsEmail, IsEnum } from 'class-validator'
import { ClientProjectAccessLevel } from '@cocreate/database'

export class AddProjectMemberDto {
  @IsEmail()
  email!: string

  @IsEnum(ClientProjectAccessLevel)
  access!: ClientProjectAccessLevel
}
