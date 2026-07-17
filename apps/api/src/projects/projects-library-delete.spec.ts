import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import {
  ProjectAttachmentVisibility,
  UserRole,
} from '@cocreate/database'
import { ProjectsService } from './projects.service'

describe('ProjectsService library attachment delete', () => {
  const adminActor = {
    id: 'admin-1',
    email: 'admin@cocreate.com',
    role: UserRole.ADMIN,
    status: 'ACTIVE',
    supabaseAuthId: 'sb-admin',
  } as const

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

  function createService() {
    const tx = {
      projectRequestMessageAttachment: {
        delete: jest.fn().mockResolvedValue({ messageId: 'msg-1', attachmentId: 'att-1' }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        count: jest.fn().mockResolvedValue(0),
      },
      projectAttachment: {
        delete: jest.fn().mockResolvedValue({ id: 'att-1' }),
      },
    }

    const prisma = {
      projectAttachment: {
        findUnique: jest.fn(),
      },
      projectRequestMessageAttachment: {
        findUnique: jest.fn(),
      },
      projectRequest: {
        findUnique: jest.fn(),
      },
      projectActivity: {
        create: jest.fn().mockResolvedValue({
          id: 'act-1',
          createdAt: new Date('2026-06-20T10:00:00.000Z'),
          action: 'attachment.removed',
          metadata: {},
          actor: null,
        }),
      },
      $transaction: jest.fn(async (callback: (inner: typeof tx) => Promise<void>) =>
        callback(tx),
      ),
    }

    const storage = {
      deleteObject: jest.fn().mockResolvedValue(undefined),
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
      storage as never,
      { create: jest.fn() } as never,
      { send: jest.fn() } as never,
      clientAccess as never,
      agencyAccess as never,
      messaging as never,
      { inviteMember: jest.fn() } as never,
      { getUserById: jest.fn() } as never,
      {} as never,
    )

    return { service, prisma, tx, storage, messaging, agencyAccess, clientAccess }
  }

  it('removes all message links and deletes storage when messageId is omitted', async () => {
    const { service, prisma, tx, storage, messaging } = createService()

    prisma.projectAttachment.findUnique.mockResolvedValue({
      id: 'att-1',
      projectId: 'proj-1',
      storagePath: 'org/proj/att-1.png',
      fileName: 'hero.png',
      uploadedByUserId: 'admin-1',
      visibility: ProjectAttachmentVisibility.CLIENT,
      messageLinks: [{ message: { requestId: 'req-progress' } }],
    })

    const result = await service.removeAttachmentFromMessage(adminActor, 'att-1')

    expect(result).toEqual({ ok: true })
    expect(tx.projectRequestMessageAttachment.deleteMany).toHaveBeenCalledWith({
      where: { attachmentId: 'att-1' },
    })
    expect(tx.projectAttachment.delete).toHaveBeenCalledWith({ where: { id: 'att-1' } })
    expect(storage.deleteObject).toHaveBeenCalledWith('org/proj/att-1.png')
    expect(messaging.emitThreadAttachment).toHaveBeenCalledWith('req-progress')
  })

  it('still removes a single message link when messageId is provided', async () => {
    const { service, prisma } = createService()

    prisma.projectRequestMessageAttachment.findUnique.mockResolvedValue({
      messageId: 'msg-1',
      attachmentId: 'att-1',
      message: {
        request: {
          id: 'req-progress',
          projectId: 'proj-1',
          project: { organization: { id: 'org-1', name: 'Acme' } },
        },
      },
      attachment: {
        id: 'att-1',
        projectId: 'proj-1',
        storagePath: 'org/proj/att-1.png',
        fileName: 'hero.png',
        uploadedByUserId: 'admin-1',
        visibility: ProjectAttachmentVisibility.CLIENT,
      },
    })

    const requestRow = {
      id: 'req-progress',
      type: 'PROGRESS',
      projectId: 'proj-1',
      title: 'Progress',
      status: 'OPEN',
      createdAt: new Date('2026-06-20T10:00:00.000Z'),
      updatedAt: new Date('2026-06-20T10:00:00.000Z'),
      project: { organization: { id: 'org-1', name: 'Acme' } },
      messages: [],
      attachments: [],
    }

    prisma.projectRequest.findUnique.mockResolvedValue(requestRow)

    const result = await service.removeAttachmentFromMessage(
      adminActor,
      'att-1',
      'msg-1',
    )

    expect(result.ok).toBe(true)
    expect(result.thread).toBeDefined()
  })

  it('blocks clients from deleting files they did not upload', async () => {
    const { service, prisma } = createService()

    prisma.projectAttachment.findUnique.mockResolvedValue({
      id: 'att-1',
      projectId: 'proj-1',
      storagePath: 'org/proj/att-1.png',
      fileName: 'hero.png',
      uploadedByUserId: 'admin-1',
      visibility: ProjectAttachmentVisibility.CLIENT,
      messageLinks: [],
    })

    await expect(
      service.removeAttachmentFromMessage(clientActor, 'att-1'),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('returns not found when attachment is missing', async () => {
    const { service, prisma } = createService()
    prisma.projectAttachment.findUnique.mockResolvedValue(null)

    await expect(
      service.removeAttachmentFromMessage(adminActor, 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})
