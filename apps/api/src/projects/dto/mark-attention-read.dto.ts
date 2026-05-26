import { IsOptional, IsString } from 'class-validator'

export class MarkAttentionReadDto {
  @IsOptional()
  @IsString()
  requestId?: string

  @IsOptional()
  @IsString()
  projectId?: string
}
