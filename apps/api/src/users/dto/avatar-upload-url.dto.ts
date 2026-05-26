import { IsInt, IsString, Max, MaxLength, Min } from 'class-validator'

export class AvatarUploadUrlDto {
  @IsString()
  @MaxLength(255)
  fileName!: string

  @IsString()
  @MaxLength(120)
  mimeType!: string

  @IsInt()
  @Min(1)
  @Max(5 * 1024 * 1024)
  sizeBytes!: number
}
