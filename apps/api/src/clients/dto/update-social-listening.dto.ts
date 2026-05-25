import { IsBoolean } from 'class-validator'

export class UpdateSocialListeningDto {
  @IsBoolean()
  enabled!: boolean
}
