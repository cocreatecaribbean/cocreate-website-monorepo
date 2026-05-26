import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

const BUCKET = 'client-logos'
const UPLOAD_TTL_SEC = 3600
const MAX_SIZE_BYTES = 5 * 1024 * 1024

@Injectable()
export class ClientLogoStorageService {
  private readonly logger = new Logger(ClientLogoStorageService.name)
  private readonly client: SupabaseClient | null
  private readonly supabaseUrl: string | null

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL')
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')
    this.supabaseUrl = url ?? null
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

  buildStoragePath(fileName: string) {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
    return `logos/${randomUUID()}-${safeName}`
  }

  publicUrlForPath(storagePath: string) {
    return `${this.supabaseUrl}/storage/v1/object/public/${BUCKET}/${storagePath}`
  }

  async createUploadUrl(params: {
    fileName: string
    mimeType: string
    sizeBytes: number
  }) {
    if (!this.client || !this.supabaseUrl) {
      throw new ServiceUnavailableException(
        'Logo storage is not configured (Supabase)',
      )
    }

    if (!params.mimeType.startsWith('image/')) {
      throw new BadRequestException('Logo must be an image file')
    }

    if (params.sizeBytes > MAX_SIZE_BYTES) {
      throw new BadRequestException('Logo must be 5 MB or smaller')
    }

    const storagePath = this.buildStoragePath(params.fileName)

    const { data, error } = await this.client.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath)

    if (error || !data) {
      this.logger.error(`Logo upload URL failed: ${error?.message}`)
      throw new BadRequestException(
        error?.message ?? 'Could not create logo upload URL',
      )
    }

    return {
      storagePath,
      signedUrl: data.signedUrl,
      token: data.token,
      publicUrl: this.publicUrlForPath(storagePath),
      expiresIn: UPLOAD_TTL_SEC,
    }
  }
}
