import { ClientProjectPhase } from '@cocreate/database'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator'
import { StagedCheckpointAttachmentDto } from './staged-checkpoint-attachment.dto'

export class CreateCheckpointDto {
  @IsString()
  @MaxLength(200)
  title!: string

  @IsString()
  @MaxLength(8000)
  body!: string

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  reviewUrl?: string

  @IsOptional()
  @IsEnum(ClientProjectPhase)
  targetPhase?: ClientProjectPhase

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StagedCheckpointAttachmentDto)
  attachments?: StagedCheckpointAttachmentDto[]
}
