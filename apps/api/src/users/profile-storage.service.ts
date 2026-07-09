import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

const BUCKET = 'admin-avatars'
const UPLOAD_TTL_SEC = 3600
const DOWNLOAD_TTL_SEC = 86400

const ALLOWED_AVATAR_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const

export type AvatarAudience = 'admin' | 'client'

const BUCKET_MISSING_MESSAGE = `Avatar storage bucket "${BUCKET}" is missing or misconfigured. Create a private bucket with that exact name in Supabase Storage (see docs/supabase-database-setup.md).`

@Injectable()
export class ProfileStorageService {
  private readonly logger = new Logger(ProfileStorageService.name)
  private readonly client: SupabaseClient | null
  private bucketVerified: boolean | null = null

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL')
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')
    this.client =
      url && serviceKey
        ? createClient(url, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          })
        : null
  }

  get isConfigured(): boolean {
    return Boolean(this.client)
  }

  private isVagueStorageError(message: string): boolean {
    return /related resource|resource was not found|parent resource/i.test(message)
  }

  formatStorageError(message: string): string {
    if (this.isVagueStorageError(message)) {
      return BUCKET_MISSING_MESSAGE
    }
    return message
  }

  private resolveAvatarMimeType(fileName: string, mimeType: string): string {
    const trimmed = mimeType.trim().toLowerCase()
    if (
      ALLOWED_AVATAR_MIME.includes(trimmed as (typeof ALLOWED_AVATAR_MIME)[number])
    ) {
      return trimmed
    }

    const ext = fileName.split('.').pop()?.toLowerCase()
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
    if (ext === 'png') return 'image/png'
    if (ext === 'webp') return 'image/webp'

    throw new BadRequestException(
      'Avatar must be a JPEG, PNG, or WebP image (max 5 MB)',
    )
  }

  private async ensureBucketExists(): Promise<void> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Avatar storage is not configured (Supabase)',
      )
    }
    if (this.bucketVerified === true) return

    const { data: bucket, error: getError } = await this.client.storage.getBucket(BUCKET)

    if (getError && !/not found|does not exist/i.test(getError.message)) {
      this.logger.error(`Avatar bucket lookup failed: ${getError.message}`)
      throw new BadRequestException(this.formatStorageError(getError.message))
    }

    if (!bucket) {
      const { error: createError } = await this.client.storage.createBucket(BUCKET, {
        public: false,
      })
      if (createError && !/already exists|duplicate/i.test(createError.message)) {
        this.logger.error(`Avatar bucket create failed: ${createError.message}`)
        throw new BadRequestException(
          `${BUCKET_MISSING_MESSAGE} (${createError.message})`,
        )
      }
    }

    this.bucketVerified = true
  }

  buildAvatarPath(audience: AvatarAudience, userId: string, fileName: string) {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
    return `${audience}/${userId}/${randomUUID()}-${safeName}`
  }

  assertPathBelongsToUser(
    storagePath: string,
    userId: string,
    audience?: AvatarAudience,
  ) {
    const prefixes = audience
      ? [`${audience}/${userId}/`]
      : [`admin/${userId}/`, `client/${userId}/`]
    if (!prefixes.some((prefix) => storagePath.startsWith(prefix))) {
      throw new BadRequestException('Invalid avatar path for this user')
    }
  }

  async createUploadUrl(params: {
    userId: string
    audience: AvatarAudience
    fileName: string
    mimeType: string
    sizeBytes: number
  }) {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Avatar storage is not configured (Supabase)',
      )
    }

    await this.ensureBucketExists()

    this.resolveAvatarMimeType(params.fileName, params.mimeType)

    if (params.sizeBytes > 5 * 1024 * 1024) {
      throw new BadRequestException('Avatar must be 5 MB or smaller')
    }

    const storagePath = this.buildAvatarPath(
      params.audience,
      params.userId,
      params.fileName,
    )

    const { data, error } = await this.client.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath)

    if (error || !data) {
      this.logger.error(`Avatar upload URL failed: ${error?.message}`)
      throw new BadRequestException(
        this.formatStorageError(error?.message ?? 'Could not create upload URL'),
      )
    }

    return {
      storagePath,
      signedUrl: data.signedUrl,
      token: data.token,
      expiresIn: UPLOAD_TTL_SEC,
    }
  }

  async createDownloadUrl(storagePath: string) {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Avatar storage is not configured (Supabase)',
      )
    }

    await this.ensureBucketExists()

    const { data, error } = await this.client.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, DOWNLOAD_TTL_SEC)

    if (error || !data?.signedUrl) {
      throw new BadRequestException(
        this.formatStorageError(error?.message ?? 'Could not create avatar URL'),
      )
    }

    return { signedUrl: data.signedUrl, expiresIn: DOWNLOAD_TTL_SEC }
  }

  async deleteObject(storagePath: string) {
    if (!this.client) return

    await this.ensureBucketExists()

    const { error } = await this.client.storage.from(BUCKET).remove([storagePath])
    if (error) {
      this.logger.warn(`Avatar delete failed: ${error.message}`)
    }
  }
}
