import { Injectable } from '@nestjs/common'
import type { AuthenticatedAdmin } from '../auth/auth.service'
import { PrismaService } from '../prisma/prisma.service'
import { AgencyProfileOptionsService } from './agency-profile-options.service'
import { ProfileStorageService } from './profile-storage.service'
import type {
  UpdateAdminProfileInput,
  AvatarUploadUrlInput,
  RegisterAvatarInput,
} from '@cocreate/api-contracts/v1/requests/users'

const profileInclude = {
  jobTitles: {
    include: { option: true },
    orderBy: { sortOrder: 'asc' as const },
  },
} as const

@Injectable()
export class AdminProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ProfileStorageService,
    private readonly profileOptions: AgencyProfileOptionsService,
  ) {}

  async getProfile(admin: AuthenticatedAdmin) {
    const profile = await this.ensureProfileRow(admin.id)
    return this.serializeProfile(profile, admin.email)
  }

  async updateProfile(admin: AuthenticatedAdmin, dto: UpdateAdminProfileInput) {
    const profile = await this.ensureProfileRow(admin.id)

    if (dto.displayName !== undefined) {
      const trimmed = dto.displayName.trim()
      await this.prisma.userProfile.update({
        where: { id: profile.id },
        data: { displayName: trimmed.length > 0 ? trimmed : null },
      })
    }

    if (dto.jobTitleOptionIds !== undefined) {
      const options = await this.profileOptions.resolveActiveOptions(dto.jobTitleOptionIds)
      const labels = options.map((o) => o.label)

      await this.prisma.$transaction(async (tx) => {
        await tx.userProfileJobTitle.deleteMany({ where: { profileId: profile.id } })
        for (let index = 0; index < options.length; index++) {
          await tx.userProfileJobTitle.create({
            data: {
              profileId: profile.id,
              optionId: options[index]!.id,
              sortOrder: index,
            },
          })
        }
        await tx.userProfile.update({
          where: { id: profile.id },
          data: { jobTitle: labels.length > 0 ? labels.join(', ') : null },
        })
      })
    }

    const updated = await this.prisma.userProfile.findUniqueOrThrow({
      where: { userId: admin.id },
      include: profileInclude,
    })

    return this.serializeProfile(updated, admin.email)
  }

  async createAvatarUploadUrl(admin: AuthenticatedAdmin, dto: AvatarUploadUrlInput) {
    return this.storage.createUploadUrl({
      userId: admin.id,
      audience: 'admin',
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
    })
  }

  async registerAvatar(admin: AuthenticatedAdmin, dto: RegisterAvatarInput) {
    this.storage.assertPathBelongsToUser(dto.storagePath, admin.id, 'admin')
    await this.ensureProfileRow(admin.id)

    const profile = await this.prisma.userProfile.update({
      where: { userId: admin.id },
      data: { avatarStoragePath: dto.storagePath },
      include: profileInclude,
    })

    return this.serializeProfile(profile, admin.email)
  }

  async deleteAvatar(admin: AuthenticatedAdmin) {
    const profile = await this.ensureProfileRow(admin.id)
    const previousPath = profile.avatarStoragePath

    const updated = await this.prisma.userProfile.update({
      where: { userId: admin.id },
      data: { avatarStoragePath: null },
      include: profileInclude,
    })

    if (previousPath) {
      await this.storage.deleteObject(previousPath)
    }

    return this.serializeProfile(updated, admin.email)
  }

  private async ensureProfileRow(userId: string) {
    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: profileInclude,
    })
    await this.backfillJobTitlesFromDenormalized(profile)
    if (profile.jobTitles.length === 0 && profile.jobTitle) {
      return this.prisma.userProfile.findUniqueOrThrow({
        where: { userId },
        include: profileInclude,
      })
    }
    return profile
  }

  /** After schema migration: restore join rows from comma-separated jobTitle text. */
  private async backfillJobTitlesFromDenormalized(profile: {
    id: string
    jobTitle: string | null
    jobTitles: unknown[]
  }) {
    if (profile.jobTitles.length > 0 || !profile.jobTitle?.trim()) return

    const labels = profile.jobTitle
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (!labels.length) return

    const options = await this.prisma.agencyProfileOption.findMany({
      where: { label: { in: labels }, isActive: true },
    })
    if (!options.length) return

    const byLabel = new Map(options.map((o) => [o.label, o]))
    const ordered = labels
      .map((label) => byLabel.get(label))
      .filter((o): o is NonNullable<typeof o> => Boolean(o))

    await this.prisma.$transaction(async (tx) => {
      for (let index = 0; index < ordered.length; index++) {
        await tx.userProfileJobTitle.create({
          data: {
            profileId: profile.id,
            optionId: ordered[index]!.id,
            sortOrder: index,
          },
        })
      }
    })
  }

  private async serializeProfile(
    profile: {
      displayName: string | null
      jobTitle: string | null
      avatarStoragePath: string | null
      updatedAt: Date
      jobTitles: Array<{
        optionId: string
        option: { id: string; label: string }
      }>
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

    const jobTitleOptionIds = profile.jobTitles.map((jt) => jt.optionId)
    const jobTitleLabels = profile.jobTitles.map((jt) => jt.option.label)

    return {
      displayName: profile.displayName,
      jobTitle: profile.jobTitle,
      jobTitleLabels,
      jobTitleOptionIds,
      avatarStoragePath: profile.avatarStoragePath,
      avatarUrl,
      email,
      updatedAt: profile.updatedAt.toISOString(),
      profileComplete: Boolean(profile.displayName?.trim()),
    }
  }
}
