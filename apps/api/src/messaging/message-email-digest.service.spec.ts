import {
  MessageEmailDigestAudience,
  MessageEmailDigestChannel,
  ProjectRequestType,
  UserStatus,
} from '@cocreate/database'
import {
  MESSAGE_DIGEST_ACTIVE_MS,
  MESSAGE_DIGEST_QUIET_MS,
  MessageEmailDigestService,
} from './message-email-digest.service'
import { MessagingPresenceService } from './messaging-presence.service'

describe('MessageEmailDigestService', () => {
  function createService(overrides?: {
    presence?: Partial<MessagingPresenceService>
    lastSeenAt?: Date | null
  }) {
    const messageEmailDigest = {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'digest-1' }),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findMany: jest.fn().mockResolvedValue([]),
    }
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          lastSeenAt: overrides?.lastSeenAt ?? null,
        }),
        update: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([{ id: 'admin-1' }]),
      },
      messageEmailDigest,
      orgInboxReadCursor: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      orgInboxMessage: {
        findFirst: jest.fn().mockResolvedValue({
          createdAt: new Date('2026-07-22T12:00:00.000Z'),
        }),
      },
      portalNotification: {
        count: jest.fn().mockResolvedValue(1),
      },
      clientOrganizationMembership: {
        findMany: jest.fn().mockResolvedValue([{ userId: 'client-1' }]),
      },
    }

    const mail = { send: jest.fn().mockResolvedValue('sent') }
    const presence = {
      isInThreadRoom: jest.fn().mockReturnValue(false),
      isInInboxRoom: jest.fn().mockReturnValue(false),
      ...overrides?.presence,
    }

    const config = {
      get: jest.fn((key: string) => {
        if (key === 'CLIENT_PORTAL_URL') return 'http://portal.test'
        if (key === 'ADMIN_CENTER_URL') return 'http://admin.test'
        return undefined
      }),
    }

    const service = new MessageEmailDigestService(
      prisma as never,
      config as never,
      mail as never,
      presence as never,
    )

    return { service, prisma, mail, presence, messageEmailDigest }
  }

  describe('deep links', () => {
    it('builds client/admin project and inbox links with correct tabs', () => {
      const { service } = createService()
      expect(service.clientProjectDeepLink('proj-1', ProjectRequestType.PROGRESS)).toBe(
        'http://portal.test/?ccView=projects&projectId=proj-1&projectTab=progress',
      )
      expect(service.clientProjectDeepLink('proj-1', ProjectRequestType.ONBOARDING)).toBe(
        'http://portal.test/?ccView=projects&projectId=proj-1&projectTab=onboarding',
      )
      expect(
        service.adminProjectDeepLink('org-1', 'proj-1', ProjectRequestType.PROGRESS),
      ).toBe('http://admin.test/clients/org-1/projects/proj-1?tab=progress')
      expect(service.clientInboxDeepLink('conv-1')).toBe(
        'http://portal.test/?ccView=messages&conversationId=conv-1',
      )
      expect(service.adminInboxDeepLink('org-1', 'conv-1')).toBe(
        'http://admin.test/messages?organizationId=org-1&conversationId=conv-1',
      )
    })
  })

  describe('buildDigestEmail', () => {
    it('summarizes count, surface, and CTA', () => {
      const { service } = createService()
      const email = service.buildDigestEmail({
        messageCount: 3,
        surfaceLabel: 'Project updates',
        projectTitle: 'Acme refresh',
        lastPreview: 'Latest note',
        lastAuthorLabel: 'jamie',
        deepLinkUrl: 'http://portal.test/?ccView=projects&projectId=p1&projectTab=progress',
      })
      expect(email.subject).toBe('3 new messages in Project updates — Acme refresh')
      expect(email.html).toContain('Open conversation')
      expect(email.html).toContain('Latest note')
      expect(email.actionLink).toContain('projectTab=progress')
    })
  })

  describe('enqueue', () => {
    it('skips INTERNAL project digests', async () => {
      const { service, messageEmailDigest } = createService()
      await service.enqueueProjectDigests({
        recipientUserIds: ['admin-1'],
        audience: MessageEmailDigestAudience.ADMIN,
        requestId: 'req-1',
        requestType: ProjectRequestType.INTERNAL,
        organizationId: 'org-1',
        projectId: 'proj-1',
        projectTitle: 'Secret',
        preview: 'hi',
        authorLabel: 'client',
        authorUserId: 'client-1',
      })
      expect(messageEmailDigest.create).not.toHaveBeenCalled()
    })

    it('suppresses enqueue when recipient is in the socket room', async () => {
      const { service, messageEmailDigest, presence } = createService({
        presence: {
          isInThreadRoom: jest.fn().mockReturnValue(true),
        },
      })
      await service.enqueueProjectDigests({
        recipientUserIds: ['admin-1'],
        audience: MessageEmailDigestAudience.ADMIN,
        requestId: 'req-1',
        requestType: ProjectRequestType.PROGRESS,
        organizationId: 'org-1',
        projectId: 'proj-1',
        projectTitle: 'Acme',
        preview: 'hi',
        authorLabel: 'client',
        authorUserId: 'client-1',
      })
      expect(presence.isInThreadRoom).toHaveBeenCalledWith('admin-1', 'req-1')
      expect(messageEmailDigest.create).not.toHaveBeenCalled()
    })

    it('suppresses enqueue when lastSeenAt is within the active window', async () => {
      const { service, messageEmailDigest } = createService({
        lastSeenAt: new Date(Date.now() - MESSAGE_DIGEST_ACTIVE_MS / 2),
      })
      await service.enqueueProjectDigests({
        recipientUserIds: ['admin-1'],
        audience: MessageEmailDigestAudience.ADMIN,
        requestId: 'req-1',
        requestType: ProjectRequestType.PROGRESS,
        organizationId: 'org-1',
        projectId: 'proj-1',
        projectTitle: 'Acme',
        preview: 'hi',
        authorLabel: 'client',
        authorUserId: 'client-1',
      })
      expect(messageEmailDigest.create).not.toHaveBeenCalled()
    })

    it('creates a pending digest with quiet-window schedule', async () => {
      const before = Date.now()
      const { service, messageEmailDigest } = createService({
        lastSeenAt: new Date(Date.now() - MESSAGE_DIGEST_ACTIVE_MS - 60_000),
      })
      await service.enqueueProjectDigests({
        recipientUserIds: ['admin-1'],
        audience: MessageEmailDigestAudience.ADMIN,
        requestId: 'req-1',
        requestType: ProjectRequestType.PROGRESS,
        organizationId: 'org-1',
        projectId: 'proj-1',
        projectTitle: 'Acme',
        preview: 'hello',
        authorLabel: 'client',
        authorUserId: 'client-1',
      })
      expect(messageEmailDigest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recipientUserId: 'admin-1',
            channel: MessageEmailDigestChannel.PROJECT_REQUEST,
            threadKey: 'req-1',
            messageCount: 1,
            lastPreview: 'hello',
            deepLinkUrl: expect.stringContaining('tab=progress'),
          }),
        }),
      )
      const scheduled = messageEmailDigest.create.mock.calls[0][0].data
        .scheduledSendAt as Date
      expect(scheduled.getTime()).toBeGreaterThanOrEqual(before + MESSAGE_DIGEST_QUIET_MS - 50)
      expect(scheduled.getTime()).toBeLessThanOrEqual(Date.now() + MESSAGE_DIGEST_QUIET_MS + 50)
    })

    it('resets quiet window and increments count on upsert', async () => {
      const { service, messageEmailDigest } = createService({
        lastSeenAt: new Date(Date.now() - MESSAGE_DIGEST_ACTIVE_MS - 60_000),
      })
      messageEmailDigest.findFirst.mockResolvedValue({ id: 'pending-1' })
      await service.enqueueInboxDigests({
        recipientUserIds: ['admin-1'],
        audience: MessageEmailDigestAudience.ADMIN,
        conversationId: 'conv-1',
        organizationId: 'org-1',
        conversationSubject: 'Billing',
        preview: 'second',
        authorLabel: 'client',
        authorUserId: 'client-1',
      })
      expect(messageEmailDigest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pending-1' },
          data: expect.objectContaining({
            messageCount: { increment: 1 },
            lastPreview: 'second',
          }),
        }),
      )
      expect(messageEmailDigest.create).not.toHaveBeenCalled()
    })
  })

  describe('processDueDigests', () => {
    it('sends due digests and marks sent', async () => {
      const { service, mail, messageEmailDigest, prisma } = createService()
      messageEmailDigest.findMany.mockResolvedValue([
        {
          id: 'digest-1',
          recipientUserId: 'admin-1',
          channel: MessageEmailDigestChannel.PROJECT_REQUEST,
          threadKey: 'req-1',
          messageCount: 2,
          surfaceLabel: 'Project updates',
          projectTitle: 'Acme',
          lastPreview: 'yo',
          lastAuthorLabel: 'client',
          deepLinkUrl: 'http://admin.test/clients/org-1/projects/proj-1?tab=progress',
          recipient: {
            id: 'admin-1',
            email: 'admin@test.com',
            status: UserStatus.ACTIVE,
          },
        },
      ])
      prisma.portalNotification.count.mockResolvedValue(1)

      const sent = await service.processDueDigests()
      expect(sent).toBe(1)
      expect(mail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@test.com',
          subject: expect.stringContaining('2 new messages'),
        }),
      )
      expect(messageEmailDigest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'digest-1' },
          data: expect.objectContaining({ sentAt: expect.any(Date) }),
        }),
      )
    })

    it('cancels when recipient becomes active before send', async () => {
      const { service, mail, messageEmailDigest, presence } = createService({
        presence: {
          isInThreadRoom: jest.fn().mockReturnValue(true),
        },
      })
      messageEmailDigest.findMany.mockResolvedValue([
        {
          id: 'digest-1',
          recipientUserId: 'admin-1',
          channel: MessageEmailDigestChannel.PROJECT_REQUEST,
          threadKey: 'req-1',
          messageCount: 1,
          surfaceLabel: 'Project updates',
          projectTitle: 'Acme',
          lastPreview: 'yo',
          lastAuthorLabel: 'client',
          deepLinkUrl: 'http://admin.test/x',
          recipient: {
            id: 'admin-1',
            email: 'admin@test.com',
            status: UserStatus.ACTIVE,
          },
        },
      ])

      const sent = await service.processDueDigests()
      expect(sent).toBe(0)
      expect(mail.send).not.toHaveBeenCalled()
      expect(messageEmailDigest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cancelledAt: expect.any(Date) }),
        }),
      )
      expect(presence.isInThreadRoom).toHaveBeenCalled()
    })
  })

  describe('MessagingPresenceService', () => {
    it('tracks room occupancy', () => {
      const presence = new MessagingPresenceService()
      presence.joinRoom('request:req-1', 'u1')
      expect(presence.isInThreadRoom('u1', 'req-1')).toBe(true)
      presence.leaveRoom('request:req-1', 'u1')
      expect(presence.isInThreadRoom('u1', 'req-1')).toBe(false)
    })
  })
})
