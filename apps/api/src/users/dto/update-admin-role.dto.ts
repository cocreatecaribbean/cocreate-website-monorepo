import { UserRole } from '@cocreate/database'
import { IsEnum } from 'class-validator'

export class UpdateAdminRoleDto {
  @IsEnum(UserRole)
  role!: UserRole
}
