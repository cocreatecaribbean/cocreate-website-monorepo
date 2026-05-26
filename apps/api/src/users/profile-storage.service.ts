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

@Injectable()
export class ProfileStorageService {
  private readonly logger = new Logger(ProfileStorageService.name)
  private readonly client: SupabaseClient | null

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

  buildAvatarPath(userId: string, fileName: string) {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
    return `admin/${userId}/${randomUUID()}-${safeName}`
  }

  assertPathBelongsToUser(storagePath: string, userId: string) {
    const prefix = `admin/${userId}/`
    if (!storagePath.startsWith(prefix)) {
      throw new BadRequestException('Invalid avatar path for this user')
    }
  }

  async createUploadUrl(params: {
    userId: string
    fileName: string
    mimeType: string
    sizeBytes: number
  }) {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Avatar storage is not configured (Supabase)',
      )
    }

    if (!params.mimeType.startsWith('image/')) {
      throw new BadRequestException('Avatar must be an image file')
    }

    if (params.sizeBytes > 5 * 1024 * 1024) {
      throw new BadRequestException('Avatar must be 5 MB or smaller')
    }

    const storagePath = this.buildAvatarPath(params.userId, params.fileName)

    const { data, error } = await this.client.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath)

    if (error || !data) {
      this.logger.error(`Avatar upload URL failed: ${error?.message}`)
      throw new BadRequestException(
        error?.message ?? 'Could not create upload URL',
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

    const { data, error } = await this.client.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, DOWNLOAD_TTL_SEC)

    if (error || !data?.signedUrl) {
      throw new BadRequestException(
        error?.message ?? 'Could not create avatar URL',
      )
    }

    return { signedUrl: data.signedUrl, expiresIn: DOWNLOAD_TTL_SEC }
  }
}
