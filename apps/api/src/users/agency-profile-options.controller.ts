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
import {
  CreateProfileOptionSchema,
  type CreateProfileOptionInput,
  UpdateProfileOptionSchema,
  type UpdateProfileOptionInput,
} from '@cocreate/api-contracts/v1/requests/users'
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard'
import { SuperAdminGuard } from '../auth/guards/super-admin.guard'
import { zodBody } from '../common/zod/zod-validation.pipe'
import { AgencyProfileOptionsService } from './agency-profile-options.service'

@Controller({ path: 'auth/admin', version: '1' })
export class AgencyProfileOptionsPublicController {
  constructor(private readonly options: AgencyProfileOptionsService) {}

  @Get('profile-options')
  @UseGuards(AdminAuthGuard)
  async listActive() {
    const data = await this.options.listActive()
    return { ok: true as const, ...data }
  }
}

@Controller({ path: 'admin/settings/profile-options', version: '1' })
@UseGuards(AdminAuthGuard, SuperAdminGuard)
export class AgencyProfileOptionsAdminController {
  constructor(private readonly options: AgencyProfileOptionsService) {}

  @Get()
  listAll() {
    return this.options.listAll()
  }

  @Post()
  create(@Body(zodBody(CreateProfileOptionSchema)) body: CreateProfileOptionInput) {
    return this.options.create(body)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(zodBody(UpdateProfileOptionSchema)) body: UpdateProfileOptionInput,
  ) {
    return this.options.update(id, body)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.options.remove(id)
  }
}
