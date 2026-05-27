import { Module, forwardRef } from '@nestjs/common'
import { AdminAuthController } from './admin-auth.controller'
import { AuthService } from './auth.service'
import { ClientAccessService } from './client-access.service'
import { AdminAuthGuard } from './guards/admin-auth.guard'
import { ClientAuthGuard } from './guards/client-auth.guard'
import { ClientOwnerGuard } from './guards/client-owner.guard'
import { ClientTeamHubGuard } from './guards/client-team-hub.guard'
import { SuperAdminGuard } from './guards/super-admin.guard'
import { ResendAuthMailService } from '../clients/resend-auth-mail.service'
import { SupabaseAuthService } from '../clients/supabase-auth.service'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [forwardRef(() => UsersModule)],
  controllers: [AdminAuthController],
  providers: [
    AuthService,
    ClientAccessService,
    AdminAuthGuard,
    SuperAdminGuard,
    ClientAuthGuard,
    ClientOwnerGuard,
    ClientTeamHubGuard,
    ResendAuthMailService,
    SupabaseAuthService,
  ],
  exports: [
    AuthService,
    ClientAccessService,
    AdminAuthGuard,
    SuperAdminGuard,
    ClientAuthGuard,
    ClientOwnerGuard,
    ClientTeamHubGuard,
    SupabaseAuthService,
  ],
})
export class AuthModule {}
