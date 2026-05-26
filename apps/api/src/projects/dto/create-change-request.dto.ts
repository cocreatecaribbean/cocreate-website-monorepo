import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateChangeRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  description!: string
}
