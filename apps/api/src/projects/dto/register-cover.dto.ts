import { IsString, MaxLength } from 'class-validator'

export class RegisterCoverDto {
  @IsString()
  @MaxLength(500)
  storagePath!: string
}
