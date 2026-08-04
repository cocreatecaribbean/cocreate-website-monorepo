import { BadRequestException } from '@nestjs/common'
import {
  CancellationOutcome,
  ClientProjectStatus,
  ProjectRequestStatus,
  ProjectRequestType,
  UserRole,
} from '@cocreate/database'
import { ProjectsService } from './projects.service'

describe('ProjectsService cancellation', () => {
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
      name: 'Acme',
      slug: 'acme',
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

  const activeProject = {
    id: 'proj-1',
    title: 'Brand refresh',
    status: ClientProjectStatus.ACTIVE,
    organizationId: 'org-1',
    organization: { id: 'org-1', name: 'Acme', slug: 'acme' },
    createdBy: null,
    approvedBy: null,
  }

  function baseRequest(overrides: Record<string, unknown> = {}) {
    const now = new Date('2026-07-01T12:00:00.000Z')
    return {
      id: 'req-cancel-1',
      projectId: 'proj-1',
      type: ProjectRequestType.CANCELLATION,
      status: ProjectRequestStatus.OPEN,
      title: 'Cancellation: Brand refresh',
      description: 'Please cancel',
      targetPhase: null,
      createdByUserId: 'client-1',
      resolvedByUserId: null,
      resolvedAt: null,
      cancellationOutcome: null,
      cancellationFeeAmount: null,
      cancellationFeeNotes: null,
      createdAt: now,
      updatedAt: now,
      createdBy: { id: 'client-1', email: 'client@test.com', firstName: null, lastName: null },
      resolvedBy: null,
      attachments: [],
      messages: [],
      project: {
        id: 'proj-1',
        title: 'Brand refresh',
        organizationId: 'org-1',
        organization: { id: 'org-1', name: 'Acme' },
      },
      ...overrides,
    }
  }

  function createService() {
    const tx = {
      projectRequest: {
        update: jest.fn().mockResolvedValue({}),
        findUniqueOrThrow: jest.fn(),
      },
      projectRequestMessage: {
        create: jest.fn().mockResolvedValue({}),
      },
      clientProject: {
        update: jest.fn().mockResolvedValue({}),
      },
    }

    const prisma = {
      clientProject: {
        findUnique: jest.fn().mockResolvedValue(activeProject),
      },
      projectRequest: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      projectActivity: {
        create: jest.fn().mockResolvedValue({
          id: 'act-1',
          createdAt: new Date('2026-07-01T12:00:00.000Z'),
          action: 'request.cancellation_requested',
          metadata: {},
          actor: null,
        }),
      },
      $transaction: jest.fn(async (callback: (inner: typeof tx) => Promise<unknown>) =>
        callback(tx),
      ),
    }

    const notifications = {
      notifyAdmins: jest.fn().mockResolvedValue(undefined),
      notifyOrgClients: jest.fn().mockResolvedValue(undefined),
      adminClientWorkspaceLink: jest.fn(
        (organizationId: string) => `https://admin.test/clients/${organizationId}`,
      ),
      clientProjectLink: jest.fn(
        (projectId: string) => `https://portal.test/projects/${projectId}`,
      ),
    }

    const agencyAccess = {
      assertCanAccessProject: jest.fn().mockResolvedValue(undefined),
      isCoreTeam: jest.fn().mockReturnValue(true),
      canReadRequest: jest.fn().mockReturnValue(true),
    }

    const clientAccess = {
      assertProjectAccess: jest.fn().mockResolvedValue(undefined),
    }

    const messaging = {
      emitThreadMessage: jest.fn(),
      emitThreadAttachment: jest.fn(),
      emitThreadStatus: jest.fn(),
    }

    const service = new ProjectsService(
      prisma as never,
      { isConfigured: false } as never,
      notifications as never,
      { send: jest.fn() } as never,
      clientAccess as never,
      agencyAccess as never,
      messaging as never,
      { inviteMember: jest.fn() } as never,
      { getUserById: jest.fn() } as never,
      {} as never,
      { enqueue: jest.fn() } as never,
    )

    return { service, prisma, tx, notifications, agencyAccess, clientAccess }
  }

  it('reopens a denied cancellation when the client requests again', async () => {
    const { service, prisma, tx } = createService()
    const denied = baseRequest({
      status: ProjectRequestStatus.REJECTED,
      cancellationOutcome: CancellationOutcome.DENIED,
      resolvedAt: new Date('2026-07-02T12:00:00.000Z'),
      resolvedByUserId: 'admin-1',
    })
    const reopened = baseRequest({
      status: ProjectRequestStatus.OPEN,
      description: 'Still want to cancel',
      cancellationOutcome: null,
      resolvedAt: null,
      resolvedByUserId: null,
    })

    prisma.projectRequest.findUnique.mockResolvedValue(denied)
    tx.projectRequest.findUniqueOrThrow.mockResolvedValue(reopened)

    const result = await service.createCancellationRequest(clientActor, 'proj-1', {
      reason: 'Still want to cancel',
    })

    expect(prisma.projectRequest.upsert).not.toHaveBeenCalled()
    expect(tx.projectRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-cancel-1' },
      data: {
        status: ProjectRequestStatus.OPEN,
        description: 'Still want to cancel',
        resolvedAt: null,
        resolvedByUserId: null,
        cancellationOutcome: null,
        cancellationFeeAmount: null,
        cancellationFeeNotes: null,
      },
    })
    expect(tx.projectRequestMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        requestId: 'req-cancel-1',
        authorUserId: 'client-1',
        body: 'Still want to cancel',
      }),
    })
    expect(result.status).toBe('OPEN')
    expect(result.cancellationOutcome).toBeNull()
  })

  it('also reopens legacy denied rows stored as RESOLVED', async () => {
    const { service, prisma, tx } = createService()
    const deniedLegacy = baseRequest({
      status: ProjectRequestStatus.RESOLVED,
      cancellationOutcome: CancellationOutcome.DENIED,
    })
    prisma.projectRequest.findUnique.mockResolvedValue(deniedLegacy)
    tx.projectRequest.findUniqueOrThrow.mockResolvedValue(
      baseRequest({ status: ProjectRequestStatus.OPEN }),
    )

    await service.createCancellationRequest(clientActor, 'proj-1', {
      reason: 'Trying again',
    })

    expect(tx.projectRequest.update).toHaveBeenCalled()
    expect(prisma.projectRequest.upsert).not.toHaveBeenCalled()
  })

  it('blocks a second cancellation request after approval', async () => {
    const { service, prisma } = createService()
    prisma.projectRequest.findUnique.mockResolvedValue(
      baseRequest({
        status: ProjectRequestStatus.RESOLVED,
        cancellationOutcome: CancellationOutcome.APPROVED_NO_FEE,
      }),
    )

    await expect(
      service.createCancellationRequest(clientActor, 'proj-1', { reason: 'Again' }),
    ).rejects.toBeInstanceOf(BadRequestException)

    expect(prisma.projectRequest.upsert).not.toHaveBeenCalled()
  })

  it('denies with REJECTED status and leaves the project active', async () => {
    const { service, prisma, tx, notifications } = createService()
    const open = baseRequest()
    const denied = baseRequest({
      status: ProjectRequestStatus.REJECTED,
      cancellationOutcome: CancellationOutcome.DENIED,
      resolvedAt: new Date('2026-07-03T12:00:00.000Z'),
      resolvedByUserId: 'admin-1',
    })

    prisma.projectRequest.findUnique
      .mockResolvedValueOnce(open)
      .mockResolvedValueOnce(denied)

    const result = await service.resolveCancellation(adminActor, 'req-cancel-1', {
      outcome: CancellationOutcome.DENIED,
      message: 'Please keep the project running.',
    })

    expect(tx.projectRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-cancel-1' },
      data: expect.objectContaining({
        status: ProjectRequestStatus.REJECTED,
        cancellationOutcome: CancellationOutcome.DENIED,
        cancellationFeeAmount: null,
      }),
    })
    expect(tx.clientProject.update).not.toHaveBeenCalled()
    expect(notifications.notifyOrgClients).toHaveBeenCalled()
    expect(result.status).toBe('REJECTED')
    expect(result.cancellationOutcome).toBe('DENIED')
  })

  it('approves with fee metadata and cancels the project', async () => {
    const { service, prisma, tx } = createService()
    const open = baseRequest()
    const approved = baseRequest({
      status: ProjectRequestStatus.RESOLVED,
      cancellationOutcome: CancellationOutcome.APPROVED_WITH_FEE,
      cancellationFeeAmount: 250,
      cancellationFeeNotes: 'Work already started',
      resolvedAt: new Date('2026-07-03T12:00:00.000Z'),
      resolvedByUserId: 'admin-1',
    })

    prisma.projectRequest.findUnique
      .mockResolvedValueOnce(open)
      .mockResolvedValueOnce(approved)

    const result = await service.resolveCancellation(adminActor, 'req-cancel-1', {
      outcome: CancellationOutcome.APPROVED_WITH_FEE,
      feeAmount: 250,
      feeNotes: 'Work already started',
    })

    expect(tx.projectRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-cancel-1' },
      data: expect.objectContaining({
        status: ProjectRequestStatus.RESOLVED,
        cancellationOutcome: CancellationOutcome.APPROVED_WITH_FEE,
        cancellationFeeAmount: 250,
        cancellationFeeNotes: 'Work already started',
      }),
    })
    expect(tx.clientProject.update).toHaveBeenCalledWith({
      where: { id: 'proj-1' },
      data: { status: ClientProjectStatus.CANCELLED },
    })
    expect(result.status).toBe('RESOLVED')
    expect(result.cancellationOutcome).toBe('APPROVED_WITH_FEE')
    expect(result.cancellationFeeAmount).toBe(250)
  })
})
