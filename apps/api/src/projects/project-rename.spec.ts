import { ForbiddenException } from '@nestjs/common'
import {
  ClientProjectStatus,
  ProjectRequestType,
  UserRole,
} from '@cocreate/database'
import { ProjectsService } from './projects.service'

describe('ProjectsService project rename', () => {
  const adminActor = {
    id: 'admin-1',
    email: 'admin@cocreate.com',
    role: UserRole.ADMIN,
    status: 'ACTIVE',
    supabaseAuthId: 'sb-admin',
  } as const

  const clientAdmin = {
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

  const clientContributor = {
    ...clientAdmin,
    id: 'client-2',
    email: 'contributor@test.com',
    clientOrgRole: 'CONTRIBUTOR' as const,
  }

  const projectRow = {
    id: 'proj-1',
    organizationId: 'org-1',
    title: 'new project',
    description: 'Brief',
    status: ClientProjectStatus.ACTIVE,
    phase: 'DISCOVERY',
    coverStoragePath: null,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-01T00:00:00.000Z'),
    submittedAt: new Date('2026-07-01T00:00:00.000Z'),
    approvedAt: new Date('2026-07-02T00:00:00.000Z'),
    completedAt: null,
    createdByUserId: 'client-1',
    approvedByUserId: 'admin-1',
    completedByUserId: null,
    ownerUserId: 'client-1',
    organization: { id: 'org-1', name: 'Traileverse', slug: 'traileverse' },
    createdBy: { id: 'client-1', email: 'client@test.com', profile: null },
    approvedBy: { id: 'admin-1', email: 'admin@cocreate.com', profile: null },
    completedBy: null,
  }

  function createService(overrides?: {
    assertCanCreateProject?: jest.Mock
  }) {
    const prisma = {
      clientProject: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
      projectRequest: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      projectActivity: {
        create: jest.fn().mockResolvedValue({
          id: 'act-1',
          projectId: 'proj-1',
          actorUserId: 'admin-1',
          action: 'project.renamed',
          metadata: {},
          createdAt: new Date('2026-07-19T15:00:00.000Z'),
        }),
      },
    }

    const clientAccess = {
      assertCanCreateProject:
        overrides?.assertCanCreateProject ??
        jest.fn().mockResolvedValue(undefined),
      assertProjectAccess: jest.fn().mockResolvedValue(undefined),
    }

    const agencyAccess = {
      isCoreTeam: jest.fn().mockReturnValue(true),
    }

    const storage = {
      isConfigured: false,
      createUploadUrl: jest.fn(),
      createDownloadUrl: jest.fn(),
      getSignedUrl: jest.fn().mockResolvedValue(null),
    }

    const service = new ProjectsService(
      prisma as never,
      storage as never,
      {
        notifyOrgClients: jest.fn(),
        clientProjectLink: jest.fn(() => 'http://portal.test/p'),
      } as never,
      { send: jest.fn() } as never,
      clientAccess as never,
      agencyAccess as never,
      {
        emitThreadMessage: jest.fn(),
        emitThreadAttachment: jest.fn(),
        emitThreadStatus: jest.fn(),
      } as never,
      { inviteMember: jest.fn() } as never,
      { getUserById: jest.fn() } as never,
      { invalidate: jest.fn() } as never,
    )

    return { service, prisma, clientAccess, agencyAccess }
  }

  it('admin rename updates project title and syncs ONBOARDING thread', async () => {
    const { service, prisma } = createService()
    const renamed = { ...projectRow, title: 'Renamed project' }

    prisma.clientProject.findUnique
      .mockResolvedValueOnce(projectRow)
      .mockResolvedValueOnce({ title: 'new project' })
    prisma.clientProject.update.mockResolvedValue({ title: 'Renamed project' })
    prisma.clientProject.findUniqueOrThrow.mockResolvedValue(renamed)

    const result = await service.updateProject(adminActor, 'proj-1', {
      title: 'Renamed project',
    })

    expect(prisma.clientProject.update).toHaveBeenCalledWith({
      where: { id: 'proj-1' },
      data: { title: 'Renamed project' },
    })
    expect(prisma.projectRequest.updateMany).toHaveBeenCalledWith({
      where: { projectId: 'proj-1', type: ProjectRequestType.ONBOARDING },
      data: { title: 'Renamed project' },
    })
    expect(prisma.projectActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'project.renamed',
          metadata: {
            previousTitle: 'new project',
            title: 'Renamed project',
          },
        }),
      }),
    )
    expect(result.title).toBe('Renamed project')
  })

  it('does not rewrite PROGRESS titles when renaming', async () => {
    const { service, prisma } = createService()
    const renamed = { ...projectRow, title: 'Renamed project' }

    prisma.clientProject.findUnique
      .mockResolvedValueOnce(projectRow)
      .mockResolvedValueOnce({ title: 'new project' })
    prisma.clientProject.update.mockResolvedValue({ title: 'Renamed project' })
    prisma.clientProject.findUniqueOrThrow.mockResolvedValue(renamed)

    await service.updateProject(adminActor, 'proj-1', {
      title: 'Renamed project',
    })

    expect(prisma.projectRequest.updateMany).toHaveBeenCalledTimes(1)
    expect(prisma.projectRequest.updateMany.mock.calls[0][0].where.type).toBe(
      ProjectRequestType.ONBOARDING,
    )
  })

  it('skips writes when the title is unchanged', async () => {
    const { service, prisma } = createService()

    prisma.clientProject.findUnique
      .mockResolvedValueOnce(projectRow)
      .mockResolvedValueOnce({ title: 'new project' })
    prisma.clientProject.findUniqueOrThrow.mockResolvedValue(projectRow)

    await service.updateProject(adminActor, 'proj-1', {
      title: 'new project',
    })

    expect(prisma.clientProject.update).not.toHaveBeenCalled()
    expect(prisma.projectRequest.updateMany).not.toHaveBeenCalled()
    expect(prisma.projectActivity.create).not.toHaveBeenCalled()
  })

  it('allows client org admins to rename projects they can access', async () => {
    const { service, prisma, clientAccess } = createService()
    const renamed = { ...projectRow, title: 'Client renamed' }

    prisma.clientProject.findUnique
      .mockResolvedValueOnce(projectRow)
      .mockResolvedValueOnce({ title: 'new project' })
    prisma.clientProject.update.mockResolvedValue({ title: 'Client renamed' })
    prisma.clientProject.findUniqueOrThrow.mockResolvedValue(renamed)

    const result = await service.renameForClient(clientAdmin, 'proj-1', {
      title: 'Client renamed',
    })

    expect(clientAccess.assertCanCreateProject).toHaveBeenCalledWith(clientAdmin)
    expect(clientAccess.assertProjectAccess).toHaveBeenCalledWith(
      clientAdmin,
      'proj-1',
      'VIEW',
    )
    expect(result.title).toBe('Client renamed')
  })

  it('forbids client non-admins from renaming', async () => {
    const { service, clientAccess } = createService({
      assertCanCreateProject: jest
        .fn()
        .mockRejectedValue(
          new ForbiddenException('Only organization admins can create projects'),
        ),
    })

    await expect(
      service.renameForClient(clientContributor, 'proj-1', {
        title: 'Nope',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(clientAccess.assertProjectAccess).not.toHaveBeenCalled()
  })
})
