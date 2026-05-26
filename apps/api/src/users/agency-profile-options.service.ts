import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const DEFAULT_OPTIONS: Array<{ label: string; sortOrder: number }> = [
  { label: 'Project Manager', sortOrder: 0 },
  { label: 'Account Lead', sortOrder: 1 },
  { label: 'Account Manager', sortOrder: 2 },
]

@Injectable()
export class AgencyProfileOptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureDefaults() {
    const count = await this.prisma.agencyProfileOption.count()
    if (count > 0) return

    await this.prisma.agencyProfileOption.createMany({
      data: DEFAULT_OPTIONS,
      skipDuplicates: true,
    })
  }

  async listActive() {
    await this.ensureDefaults()
    const rows = await this.prisma.agencyProfileOption.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    })
    return {
      jobTitles: rows.map(this.serialize),
    }
  }

  async listAll() {
    await this.ensureDefaults()
    const rows = await this.prisma.agencyProfileOption.findMany({
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    })
    return rows.map(this.serialize)
  }

  async create(dto: { label: string; sortOrder?: number }) {
    const label = dto.label.trim()
    if (!label) throw new BadRequestException('Label is required')

    const existing = await this.prisma.agencyProfileOption.findUnique({
      where: { label },
    })
    if (existing) {
      if (existing.isActive) {
        throw new BadRequestException('That job title already exists')
      }
      const row = await this.prisma.agencyProfileOption.update({
        where: { id: existing.id },
        data: { isActive: true },
      })
      return this.serialize(row)
    }

    const maxOrder = await this.prisma.agencyProfileOption.aggregate({
      _max: { sortOrder: true },
    })

    const row = await this.prisma.agencyProfileOption.create({
      data: {
        label,
        sortOrder: dto.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
      },
    })
    return this.serialize(row)
  }

  async update(
    id: string,
    dto: { label?: string; sortOrder?: number; isActive?: boolean },
  ) {
    const existing = await this.prisma.agencyProfileOption.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('Job title not found')

    const row = await this.prisma.agencyProfileOption.update({
      where: { id },
      data: {
        ...(dto.label !== undefined ? { label: dto.label.trim() } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    })
    return this.serialize(row)
  }

  async remove(id: string) {
    const existing = await this.prisma.agencyProfileOption.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('Job title not found')

    const inUse = await this.prisma.userProfileJobTitle.count({
      where: { optionId: id },
    })

    if (inUse === 0) {
      await this.prisma.agencyProfileOption.delete({ where: { id } })
      return { ok: true as const, removed: true as const }
    }

    await this.prisma.agencyProfileOption.update({
      where: { id },
      data: { isActive: false },
    })
    return { ok: true as const, removed: false as const, deactivated: true as const }
  }

  async resolveActiveOptions(ids: string[]) {
    if (!ids.length) return []

    const uniqueIds = [...new Set(ids)]
    const rows = await this.prisma.agencyProfileOption.findMany({
      where: { id: { in: uniqueIds }, isActive: true },
    })

    if (rows.length !== uniqueIds.length) {
      throw new BadRequestException('One or more job titles are invalid')
    }

    const byId = new Map(rows.map((r) => [r.id, r]))
    return uniqueIds.map((id) => byId.get(id)!)
  }

  private serialize(row: {
    id: string
    label: string
    sortOrder: number
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }) {
    return {
      id: row.id,
      label: row.label,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  }
}
