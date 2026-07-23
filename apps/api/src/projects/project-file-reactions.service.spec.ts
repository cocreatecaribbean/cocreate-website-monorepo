import { ProjectAttachmentVisibility, UserRole } from '@cocreate/database'
import { ProjectFileReactionsService } from './project-file-reactions.service'

describe('ProjectFileReactionsService actor routing', () => {
  const prisma = {
    projectAttachment: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    projectFileReaction: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    projectActivity: {
      create: jest.fn().mockResolvedValue({}),
    },
    projectRequestMessage: {
      create: jest.fn().mockResolvedValue({
        id: 'msg-1',
        requestId: 'req-1',
        authorUserId: 'client-1',
        authorRole: 'CLIENT',
        body: 'system',
        messageKind: 'SYSTEM',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        author: { id: 'client-1', email: 'client@test.com', profile: null },
        attachmentLinks: [],
      }),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'client-1',
        email: 'client@test.com',
        profile: { displayName: 'Alex', jobTitle: null, avatarStoragePath: null },
      }),
    },
  }

  const clientAccess = {
    canReactToFiles: jest.fn().mockReturnValue(true),
    assertProjectAccess: jest.fn().mockResolvedValue(undefined),
  }

  const agencyAccess = {
    assertCanAccessProject: jest.fn().mockResolvedValue(undefined),
  }

  const messaging = {
    emitThreadAttachment: jest.fn(),
    emitThreadMessage: jest.fn(),
  }

  const notifications = {
    notifyAdmins: jest.fn().mockResolvedValue(undefined),
    adminClientWorkspaceLink: jest.fn().mockReturnValue('http://admin/clients/org-1'),
  }

  const service = new ProjectFileReactionsService(
    prisma as never,
    clientAccess as never,
    agencyAccess as never,
    messaging as never,
    notifications as never,
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const clientActor = {
    id: 'client-1',
    email: 'client@test.com',
    role: UserRole.CLIENT,
    status: 'ACTIVE' as const,
    supabaseAuthId: 'sb-client',
    clientOrgRole: 'ADMIN' as const,
    canAccessSocialListening: false,
    canAccessGetHelp: true,
    memberships: [],
    organization: {
      id: 'org-1',
      name: 'Acme',
      slug: 'acme',
      logoUrl: null,
      isSocialListeningSubscriber: false,
    },
  }

  function agencyActor(role: UserRole) {
    return {
      id: `agency-${role}`,
      email: `${role.toLowerCase()}@cocreate.test`,
      role,
      status: 'ACTIVE' as const,
      supabaseAuthId: `sb-${role}`,
    }
  }

  it('routes CLIENT actors through clientAccess', async () => {
    await service.listTopPicksForProject(clientActor as never, 'project-1')

    expect(clientAccess.assertProjectAccess).toHaveBeenCalledWith(
      clientActor,
      'project-1',
      'read',
    )
    expect(agencyAccess.assertCanAccessProject).not.toHaveBeenCalled()
  })

  it.each([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COLLABORATOR])(
    'routes %s actors through agencyAccess',
    async (role) => {
      const actor = agencyActor(role)
      await service.listTopPicksForProject(actor as never, 'project-1')

      expect(agencyAccess.assertCanAccessProject).toHaveBeenCalledWith(
        actor,
        'project-1',
      )
      expect(clientAccess.assertProjectAccess).not.toHaveBeenCalled()
    },
  )

  it('does not treat SUPER_ADMIN as a client when reading CLIENT visibility files', async () => {
    await service.listTopPicksForProject(
      agencyActor(UserRole.SUPER_ADMIN) as never,
      'project-1',
    )

    // CLIENT-only visibility check must not run for agency actors
    expect(clientAccess.assertProjectAccess).not.toHaveBeenCalled()
    expect(prisma.projectAttachment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          projectId: 'project-1',
          reactions: expect.any(Object),
        }),
      }),
    )
    const where = prisma.projectAttachment.findMany.mock.calls[0][0].where
    expect(where.visibility).toBeUndefined()
  })

  it('filters CLIENT visibility for client actors', async () => {
    await service.listTopPicksForProject(clientActor as never, 'project-1')

    const where = prisma.projectAttachment.findMany.mock.calls[0][0].where
    expect(where.visibility).toBe(ProjectAttachmentVisibility.CLIENT)
  })

  describe('listReactionsForProject', () => {
    it('routes CLIENT actors through clientAccess and filters visibility', async () => {
      await service.listReactionsForProject(clientActor as never, 'project-1')

      expect(clientAccess.assertProjectAccess).toHaveBeenCalledWith(
        clientActor,
        'project-1',
        'read',
      )
      expect(agencyAccess.assertCanAccessProject).not.toHaveBeenCalled()
      const where = prisma.projectAttachment.findMany.mock.calls[0][0].where
      expect(where.visibility).toBe(ProjectAttachmentVisibility.CLIENT)
      expect(where.OR).toEqual(
        expect.arrayContaining([
          { reactions: { some: {} } },
          { reviewRequested: true },
          { approvedAt: { not: null } },
          { changesRequestedAt: { not: null } },
        ]),
      )
    })

    it.each([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COLLABORATOR])(
      'routes %s actors through agencyAccess without visibility filter',
      async (role) => {
        const actor = agencyActor(role)
        await service.listReactionsForProject(actor as never, 'project-1')

        expect(agencyAccess.assertCanAccessProject).toHaveBeenCalledWith(
          actor,
          'project-1',
        )
        expect(clientAccess.assertProjectAccess).not.toHaveBeenCalled()
        const where = prisma.projectAttachment.findMany.mock.calls[0][0].where
        expect(where.visibility).toBeUndefined()
        expect(where.OR).toEqual(
          expect.arrayContaining([
            { reactions: { some: {} } },
            { reviewRequested: true },
          ]),
        )
      },
    )
  })

  describe('reaction emit', () => {
    const attachmentWithThread = {
      id: 'att-1',
      projectId: 'project-1',
      visibility: ProjectAttachmentVisibility.CLIENT,
      requestId: 'req-1',
      messageLinks: [],
      fileName: 'file.png',
      mimeType: 'image/png',
      sizeBytes: 10,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      reactions: [],
      reviewRequested: false,
      approvedAt: null,
      approvedByUserId: null,
      changesRequestedAt: null,
      project: {
        id: 'project-1',
        title: 'Brand kit',
        organizationId: 'org-1',
      },
    }

    beforeEach(() => {
      prisma.projectAttachment.findUnique.mockResolvedValue(attachmentWithThread)
      prisma.projectFileReaction.upsert.mockResolvedValue({})
      prisma.projectFileReaction.deleteMany.mockResolvedValue({ count: 1 })
    })

    it('emits thread:attachment when setting a reaction on a thread file', async () => {
      await service.setReaction(clientActor as never, 'att-1', 'LOVE_THIS')
      expect(messaging.emitThreadAttachment).toHaveBeenCalledWith('req-1')
    })

    it('emits thread:attachment when clearing a reaction on a thread file', async () => {
      await service.clearReaction(clientActor as never, 'att-1')
      expect(messaging.emitThreadAttachment).toHaveBeenCalledWith('req-1')
    })

    it('emits via message links when the attachment requestId is null (chat uploads)', async () => {
      prisma.projectAttachment.findUnique.mockResolvedValue({
        ...attachmentWithThread,
        requestId: null,
        messageLinks: [
          {
            message: {
              requestId: 'req-chat',
              request: { id: 'req-chat', type: 'PROGRESS' },
            },
          },
          {
            message: {
              requestId: 'req-chat',
              request: { id: 'req-chat', type: 'PROGRESS' },
            },
          },
        ],
      })
      await service.setReaction(clientActor as never, 'att-1', 'LOVE_THIS')
      expect(messaging.emitThreadAttachment).toHaveBeenCalledTimes(1)
      expect(messaging.emitThreadAttachment).toHaveBeenCalledWith('req-chat')
    })

    it('skips emit when the attachment has no thread at all', async () => {
      prisma.projectAttachment.findUnique.mockResolvedValue({
        ...attachmentWithThread,
        requestId: null,
        messageLinks: [],
      })
      await service.setReaction(clientActor as never, 'att-1', 'SHIP_IT')
      expect(messaging.emitThreadAttachment).not.toHaveBeenCalled()
    })
  })
})