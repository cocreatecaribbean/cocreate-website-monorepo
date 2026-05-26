import { IsEnum, IsOptional } from 'class-validator'
import { ClientProjectPhase, ClientProjectStatus } from '@cocreate/database'

export class UpdateProjectDto {
  @IsOptional()
  @IsEnum(ClientProjectStatus)
  status?: ClientProjectStatus

  @IsOptional()
  @IsEnum(ClientProjectPhase)
  phase?: ClientProjectPhase
}
