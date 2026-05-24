import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard'
import { ClientsService } from './clients.service'
import { InviteClientDto } from './dto/invite-client.dto'

@Controller('admin/clients')
@UseGuards(AdminAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post('invite')
  invite(@Body() dto: InviteClientDto) {
    return this.clientsService.inviteClient(dto)
  }

  @Get()
  list() {
    return this.clientsService.listClientRoster()
  }

  @Post(':userId/suspend')
  suspend(@Param('userId') userId: string) {
    return this.clientsService.suspendClientUser(userId)
  }
}
