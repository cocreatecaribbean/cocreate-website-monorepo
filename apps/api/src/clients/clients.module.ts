import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ClientsController } from './clients.controller'
import { ClientsService } from './clients.service'
import { ClientLogoStorageService } from './client-logo-storage.service'

@Module({
  imports: [AuthModule],
  controllers: [ClientsController],
  providers: [ClientsService, ClientLogoStorageService],
  exports: [ClientsService],
})
export class ClientsModule {}
