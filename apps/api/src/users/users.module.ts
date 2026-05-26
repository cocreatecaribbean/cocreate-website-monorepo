import { Module, forwardRef } from '@nestjs/common'
import { AdminProfileController } from './admin-profile.controller'
import {
  AgencyProfileOptionsAdminController,
  AgencyProfileOptionsPublicController,
} from './agency-profile-options.controller'
import { AdminProfileService } from './admin-profile.service'
import { AgencyProfileOptionsService } from './agency-profile-options.service'
import { ProfileStorageService } from './profile-storage.service'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [
    AdminProfileController,
    AgencyProfileOptionsPublicController,
    AgencyProfileOptionsAdminController,
  ],
  providers: [
    AdminProfileService,
    AgencyProfileOptionsService,
    ProfileStorageService,
  ],
  exports: [AdminProfileService, ProfileStorageService, AgencyProfileOptionsService],
})
export class UsersModule {}
