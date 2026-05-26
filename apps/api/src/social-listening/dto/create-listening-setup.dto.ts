import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export class ListeningSetupKeywordDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  value!: string

  @IsIn(['broad', 'exact'])
  matchType!: 'broad' | 'exact'
}

export class CreateListeningSetupDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => ListeningSetupKeywordDto)
  keywords!: ListeningSetupKeywordDto[]

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsString({ each: true })
  @IsIn(['x', 'tiktok', 'reddit', 'instagram', 'facebook', 'web', 'forums'], {
    each: true,
  })
  platforms!: string[]

  @IsString()
  @Matches(DATE_RE, { message: 'startDate must be YYYY-MM-DD' })
  startDate!: string

  @IsString()
  @Matches(DATE_RE, { message: 'endDate must be YYYY-MM-DD' })
  endDate!: string
}
