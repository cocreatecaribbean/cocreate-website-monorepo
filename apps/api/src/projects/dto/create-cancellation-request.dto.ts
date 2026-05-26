import { IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateCancellationRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  reason?: string
}
