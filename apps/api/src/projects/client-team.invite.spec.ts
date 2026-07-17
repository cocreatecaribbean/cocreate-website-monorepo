import { ConflictException } from '@nestjs/common'
import { ClientOrgRole, UserRole, UserStatus } from '@cocreate/database'
import { ClientTeamService } from './client-team.service'

describe('ClientTeamService inviteToOrganization (multi-org)', () => {
  const organization = {
    id: 'org-b',
    name: 'Org B',
    slug: 'org-b',
    isSocialListeningSubscriber: false,
  }

  function buildService(prisma: Record<string, unknown>, supabaseAuth?: Record<string, unknown>) {
    return new ClientTeamService(
      prisma as never,
      (supabaseAuth ?? {
        inviteUserByEmail: jest.fn().mockResolvedValue({
          status: 'sent',
          invitationId: 'inv-1',
        }),
      }) as never,
      {} as never,
      {
        notifyClientUsers: jest.fn().mockResolvedValue(undefined),
      } as never,
      {} as never,
    )
  }

  it('attaches an existing CLIENT user to a second org without creating a new User', async () => {
    const existingUser = {
      id: 'user-1',
      email: 'patrick@example.com',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      supabaseAuthId: 'sb-1',
      organizationId: 'org-a',
      lastActiveOrganizationId: 'org-a',
      deletedAt: null,
      organizationMemberships: [],
    }

    const createdMembership = {
      id: 'm-1',
      status: UserStatus.ACTIVE,
      clientOrgRole: ClientOrgRole.VIEWER,
      canAccessSocialListening: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { id: existingUser.id, email: existingUser.email },
    }

    const prisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue(organization),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(existingUser),
        update: jest.fn().mockResolvedValue(existingUser),
        create: jest.fn(),
      },
      clientOrganizationMembership: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'm-elsewhere',
          status: UserStatus.ACTIVE,
        }),
        create: jest.fn().mockResolvedValue(createdMembership),
      },
    }

    const notifications = { notifyClientUsers: jest.fn().mockResolvedValue(undefined) }
    const supabaseAuth = {
      inviteUserByEmail: jest.fn(),
      notifyExistingClientAddedToOrg: jest.fn().mockResolvedValue('sent'),
    }
    const service = new ClientTeamService(
      prisma as never,
      supabaseAuth as never,
      {} as never,
      notifications as never,
      {} as never,
    )

    const result = await service.inviteToOrganization(
      'org-b',
      {
        email: 'patrick@example.com',
        clientOrgRole: ClientOrgRole.VIEWER,
      },
      'admin-1',
    )

    expect(prisma.user.create).not.toHaveBeenCalled()
    expect(prisma.clientOrganizationMembership.create).toHaveBeenCalled()
    expect(notifications.notifyClientUsers).toHaveBeenCalled()
    expect(supabaseAuth.inviteUserByEmail).not.toHaveBeenCalled()
    expect(supabaseAuth.notifyExistingClientAddedToOrg).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'patrick@example.com',
        organizationName: 'Org B',
        roleLabel: 'viewer',
      }),
    )
    expect(result.member.email).toBe('patrick@example.com')
    expect(result.invitation?.status).toBe('added')
  })

  it('rejects when the email is already on this org', async () => {
    const prisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue(organization),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'patrick@example.com',
          role: UserRole.CLIENT,
          deletedAt: null,
          organizationMemberships: [{ id: 'm-existing' }],
        }),
      },
    }

    const service = buildService(prisma)

    await expect(
      service.inviteToOrganization(
        'org-b',
        { email: 'patrick@example.com', clientOrgRole: ClientOrgRole.VIEWER },
        'admin-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it('rejects agency emails', async () => {
    const prisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue(organization),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'ops@agency.com',
          role: UserRole.ADMIN,
          deletedAt: null,
          organizationMemberships: [],
        }),
      },
    }

    const service = buildService(prisma)

    await expect(
      service.inviteToOrganization(
        'org-b',
        { email: 'ops@agency.com', clientOrgRole: ClientOrgRole.VIEWER },
        'admin-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException)
  })
})

describe('ClientTeamService removeOrgMembership', () => {
  function buildService(
    prisma: Record<string, unknown>,
    clientAccess?: Record<string, unknown>,
  ) {
    return new ClientTeamService(
      prisma as never,
      {} as never,
      (clientAccess ?? {
        assertAdminCanBeDemoted: jest.fn().mockResolvedValue(undefined),
      }) as never,
      {} as never,
      {} as never,
    )
  }

  it('deletes membership and project assignments', async () => {
    const membership = {
      id: 'm-1',
      userId: 'user-2',
      organizationId: 'org-b',
      clientOrgRole: ClientOrgRole.CONTRIBUTOR,
      user: {
        id: 'user-2',
        email: 'patrick@example.com',
        role: UserRole.CLIENT,
        deletedAt: null,
      },
    }

    const prisma = {
      clientOrganizationMembership: {
        findUnique: jest.fn().mockResolvedValue(membership),
        delete: jest.fn().mockResolvedValue(membership),
      },
      clientProject: {
        count: jest.fn().mockResolvedValue(0),
      },
      clientProjectMember: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          organizationId: 'org-b',
          lastActiveOrganizationId: 'org-b',
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    }

    const service = buildService(prisma)
    const result = await service.removeOrgMembership('org-b', 'user-2', 'admin-1')

    expect(result).toEqual({ ok: true })
    expect(prisma.clientProjectMember.deleteMany).toHaveBeenCalled()
    expect(prisma.clientOrganizationMembership.delete).toHaveBeenCalledWith({
      where: { id: 'm-1' },
    })
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-2' },
      data: {
        organizationId: null,
        lastActiveOrganizationId: null,
      },
    })
  })

  it('rejects removing yourself', async () => {
    const service = buildService({
      clientOrganizationMembership: {
        findUnique: jest.fn(),
      },
    })

    await expect(
      service.removeOrgMembership('org-b', 'admin-1', 'admin-1'),
    ).rejects.toMatchObject({ message: 'You cannot remove yourself from the team' })
  })

  it('rejects removing a project owner', async () => {
    const membership = {
      id: 'm-1',
      userId: 'user-2',
      organizationId: 'org-b',
      clientOrgRole: ClientOrgRole.CONTRIBUTOR,
      user: {
        id: 'user-2',
        email: 'patrick@example.com',
        role: UserRole.CLIENT,
        deletedAt: null,
      },
    }

    const prisma = {
      clientOrganizationMembership: {
        findUnique: jest.fn().mockResolvedValue(membership),
      },
      clientProject: {
        count: jest.fn().mockResolvedValue(2),
      },
    }

    const service = buildService(prisma)

    await expect(
      service.removeOrgMembership('org-b', 'user-2', 'admin-1'),
    ).rejects.toMatchObject({
      message:
        'Cannot remove a project owner — transfer ownership of their projects first',
    })
  })
})
