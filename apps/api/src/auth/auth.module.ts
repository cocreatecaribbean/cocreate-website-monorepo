import { Module } from '@nestjs/common'
import { AdminAuthController } from './admin-auth.controller'
import { AuthService } from './auth.service'
import { AdminAuthGuard } from './guards/admin-auth.guard'
import { ClientAuthGuard } from './guards/client-auth.guard'
import { ResendAuthMailService } from '../clients/resend-auth-mail.service'
import { SupabaseAuthService } from '../clients/supabase-auth.service'

@Module({
  controllers: [AdminAuthController],
  providers: [
    AuthService,
    AdminAuthGuard,
    ClientAuthGuard,
    ResendAuthMailService,
    SupabaseAuthService,
  ],
  exports: [AuthService, AdminAuthGuard, ClientAuthGuard, SupabaseAuthService],
})
export class AuthModule {}
