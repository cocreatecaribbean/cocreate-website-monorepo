import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ClientsModule } from '../clients/clients.module'
import { AdminsController } from './admins.controller'
import { AdminsService } from './admins.service'

@Module({
  imports: [AuthModule, ClientsModule],
  controllers: [AdminsController],
  providers: [AdminsService],
})
export class AdminsModule {}
