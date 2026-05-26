import { IsNumber, IsString, Min } from 'class-validator'

export class LogoUploadUrlDto {
  @IsString()
  fileName!: string

  @IsString()
  mimeType!: string

  @IsNumber()
  @Min(1)
  sizeBytes!: number
}
