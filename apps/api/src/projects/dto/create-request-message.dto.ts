import { IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateRequestMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  body!: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentIds?: string[]
}
