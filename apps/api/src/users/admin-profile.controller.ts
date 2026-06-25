import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { AdminAuthGuard, type AdminRequest } from '../auth/guards/admin-auth.guard'
import { AdminProfileService } from './admin-profile.service'
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto'
import { AvatarUploadUrlDto } from './dto/avatar-upload-url.dto'
import { RegisterAvatarDto } from './dto/register-avatar.dto'

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
    @Body() body: UpdateAdminProfileDto,
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
    @Body() body: AvatarUploadUrlDto,
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
    @Body() body: RegisterAvatarDto,
  ) {
    if (!request.adminUser) {
      return { ok: false as const, message: 'Profile requires admin sign-in' }
    }
    const profile = await this.profiles.registerAvatar(request.adminUser, body)
    return { ok: true as const, profile }
  }
}
