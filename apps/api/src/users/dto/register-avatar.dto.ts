import { IsString, MaxLength } from 'class-validator'

export class RegisterAvatarDto {
  @IsString()
  @MaxLength(500)
  storagePath!: string
}
