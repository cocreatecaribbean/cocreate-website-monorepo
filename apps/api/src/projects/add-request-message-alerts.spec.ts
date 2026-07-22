import {
  ProjectMessageAuthorRole,
  ProjectRequestStatus,
  ProjectRequestType,
  UserRole,
} from '@cocreate/database'
import { ProjectsService } from './projects.service'

describe('ProjectsService addRequestMessage alert copy', () => {
  const clientActor = {
    id: 'client-1',
    email: 'client@test.com',
    role: 'CLIENT' as const,
    status: 'ACTIVE' as const,
    supabaseAuthId: 'sb-client',
    clientOrgRole: 'ADMIN' as const,
    canAccessSocialListening: false,
    canAccessGetHelp: true,
    organization: {
      id: 'org-1',
      name: 'Traileverse',
      slug: 'traileverse',
      logoUrl: null,
      isSocialListeningSubscriber: false,
    },
  }

  const adminActor = {
    id: 'admin-1',
    email: 'admin@cocreate.com',
    role: UserRole.ADMIN,
    status: 'ACTIVE',
    supabaseAuthId: 'sb-admin',
  } as const

  function createService() {
    const prisma = {
      projectRequest: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      projectRequestMessage: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      projectActivity: {
        create: jest.fn().mockResolvedValue({
          id: 'act-1',
          projectId: 'proj-1',
          actorUserId: 'client-1',
          action: 'request.message',
          metadata: {},
          createdAt: new Date('2026-07-19T15:00:00.000Z'),
        }),
      },
    }

    const notifications = {
      notifyAdmins: jest.fn().mockResolvedValue(undefined),
      notifyOrgClients: jest.fn().mockResolvedValue(undefined),
      markInboxReadForRequest: jest.fn().mockResolvedValue(undefined),
      adminClientWorkspaceLink: jest.fn(
        (organizationId: string) =>
          `http://admin.test/clients/${organizationId}`,
      ),
      clientPortalUrl: jest.fn(() => 'http://portal.test'),
    }

    const clientAccess = {
      assertProjectAccess: jest.fn().mockResolvedValue(undefined),
      assertCanSendProjectMessage: jest.fn().mockResolvedValue(undefined),
    }

    const agencyAccess = {
      assertCanAccessProject: jest.fn().mockResolvedValue(undefined),
      assertCanPostToRequest: jest.fn().mockResolvedValue(undefined),
      canReadRequest: jest.fn().mockReturnValue(true),
    }

    const messaging = {
      emitThreadMessage: jest.fn(),
      emitThreadAttachment: jest.fn(),
      emitThreadStatus: jest.fn(),
    }

    const threadSummaryStore = {
      invalidate: jest.fn().mockResolvedValue(undefined),
    }

    const messageDigests = {
      activeAdminRecipients: jest.fn().mockResolvedValue(['admin-1']),
      activeClientRecipients: jest.fn().mockResolvedValue(['client-1']),
      enqueueProjectDigests: jest.fn().mockResolvedValue(undefined),
      cancelPendingDigests: jest.fn().mockResolvedValue(undefined),
    }

    const service = new ProjectsService(
      prisma as never,
      { createUploadUrl: jest.fn() } as never,
      notifications as never,
      { send: jest.fn() } as never,
      clientAccess as never,
      agencyAccess as never,
      messaging as never,
      { inviteMember: jest.fn() } as never,
      { getUserById: jest.fn() } as never,
      threadSummaryStore as never,
      messageDigests as never,
    )

    return { service, prisma, notifications, messageDigests }
  }

  const staleThreadRequest = {
    id: 'req-progress',
    projectId: 'proj-1',
    type: ProjectRequestType.PROGRESS,
    status: ProjectRequestStatus.IN_PROGRESS,
    title: 'gandola',
    project: {
      id: 'proj-1',
      title: 'new project',
      organizationId: 'org-1',
      organization: { id: 'org-1', name: 'Traileverse' },
    },
  }

  const createdMessage = {
    id: 'msg-1',
    requestId: 'req-progress',
    authorUserId: 'client-1',
    authorRole: ProjectMessageAuthorRole.CLIENT,
    body: 'Hello from progress',
    messageKind: 'CHAT',
    createdAt: new Date('2026-07-19T15:00:00.000Z'),
    updatedAt: new Date('2026-07-19T15:00:00.000Z'),
    author: {
      id: 'client-1',
      email: 'client@test.com',
      profile: null,
    },
    attachmentLinks: [],
  }

  it('uses project title (not stale thread title) for in-app admin alerts and enqueues digests', async () => {
    const { service, prisma, notifications, messageDigests } = createService()
    prisma.projectRequest.findUnique.mockResolvedValue(staleThreadRequest)
    prisma.projectRequestMessage.create.mockResolvedValue(createdMessage)

    await service.addRequestMessage(clientActor, 'req-progress', {
      body: 'Hello from progress',
    })

    expect(notifications.notifyAdmins).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Client replied: new project',
        body: 'Hello from progress',
      }),
    )
    expect(notifications.notifyAdmins.mock.calls[0][0].email).toBeUndefined()
    expect(messageDigests.enqueueProjectDigests).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserIds: ['admin-1'],
        requestId: 'req-progress',
        projectTitle: 'new project',
        preview: 'Hello from progress',
      }),
    )

    const payload = notifications.notifyAdmins.mock.calls[0][0]
    expect(payload.title).not.toContain('gandola')
  })

  it('uses project title for in-app client alerts and enqueues digests (no immediate email)', async () => {
    const { service, prisma, notifications, messageDigests } = createService()
    prisma.projectRequest.findUnique.mockResolvedValue(staleThreadRequest)
    prisma.projectRequestMessage.create.mockResolvedValue({
      ...createdMessage,
      authorUserId: 'admin-1',
      authorRole: ProjectMessageAuthorRole.ADMIN,
      author: {
        id: 'admin-1',
        email: 'admin@cocreate.com',
        profile: null,
      },
    })

    await service.addRequestMessage(adminActor, 'req-progress', {
      body: 'Hello from progress',
    })

    expect(notifications.notifyOrgClients).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'CoCreate replied: new project',
        body: 'Hello from progress',
        href: expect.stringContaining('projectTab=progress'),
      }),
    )
    expect(notifications.notifyOrgClients.mock.calls[0][0].email).toBeUndefined()
    expect(messageDigests.enqueueProjectDigests).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserIds: ['client-1'],
        requestId: 'req-progress',
        projectTitle: 'new project',
      }),
    )

    const payload = notifications.notifyOrgClients.mock.calls[0][0]
    expect(payload.title).not.toContain('gandola')
  })
})
