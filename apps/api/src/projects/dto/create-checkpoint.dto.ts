import { ClientProjectPhase } from '@cocreate/database'
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateCheckpointDto {
  @IsString()
  @MaxLength(200)
  title!: string

  @IsString()
  @MaxLength(8000)
  body!: string

  @IsOptional()
  @IsEnum(ClientProjectPhase)
  targetPhase?: ClientProjectPhase
}
