import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common'
import {
  AvatarUploadUrlSchema,
  type AvatarUploadUrlInput,
  RegisterAvatarSchema,
  type RegisterAvatarInput,
  UpdateAdminProfileSchema,
  type UpdateAdminProfileInput,
} from '@cocreate/api-contracts/v1/requests/users'
import { AdminAuthGuard, type AdminRequest } from '../auth/guards/admin-auth.guard'
import { zodBody } from '../common/zod/zod-validation.pipe'
import { AdminProfileService } from './admin-profile.service'

@Controller({ path: 'auth/admin', version: '1' })
export class AdminProfileController {
  constructor(private readonly profiles: AdminProfileService) {}

  @Get('profile')
  @UseGuards(AdminAuthGuard)
  async getProfile(@Req() request: AdminRequest) {
    if (!request.adminUser) {
      return { ok: false as const, message: 'Profile requires admin sign-in' }
    }
    const profile = await this.profiles.getProfile(request.adminUser)
    return { ok: true as const, profile }
  }

  @Patch('profile')
  @UseGuards(AdminAuthGuard)
  async updateProfile(
    @Req() request: AdminRequest,
    @Body(zodBody(UpdateAdminProfileSchema)) body: UpdateAdminProfileInput,
  ) {
    if (!request.adminUser) {
      return { ok: false as const, message: 'Profile requires admin sign-in' }
    }
    const profile = await this.profiles.updateProfile(request.adminUser, body)
    return { ok: true as const, profile }
  }

  @Post('profile/avatar/upload-url')
  @UseGuards(AdminAuthGuard)
  async avatarUploadUrl(
    @Req() request: AdminRequest,
    @Body(zodBody(AvatarUploadUrlSchema)) body: AvatarUploadUrlInput,
  ) {
    if (!request.adminUser) {
      return { ok: false as const, message: 'Profile requires admin sign-in' }
    }
    const upload = await this.profiles.createAvatarUploadUrl(request.adminUser, body)
    return { ok: true as const, ...upload }
  }

  @Patch('profile/avatar')
  @UseGuards(AdminAuthGuard)
  async registerAvatar(
    @Req() request: AdminRequest,
    @Body(zodBody(RegisterAvatarSchema)) body: RegisterAvatarInput,
  ) {
    if (!request.adminUser) {
      return { ok: false as const, message: 'Profile requires admin sign-in' }
    }
    const profile = await this.profiles.registerAvatar(request.adminUser, body)
    return { ok: true as const, profile }
  }
}
