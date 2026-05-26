import { IsEnum, IsOptional } from 'class-validator'
import { ProjectRequestStatus } from '@cocreate/database'

export class UpdateRequestDto {
  @IsEnum(ProjectRequestStatus)
  status!: ProjectRequestStatus
}
