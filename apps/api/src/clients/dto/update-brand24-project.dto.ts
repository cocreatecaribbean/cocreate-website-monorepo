import { IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateBrand24ProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  brand24ProjectId?: string | null
}
