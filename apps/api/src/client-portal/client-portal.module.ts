import { Module } from '@nestjs/common'
import { ClientPortalController } from './client-portal.controller'
import { AdminClientPortalController } from './admin-client-portal.controller'
import { ClientPortalService } from './client-portal.service'

@Module({
  controllers: [ClientPortalController, AdminClientPortalController],
  providers: [ClientPortalService],
})
export class ClientPortalModule {}
