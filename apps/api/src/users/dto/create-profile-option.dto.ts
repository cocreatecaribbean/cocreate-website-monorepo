import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator'

export class CreateProfileOptionDto {
  @IsString()
  @MaxLength(120)
  label!: string

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number
}
