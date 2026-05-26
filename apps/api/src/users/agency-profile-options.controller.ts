import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard'
import { SuperAdminGuard } from '../auth/guards/super-admin.guard'
import { AgencyProfileOptionsService } from './agency-profile-options.service'
import { CreateProfileOptionDto } from './dto/create-profile-option.dto'
import { UpdateProfileOptionDto } from './dto/update-profile-option.dto'

@Controller('auth/admin')
export class AgencyProfileOptionsPublicController {
  constructor(private readonly options: AgencyProfileOptionsService) {}

  @Get('profile-options')
  @UseGuards(AdminAuthGuard)
  async listActive() {
    const data = await this.options.listActive()
    return { ok: true as const, ...data }
  }
}

@Controller('admin/settings/profile-options')
@UseGuards(AdminAuthGuard, SuperAdminGuard)
export class AgencyProfileOptionsAdminController {
  constructor(private readonly options: AgencyProfileOptionsService) {}

  @Get()
  listAll() {
    return this.options.listAll()
  }

  @Post()
  create(@Body() body: CreateProfileOptionDto) {
    return this.options.create(body)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateProfileOptionDto) {
    return this.options.update(id, body)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.options.remove(id)
  }
}
