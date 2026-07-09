import { Injectable } from '@nestjs/common'
import type {
  AvatarUploadUrlInput,
  RegisterAvatarInput,
  UpdateClientProfileInput,
} from '@cocreate/api-contracts/v1/requests/users'
import { PrismaService } from '../prisma/prisma.service'
import { ProfileStorageService } from './profile-storage.service'

@Injectable()
export class ClientProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ProfileStorageService,
  ) {}

  async getProfileFields(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { displayName: true, avatarStoragePath: true },
    })

    let avatarUrl: string | null = null
    if (profile?.avatarStoragePath && this.storage.isConfigured) {
      try {
        const signed = await this.storage.createDownloadUrl(profile.avatarStoragePath)
        avatarUrl = signed.signedUrl
      } catch {
        avatarUrl = null
      }
    }

    return {
      displayName: profile?.displayName ?? null,
      avatarUrl,
      profileComplete: Boolean(profile?.displayName?.trim()),
    }
  }

  async updateProfile(userId: string, dto: UpdateClientProfileInput) {
    if (dto.displayName === undefined) {
      return this.getProfileFields(userId)
    }

    const trimmed = dto.displayName.trim()
    await this.prisma.userProfile.upsert({
      where: { userId },
      create: { userId, displayName: trimmed.length > 0 ? trimmed : null },
      update: { displayName: trimmed.length > 0 ? trimmed : null },
    })

    return this.getProfileFields(userId)
  }

  async createAvatarUploadUrl(userId: string, dto: AvatarUploadUrlInput) {
    return this.storage.createUploadUrl({
      userId,
      audience: 'client',
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
    })
  }

  async registerAvatar(userId: string, dto: RegisterAvatarInput) {
    this.storage.assertPathBelongsToUser(dto.storagePath, userId, 'client')

    await this.prisma.userProfile.upsert({
      where: { userId },
      create: { userId, avatarStoragePath: dto.storagePath },
      update: { avatarStoragePath: dto.storagePath },
    })

    return this.getProfileFields(userId)
  }

  async deleteAvatar(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { avatarStoragePath: true },
    })

    if (profile?.avatarStoragePath) {
      await this.storage.deleteObject(profile.avatarStoragePath)
    }

    await this.prisma.userProfile.upsert({
      where: { userId },
      create: { userId, avatarStoragePath: null },
      update: { avatarStoragePath: null },
    })

    return this.getProfileFields(userId)
  }
}
