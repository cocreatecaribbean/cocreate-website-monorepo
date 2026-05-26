import { Module, forwardRef } from '@nestjs/common'
import { AdminAuthController } from './admin-auth.controller'
import { AuthService } from './auth.service'
import { AdminAuthGuard } from './guards/admin-auth.guard'
import { ClientAuthGuard } from './guards/client-auth.guard'
import { SuperAdminGuard } from './guards/super-admin.guard'
import { ResendAuthMailService } from '../clients/resend-auth-mail.service'
import { SupabaseAuthService } from '../clients/supabase-auth.service'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [forwardRef(() => UsersModule)],
  controllers: [AdminAuthController],
  providers: [
    AuthService,
    AdminAuthGuard,
    SuperAdminGuard,
    ClientAuthGuard,
    ResendAuthMailService,
    SupabaseAuthService,
  ],
  exports: [
    AuthService,
    AdminAuthGuard,
    SuperAdminGuard,
    ClientAuthGuard,
    SupabaseAuthService,
  ],
})
export class AuthModule {}
