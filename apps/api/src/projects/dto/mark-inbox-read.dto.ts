import { IsOptional, IsString } from 'class-validator'

export class MarkInboxReadDto {
  @IsOptional()
  @IsString()
  requestId?: string
}
