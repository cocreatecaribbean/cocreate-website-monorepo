import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { AdminAuthGuard, type AdminRequest } from './guards/admin-auth.guard'
import { SupabaseAuthService } from '../clients/supabase-auth.service'
import { AgencyAccessService } from './agency-access.service'
import { PrismaService } from '../prisma/prisma.service'
import { isCollaboratorRole } from './admin-roles'

@Controller({ path: 'auth/collaborator', version: '1' })
export class CollaboratorAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly supabaseAuth: SupabaseAuthService,
    private readonly config: ConfigService,
    private readonly agencyAccess: AgencyAccessService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('me')
  @UseGuards(AdminAuthGuard)
  async me(@Req() request: AdminRequest) {
    const user = request.adminUser
    if (!user) {
      return { ok: false as const, message: 'Not signed in' }
    }

    if (!isCollaboratorRole(user.role)) {
      return { ok: false as const, message: 'Not a collaborator account' }
    }

    const projectIds = await this.agencyAccess.listAccessibleProjectIds(user)
    const projects =
      projectIds === 'all'
        ? []
        : await this.prisma.clientProject.findMany({
            where: { id: { in: projectIds } },
            select: {
              id: true,
              title: true,
              organizationId: true,
              organization: { select: { name: true } },
            },
            orderBy: { updatedAt: 'desc' },
          })

    return {
      ok: true as const,
      collaborator: {
        id: user.id,
        email: user.email,
        status: user.status,
        role: user.role,
      },
      projects: projects.map((p) => ({
        id: p.id,
        title: p.title,
        organizationId: p.organizationId,
        organizationName: p.organization.name,
      })),
    }
  }

  @Post('magic-link')
  async requestMagicLink(@Body() body: { email?: string }) {
    const email = body?.email?.trim() ?? ''
    if (!email) {
      return { ok: false as const, message: 'Email is required' }
    }

    await this.authService.assertCollaboratorEmailAllowed(email)

    const adminCenterUrl =
      this.config.get<string>('ADMIN_CENTER_URL') ?? 'http://localhost:3002'

    const callbackUrl = `${adminCenterUrl}/auth/callback?next=${encodeURIComponent('/collaborate')}`
    const result = await this.supabaseAuth.sendAllowlistedMagicLink(
      email,
      callbackUrl,
      { role: 'COLLABORATOR' },
    )

    if (result.status === 'dev_link' && result.devSignInUrl) {
      return {
        ok: true as const,
        message:
          'Development mode: open the sign-in link below (no email sent).',
        devSignInUrl: result.devSignInUrl,
      }
    }

    return {
      ok: true as const,
      message: 'Check your email for a sign-in link.',
    }
  }
}
