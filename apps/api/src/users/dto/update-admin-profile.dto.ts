import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateAdminProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  jobTitleOptionIds?: string[]
}
