import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator'

export class RegisterBrandAssetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  storagePath!: string

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fileName!: string

  @IsString()
  @MinLength(1)
  @MaxLength(127)
  mimeType!: string

  @IsInt()
  @Min(1)
  @Max(104857600)
  sizeBytes!: number
}
