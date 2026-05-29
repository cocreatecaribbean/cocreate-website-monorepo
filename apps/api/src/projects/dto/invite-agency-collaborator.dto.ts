import { IsArray, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator'

export class InviteAgencyCollaboratorDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string

  @IsOptional()
  @IsString()
  userId?: string
}

export class CreateAgencyCollaboratorDto {
  @IsEmail()
  @MaxLength(320)
  email!: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  projectIds?: string[]
}
