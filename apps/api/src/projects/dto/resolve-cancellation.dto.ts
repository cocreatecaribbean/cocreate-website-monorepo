import { CancellationOutcome } from '@cocreate/database'
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator'

export class ResolveCancellationDto {
  @IsEnum(CancellationOutcome)
  outcome!: CancellationOutcome

  @IsOptional()
  @IsNumber()
  @Min(0)
  feeAmount?: number

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  feeNotes?: string

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  message?: string
}
