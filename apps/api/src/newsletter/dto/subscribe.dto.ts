import { IsEmail, IsOptional, IsString } from 'class-validator'

export class SubscribeNewsletterDto {
  @IsEmail()
  email!: string

  /** Honeypot — must be empty; validated in controller */
  @IsOptional()
  @IsString()
  website?: string
}
