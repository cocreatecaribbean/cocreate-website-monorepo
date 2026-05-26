import { IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateAdminProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string
}
