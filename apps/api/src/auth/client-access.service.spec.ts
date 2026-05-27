import { ClientOrgRole } from '@cocreate/database'
import { ClientAccessService } from './client-access.service'

describe('ClientAccessService', () => {
  const service = new ClientAccessService({} as never)

  const owner = {
    id: 'owner-1',
    email: 'owner@test.com',
    role: 'CLIENT' as const,
    status: 'ACTIVE' as const,
    supabaseAuthId: 'sb-1',
    clientOrgRole: ClientOrgRole.OWNER,
    canAccessSocialListening: true,
    organization: {
      id: 'org-1',
      name: 'Acme',
      slug: 'acme',
      logoUrl: null,
      isSocialListeningSubscriber: true,
    },
  }

  const pm = {
    ...owner,
    id: 'pm-1',
    email: 'pm@test.com',
    clientOrgRole: ClientOrgRole.PROJECT_MANAGER,
    canAccessSocialListening: false,
  }

  const member = {
    ...owner,
    id: 'mem-1',
    email: 'mem@test.com',
    clientOrgRole: ClientOrgRole.MEMBER,
    canAccessSocialListening: false,
  }

  it('owner sees all org projects', () => {
    expect(service.accessibleProjectsWhere(owner)).toEqual({ organizationId: 'org-1' })
  })

  it('pm sees created and member projects', () => {
    const where = service.accessibleProjectsWhere(pm)
    expect(where.organizationId).toBe('org-1')
    expect(where.OR).toHaveLength(2)
  })

  it('member sees only explicit memberships', () => {
    expect(service.accessibleProjectsWhere(member)).toEqual({
      organizationId: 'org-1',
      members: { some: { userId: 'mem-1' } },
    })
  })

  it('only owner and pm can create projects', () => {
    expect(service.canCreateProject(owner)).toBe(true)
    expect(service.canCreateProject(pm)).toBe(true)
    expect(service.canCreateProject(member)).toBe(false)
  })

  describe('canUseSocialListening', () => {
    it('owner has access when org is subscribed even if user flag is false', () => {
      const ownerNoFlag = {
        ...owner,
        canAccessSocialListening: false,
      }
      expect(service.canUseSocialListening(ownerNoFlag)).toBe(true)
    })

    it('owner has no access when org is not subscribed', () => {
      const ownerUnsubscribed = {
        ...owner,
        organization: { ...owner.organization!, isSocialListeningSubscriber: false },
      }
      expect(service.canUseSocialListening(ownerUnsubscribed)).toBe(false)
    })

    it('pm requires org subscription and per-user flag', () => {
      expect(service.canUseSocialListening(pm)).toBe(false)
      expect(
        service.canUseSocialListening({ ...pm, canAccessSocialListening: true }),
      ).toBe(true)
    })

    it('member requires org subscription and per-user flag', () => {
      expect(service.canUseSocialListening(member)).toBe(false)
      expect(
        service.canUseSocialListening({ ...member, canAccessSocialListening: true }),
      ).toBe(true)
    })
  })
})
