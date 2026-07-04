import { Injectable } from '@nestjs/common'
import type { UpdateUserPreferencesInput } from '@cocreate/api-contracts/v1/requests/users'
import type {
  ThemePreference,
  UserPreferences,
} from '@cocreate/api-contracts/v1/shared/preferences'
import { ThemePreferenceSchema } from '@cocreate/api-contracts/v1/shared/preferences'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UserPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(userId: string): Promise<UserPreferences> {
    const row = await this.prisma.userPreferences.upsert({
      where: { userId },
      create: { userId },
      update: {},
    })
    return this.serialize(row)
  }

  async update(userId: string, dto: UpdateUserPreferencesInput): Promise<UserPreferences> {
    await this.getOrCreate(userId)

    const row = await this.prisma.userPreferences.update({
      where: { userId },
      data: {
        ...(dto.theme !== undefined ? { theme: dto.theme } : {}),
      },
    })
    return this.serialize(row)
  }

  private serialize(row: { theme: string }): UserPreferences {
    const theme = ThemePreferenceSchema.safeParse(row.theme)
    return {
      theme: (theme.success ? theme.data : 'system') satisfies ThemePreference,
    }
  }
}
