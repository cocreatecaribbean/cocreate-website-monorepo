import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

const BUCKET = 'project-attachments'
const UPLOAD_TTL_SEC = 3600
const DOWNLOAD_TTL_SEC = 3600

@Injectable()
export class ProjectStorageService {
  private readonly logger = new Logger(ProjectStorageService.name)
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

  buildStoragePath(organizationId: string, projectId: string, fileName: string) {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200)
    return `${organizationId}/${projectId}/${randomUUID()}-${safeName}`
  }

  assertPathBelongsToProject(
    storagePath: string,
    organizationId: string,
    projectId: string,
  ) {
    const prefix = `${organizationId}/${projectId}/`
    if (!storagePath.startsWith(prefix)) {
      throw new BadRequestException('Invalid storage path for this project')
    }
  }

  async createUploadUrl(params: {
    organizationId: string
    projectId: string
    fileName: string
    mimeType: string
    sizeBytes: number
  }) {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'File storage is not configured (Supabase)',
      )
    }

    const storagePath = this.buildStoragePath(
      params.organizationId,
      params.projectId,
      params.fileName,
    )

    const { data, error } = await this.client.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath)

    if (error || !data) {
      this.logger.error(`Upload URL failed: ${error?.message}`)
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
        'File storage is not configured (Supabase)',
      )
    }

    const { data, error } = await this.client.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, DOWNLOAD_TTL_SEC)

    if (error || !data?.signedUrl) {
      throw new BadRequestException(
        error?.message ?? 'Could not create download URL',
      )
    }

    return { signedUrl: data.signedUrl, expiresIn: DOWNLOAD_TTL_SEC }
  }
}
