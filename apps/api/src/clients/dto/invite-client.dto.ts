import { IsBoolean, IsEmail, IsOptional, IsString, IsUrl, MinLength } from 'class-validator'

export class InviteClientDto {
  @IsString()
  @MinLength(1)
  companyName!: string

  @IsEmail()
  clientEmail!: string

  @IsOptional()
  @IsBoolean()
  enableSocialListening?: boolean

  @IsOptional()
  @IsUrl({ require_tld: false })
  logoUrl?: string
}
