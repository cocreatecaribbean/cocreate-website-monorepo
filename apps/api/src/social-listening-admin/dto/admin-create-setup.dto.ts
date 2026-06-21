import { IsString } from 'class-validator'
import { CreateListeningSetupDto } from '../../social-listening/dto/create-listening-setup.dto'

export class AdminCreateSetupDto extends CreateListeningSetupDto {
  @IsString()
  organizationId!: string
}
