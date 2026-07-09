import { Module, forwardRef } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { BillingModule } from '../billing/billing.module'
import { ClientsController } from './clients.controller'
import { ClientsService } from './clients.service'
import { ClientLogoStorageService } from './client-logo-storage.service'

@Module({
  imports: [AuthModule, forwardRef(() => BillingModule)],
  controllers: [ClientsController],
  providers: [ClientsService, ClientLogoStorageService],
  exports: [ClientsService, ClientLogoStorageService],
})
export class ClientsModule {}
