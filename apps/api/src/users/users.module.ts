import { Module, forwardRef } from '@nestjs/common'
import { AdminProfileController } from './admin-profile.controller'
import {
  AgencyProfileOptionsAdminController,
  AgencyProfileOptionsPublicController,
} from './agency-profile-options.controller'
import { AdminProfileService } from './admin-profile.service'
import { ClientProfileService } from './client-profile.service'
import { AgencyProfileOptionsService } from './agency-profile-options.service'
import { ProfileStorageService } from './profile-storage.service'
import { UserPreferencesService } from './user-preferences.service'
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
    ClientProfileService,
    AgencyProfileOptionsService,
    ProfileStorageService,
    UserPreferencesService,
  ],
  exports: [
    AdminProfileService,
    ClientProfileService,
    ProfileStorageService,
    AgencyProfileOptionsService,
    UserPreferencesService,
  ],
})
export class UsersModule {}
