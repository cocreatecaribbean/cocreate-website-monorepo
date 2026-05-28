import { Injectable, NotFoundException } from '@nestjs/common'
import type { AuthenticatedAdmin } from '../auth/auth.service'
import { PrismaService } from '../prisma/prisma.service'
import type { RegisterBrandAssetDto } from './dto/register-brand-asset.dto'
import type { UploadUrlDto } from './dto/upload-url.dto'
import { ProjectStorageService } from './project-storage.service'
import { resolveActorDisplayName, userActorSelect, type UserActorPick } from '../users/display-name'

function serializeBrandAsset(
  row: {
    id: string
    organizationId: string
    storagePath: string
    fileName: string
    mimeType: string
    sizeBytes: number
    uploadedByUserId: string
    createdAt: Date
    uploadedBy?: UserActorPick | null
  },
) {
  return {
    id: row.id,
    organizationId: row.organizationId,
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    uploadedByUserId: row.uploadedByUserId,
    uploadedByEmail: row.uploadedBy?.email ?? null,
    uploadedByName: row.uploadedBy ? resolveActorDisplayName(row.uploadedBy) : null,
    createdAt: row.createdAt.toISOString(),
  }
}

@Injectable()
export class OrganizationBrandAssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ProjectStorageService,
  ) {}

  private async assertOrganizationExists(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    })
    if (!org) throw new NotFoundException('Organization not found')
  }

  private async getBrandAssetOrThrow(assetId: string) {
    const asset = await this.prisma.organizationBrandAsset.findUnique({
      where: { id: assetId },
      include: { uploadedBy: { select: userActorSelect } },
    })
    if (!asset) throw new NotFoundException('Brand asset not found')
    return asset
  }

  async listForOrganization(organizationId: string) {
    await this.assertOrganizationExists(organizationId)
    const rows = await this.prisma.organizationBrandAsset.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: { uploadedBy: { select: userActorSelect } },
    })
    return rows.map(serializeBrandAsset)
  }

  async createUploadUrl(organizationId: string, dto: UploadUrlDto) {
    await this.assertOrganizationExists(organizationId)
    return this.storage.createBrandUploadUrl({
      organizationId,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
    })
  }

  async register(admin: AuthenticatedAdmin, organizationId: string, dto: RegisterBrandAssetDto) {
    await this.assertOrganizationExists(organizationId)
    this.storage.assertPathBelongsToOrganizationBrand(dto.storagePath, organizationId)

    const row = await this.prisma.organizationBrandAsset.create({
      data: {
        organizationId,
        storagePath: dto.storagePath,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        uploadedByUserId: admin.id,
      },
      include: { uploadedBy: { select: userActorSelect } },
    })
    return serializeBrandAsset(row)
  }

  async getDownloadUrl(assetId: string) {
    const asset = await this.getBrandAssetOrThrow(assetId)
    this.storage.assertPathBelongsToOrganizationBrand(asset.storagePath, asset.organizationId)
    const signed = await this.storage.createDownloadUrl(asset.storagePath)
    return {
      id: asset.id,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      download: signed,
    }
  }

  async delete(assetId: string) {
    const asset = await this.getBrandAssetOrThrow(assetId)
    await this.prisma.organizationBrandAsset.delete({ where: { id: assetId } })
    await this.storage.deleteObject(asset.storagePath)
    return { ok: true }
  }
}
