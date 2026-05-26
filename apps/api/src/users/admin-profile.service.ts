import { Injectable } from '@nestjs/common'
import type { AuthenticatedAdmin } from '../auth/auth.service'
import { PrismaService } from '../prisma/prisma.service'
import { ProfileStorageService } from './profile-storage.service'
import type { UpdateAdminProfileDto } from './dto/update-admin-profile.dto'
import type { AvatarUploadUrlDto } from './dto/avatar-upload-url.dto'
import type { RegisterAvatarDto } from './dto/register-avatar.dto'

@Injectable()
export class AdminProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ProfileStorageService,
  ) {}

  async getProfile(admin: AuthenticatedAdmin) {
    const profile = await this.ensureProfileRow(admin.id)
    return this.serializeProfile(profile, admin.email)
  }

  async updateProfile(admin: AuthenticatedAdmin, dto: UpdateAdminProfileDto) {
    await this.ensureProfileRow(admin.id)

    const data: {
      displayName?: string | null
      jobTitle?: string | null
      department?: string | null
    } = {}

    if (dto.displayName !== undefined) {
      const trimmed = dto.displayName.trim()
      data.displayName = trimmed.length > 0 ? trimmed : null
    }
    if (dto.jobTitle !== undefined) {
      const trimmed = dto.jobTitle.trim()
      data.jobTitle = trimmed.length > 0 ? trimmed : null
    }
    if (dto.department !== undefined) {
      const trimmed = dto.department.trim()
      data.department = trimmed.length > 0 ? trimmed : null
    }

    const profile = await this.prisma.userProfile.update({
      where: { userId: admin.id },
      data,
    })

    return this.serializeProfile(profile, admin.email)
  }

  async createAvatarUploadUrl(admin: AuthenticatedAdmin, dto: AvatarUploadUrlDto) {
    return this.storage.createUploadUrl({
      userId: admin.id,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
    })
  }

  async registerAvatar(admin: AuthenticatedAdmin, dto: RegisterAvatarDto) {
    this.storage.assertPathBelongsToUser(dto.storagePath, admin.id)
    await this.ensureProfileRow(admin.id)

    const profile = await this.prisma.userProfile.update({
      where: { userId: admin.id },
      data: { avatarStoragePath: dto.storagePath },
    })

    return this.serializeProfile(profile, admin.email)
  }

  private async ensureProfileRow(userId: string) {
    return this.prisma.userProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    })
  }

  private async serializeProfile(
    profile: {
      displayName: string | null
      jobTitle: string | null
      department: string | null
      avatarStoragePath: string | null
      updatedAt: Date
    },
    email: string,
  ) {
    let avatarUrl: string | null = null
    if (profile.avatarStoragePath && this.storage.isConfigured) {
      try {
        const signed = await this.storage.createDownloadUrl(profile.avatarStoragePath)
        avatarUrl = signed.signedUrl
      } catch {
        avatarUrl = null
      }
    }

    return {
      displayName: profile.displayName,
      jobTitle: profile.jobTitle,
      department: profile.department,
      avatarStoragePath: profile.avatarStoragePath,
      avatarUrl,
      email,
      updatedAt: profile.updatedAt.toISOString(),
      profileComplete: Boolean(profile.displayName?.trim()),
    }
  }
}
