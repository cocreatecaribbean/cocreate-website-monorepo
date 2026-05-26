import { Module, forwardRef } from '@nestjs/common'
import { AdminProfileController } from './admin-profile.controller'
import { AdminProfileService } from './admin-profile.service'
import { ProfileStorageService } from './profile-storage.service'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [AdminProfileController],
  providers: [AdminProfileService, ProfileStorageService],
  exports: [AdminProfileService, ProfileStorageService],
})
export class UsersModule {}
