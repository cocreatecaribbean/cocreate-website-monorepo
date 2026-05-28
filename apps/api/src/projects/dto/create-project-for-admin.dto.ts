import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator'

export class CreateProjectForAdminDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  description!: string

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  recipientUserIds?: string[]

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  @MaxLength(320, { each: true })
  inviteEmails?: string[]

  /** @deprecated Use inviteEmails — kept for backward compatibility */
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  contactEmail?: string
}
