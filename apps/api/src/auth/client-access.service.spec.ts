import { ClientOrgRole } from '@cocreate/database'
import { ClientAccessService } from './client-access.service'

describe('ClientAccessService', () => {
  const service = new ClientAccessService({} as never)

  const base = {
    role: 'CLIENT' as const,
    status: 'ACTIVE' as const,
    supabaseAuthId: 'sb-1',
    canAccessSocialListening: false,
    canAccessGetHelp: true,
    memberships: [] as const,
    organization: {
      id: 'org-1',
      name: 'Acme',
      slug: 'acme',
      logoUrl: null,
      isSocialListeningSubscriber: true,
    },
  }

  const admin = {
    ...base,
    id: 'admin-1',
    email: 'admin@test.com',
    clientOrgRole: ClientOrgRole.ADMIN,
  }

  const contributor = {
    ...base,
    id: 'contrib-1',
    email: 'contrib@test.com',
    clientOrgRole: ClientOrgRole.CONTRIBUTOR,
  }

  const contributorNoGetHelp = {
    ...contributor,
    canAccessGetHelp: false,
  }

  const viewer = {
    ...base,
    id: 'viewer-1',
    email: 'viewer@test.com',
    clientOrgRole: ClientOrgRole.VIEWER,
  }

  const socialAnalyst = {
    ...base,
    id: 'sa-1',
    email: 'analyst@test.com',
    clientOrgRole: ClientOrgRole.SOCIAL_ANALYST,
  }

  describe('accessibleProjectsWhere', () => {
    it('admin sees all org projects', () => {
      expect(service.accessibleProjectsWhere(admin)).toEqual({ organizationId: 'org-1' })
    })

    it('contributor sees only assigned projects', () => {
      expect(service.accessibleProjectsWhere(contributor)).toEqual({
        organizationId: 'org-1',
        members: { some: { userId: 'contrib-1' } },
      })
    })

    it('viewer sees only assigned projects', () => {
      expect(service.accessibleProjectsWhere(viewer)).toEqual({
        organizationId: 'org-1',
        members: { some: { userId: 'viewer-1' } },
      })
    })

    it('social analyst sees no projects', () => {
      expect(service.accessibleProjectsWhere(socialAnalyst)).toEqual({
        organizationId: 'org-1',
        id: '__none__',
      })
    })
  })

  describe('project / messaging capabilities', () => {
    it('only admin can create projects', () => {
      expect(service.canCreateProject(admin)).toBe(true)
      expect(service.canCreateProject(contributor)).toBe(false)
      expect(service.canCreateProject(viewer)).toBe(false)
      expect(service.canCreateProject(socialAnalyst)).toBe(false)
    })

    it('admin and contributor can send messages and react', () => {
      expect(service.canSendMessages(admin)).toBe(true)
      expect(service.canSendMessages(contributor)).toBe(true)
      expect(service.canSendMessages(viewer)).toBe(false)
      expect(service.canSendMessages(socialAnalyst)).toBe(false)

      expect(service.canReactToFiles(admin)).toBe(true)
      expect(service.canReactToFiles(contributor)).toBe(true)
      expect(service.canReactToFiles(viewer)).toBe(false)
      expect(service.canReactToFiles(socialAnalyst)).toBe(false)
    })

    it('admin and contributor can access get-help when org allows contributors', () => {
      expect(service.canAccessGetHelp(admin)).toBe(true)
      expect(service.canAccessGetHelp(contributor)).toBe(true)
      expect(service.canAccessGetHelp(viewer)).toBe(false)
      expect(service.canAccessGetHelp(socialAnalyst)).toBe(false)
    })

    it('admin keeps get-help when contributor flag is off; contributor loses access', () => {
      expect(service.canAccessGetHelp(admin)).toBe(true)
      expect(service.canAccessGetHelp(contributorNoGetHelp)).toBe(false)
      expect(service.canAccessGetHelp(viewer)).toBe(false)
    })

    it('only admin can manage org team / invite / promote', () => {
      expect(service.canManageOrgTeam(admin)).toBe(true)
      expect(service.canInviteOrgMemberImmediately(admin)).toBe(true)
      expect(service.canPromoteToAdmin(admin)).toBe(true)

      for (const client of [contributor, viewer, socialAnalyst]) {
        expect(service.canManageOrgTeam(client)).toBe(false)
        expect(service.canInviteOrgMemberImmediately(client)).toBe(false)
        expect(service.canPromoteToAdmin(client)).toBe(false)
      }
    })

    it('invite requests are disabled for all roles', () => {
      expect(service.canRequestOrgInvite(admin)).toBe(false)
      expect(service.canRequestOrgInvite(contributor)).toBe(false)
      expect(service.canRequestOrgInvite(viewer)).toBe(false)
      expect(service.canRequestOrgInvite(socialAnalyst)).toBe(false)
    })
  })

  describe('canUseSocialListening / canViewSocialListening', () => {
    it('admin has access when org is subscribed even if user flag is false', () => {
      expect(service.canUseSocialListening(admin)).toBe(true)
      expect(service.canViewSocialListening(admin)).toBe(true)
    })

    it('contributor has access only when membership flag is on', () => {
      expect(
        service.canUseSocialListening({
          ...contributor,
          canAccessSocialListening: true,
        }),
      ).toBe(true)
      expect(
        service.canUseSocialListening({
          ...contributor,
          canAccessSocialListening: false,
        }),
      ).toBe(false)
    })

    it('social analyst has access when org is subscribed', () => {
      expect(service.canUseSocialListening(socialAnalyst)).toBe(true)
      expect(service.canManageSocialListeningSetup(socialAnalyst)).toBe(true)
    })

    it('viewer never has social listening access', () => {
      expect(
        service.canUseSocialListening({
          ...viewer,
          canAccessSocialListening: true,
        }),
      ).toBe(false)
    })

    it('no role has access when org is not subscribed', () => {
      const unsubscribed = {
        organization: {
          ...base.organization!,
          isSocialListeningSubscriber: false,
        },
      }
      expect(service.canUseSocialListening({ ...admin, ...unsubscribed })).toBe(false)
      expect(
        service.canUseSocialListening({
          ...contributor,
          canAccessSocialListening: true,
          ...unsubscribed,
        }),
      ).toBe(false)
      expect(service.canUseSocialListening({ ...socialAnalyst, ...unsubscribed })).toBe(false)
    })

    it('only admin and social analyst can manage listening setups', () => {
      expect(service.canManageSocialListeningSetup(admin)).toBe(true)
      expect(service.canManageSocialListeningSetup(socialAnalyst)).toBe(true)
      expect(
        service.canManageSocialListeningSetup({
          ...contributor,
          canAccessSocialListening: true,
        }),
      ).toBe(false)
      expect(service.canManageSocialListeningSetup(viewer)).toBe(false)
      // Deprecated alias tracks setup permission
      expect(service.canCreateSocialListeningReports(admin)).toBe(true)
      expect(
        service.canCreateSocialListeningReports({
          ...contributor,
          canAccessSocialListening: true,
        }),
      ).toBe(false)
    })
  })

  describe('buildPortalPermissions role flags', () => {
    it('sets role flags for each client org role', () => {
      expect(service.buildPortalPermissions(admin)).toMatchObject({
        isAdmin: true,
        isContributor: false,
        isViewer: false,
        isSocialAnalyst: false,
      })
      expect(service.buildPortalPermissions(contributor)).toMatchObject({
        isAdmin: false,
        isContributor: true,
        isViewer: false,
        isSocialAnalyst: false,
      })
      expect(service.buildPortalPermissions(viewer)).toMatchObject({
        isAdmin: false,
        isContributor: false,
        isViewer: true,
        isSocialAnalyst: false,
      })
      expect(service.buildPortalPermissions(socialAnalyst)).toMatchObject({
        isAdmin: false,
        isContributor: false,
        isViewer: false,
        isSocialAnalyst: true,
      })
    })
  })

  describe('assertAdminCanBeDemoted', () => {
    it('blocks demoting the last Admin in an org', async () => {
      const prisma = {
        clientOrganizationMembership: {
          count: jest.fn().mockResolvedValue(1),
        },
        clientProject: {
          count: jest.fn(),
        },
      }
      const svc = new ClientAccessService(prisma as never)
      await expect(svc.assertAdminCanBeDemoted('org-1', 'admin-1')).rejects.toThrow(
        /at least one Admin/,
      )
      expect(prisma.clientProject.count).not.toHaveBeenCalled()
    })

    it('blocks demoting an Admin who still owns projects in that org', async () => {
      const prisma = {
        clientOrganizationMembership: {
          count: jest.fn().mockResolvedValue(2),
        },
        clientProject: {
          count: jest.fn().mockResolvedValue(3),
        },
      }
      const svc = new ClientAccessService(prisma as never)
      await expect(svc.assertAdminCanBeDemoted('org-1', 'admin-1')).rejects.toThrow(
        /Transfer ownership of 3 projects first/,
      )
    })
  })
})
