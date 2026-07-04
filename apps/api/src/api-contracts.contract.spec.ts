/** @jest-environment node */
import { z } from 'zod'
import {
  AdminAuthMeResponseSchema,
  AdminDashboardStatsSchema,
  ClientProjectSummarySchema as AdminClientProjectSummarySchema,
  OrgInboxConversationSchema,
  OrgInboxMessageSchema,
} from '@cocreate/api-contracts/v1/admin-portal'
import { ProjectMembersResponseSchema } from '@cocreate/api-contracts/v1/shared/team'
import {
  ClientProjectSummarySchema,
  ClientDashboardStatsSchema,
  ClientRecentActivityItemSchema,
  ClientSubscriptionViewSchema,
  ClientApprovalRecordItemSchema,
  ApproveCheckpointFileResponseSchema,
  OpenApprovalsResponseSchema,
  PortalProfileResponseSchema,
  ProjectRequestItemSchema,
  ProjectRequestMessageSchema,
  TeamHubResponseSchema,
} from '@cocreate/api-contracts/v1/client-portal'
import { CreateProjectSchema, CreateCheckpointSchema, CreateRequestMessageSchema } from '@cocreate/api-contracts/v1/requests/projects'
import { SendOrgInboxMessageSchema } from '@cocreate/api-contracts/v1/requests/org-inbox'
import { SubscribeNewsletterSchema } from '@cocreate/api-contracts/v1/requests/newsletter'
import { SocialListeningAnalyticsPayloadSchema } from '@cocreate/api-contracts/v1/social-listening'
import {
  serializeApprovalRecord,
  serializePendingApprovalFiles,
  serializeRequest,
} from './projects/projects.serializer'

describe('api-contracts (Zod smoke)', () => {
  it('parses admin dashboard stats', () => {
    const sample = AdminDashboardStatsSchema.parse({
      activeClients: 0,
      activeClientsThisMonth: 0,
      openProjects: 0,
      projectsAwaitingApproval: 0,
      portalInvites: 0,
      socialListeningSubscribers: 0,
      socialListeningConfigured: 0,
    })
    expect(sample.activeClients).toBe(0)
  })

  it('parses client project summary', () => {
    const sample = ClientProjectSummarySchema.parse({
      id: 'p1',
      organizationId: 'o1',
      title: 'Test',
      description: '',
      status: 'ACTIVE',
      phase: 'DISCOVERY',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(sample.id).toBe('p1')
  })

  it('parses admin client project summary', () => {
    const sample = AdminClientProjectSummarySchema.parse({
      id: 'p1',
      organizationId: 'o1',
      organizationName: 'Acme',
      title: 'Test',
      description: '',
      status: 'ACTIVE',
      phase: 'DISCOVERY',
      createdByEmail: null,
      approvedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(sample.organizationName).toBe('Acme')
  })

  it('parses client dashboard stats', () => {
    const sample = ClientDashboardStatsSchema.parse({
      activeProjects: 1,
      activeProjectsAwaitingReview: 0,
      pendingApprovals: 0,
      sharedFiles: 0,
      lastSharedFileAt: null,
    })
    expect(sample.activeProjects).toBe(1)
  })

  it('parses social listening payload', () => {
    const sample = SocialListeningAnalyticsPayloadSchema.parse({
      data: {
        sentimentSummary: [],
        sentimentOverTime: [],
        sourceBreakdown: [],
        reachVsEngagement: [],
        mentionMatrix: [],
      },
      meta: {
        source: 'org_mock',
        organizationId: 'o1',
        brand24ProjectId: null,
        fetchedAt: '2026-01-01T00:00:00.000Z',
      },
    })
    expect(sample.meta.source).toBe('org_mock')
  })

  it('parses create project request', () => {
    const sample = CreateProjectSchema.parse({
      title: 'New project',
      description: 'Details',
    })
    expect(sample.title).toBe('New project')
  })

  it('rejects invalid newsletter email', () => {
    expect(() =>
      SubscribeNewsletterSchema.parse({ email: 'not-an-email' }),
    ).toThrow()
  })

  it('parses portal profile response', () => {
    const sample = PortalProfileResponseSchema.parse({
      ok: true,
      user: {
        id: 'u1',
        email: 'owner@acme.com',
        status: 'ACTIVE',
        role: 'CLIENT',
        clientOrgRole: 'OWNER',
        canAccessSocialListening: true,
      },
      organization: {
        id: 'o1',
        name: 'Acme',
        slug: 'acme',
        logoUrl: null,
        isSocialListeningSubscriber: true,
      },
      permissions: {
        canManageOrgTeam: true,
        canAccessTeamHub: true,
        canManageOrgRoles: true,
        canInviteOrgMemberImmediately: true,
        canRequestOrgInvite: false,
        canToggleSocialListeningForTeam: true,
        canCreateProject: true,
        canUseSocialListening: true,
      },
      preferences: {
        theme: 'system',
      },
    })
    expect(sample.user.email).toBe('owner@acme.com')
    expect(sample.preferences.theme).toBe('system')
  })

  it('parses team hub response', () => {
    const sample = TeamHubResponseSchema.parse({
      ok: true,
      viewerRole: 'OWNER',
      permissions: {
        canManageOrgRoles: true,
        canInviteImmediately: true,
        canRequestInvite: false,
        canToggleSocialListening: true,
      },
      members: [
        {
          id: 'u1',
          email: 'owner@acme.com',
          status: 'ACTIVE',
          clientOrgRole: 'OWNER',
          canAccessSocialListening: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      projectsOwned: [],
      projectsShared: [],
      pendingInviteRequests: [],
    })
    expect(sample.members).toHaveLength(1)
  })

  it('parses client recent activity item', () => {
    const sample = ClientRecentActivityItemSchema.parse({
      id: 'a1',
      projectId: 'p1',
      projectTitle: 'Launch',
      action: 'FILE_UPLOADED',
      summary: 'Uploaded brief.pdf',
      actorEmail: 'pm@acme.com',
      actorName: null,
      actorLabel: 'PM',
      createdAt: '2026-01-01T00:00:00.000Z',
      href: '/projects/p1/files',
    })
    expect(sample.href).toBe('/projects/p1/files')
  })

  it('parses client subscription view', () => {
    const sample = ClientSubscriptionViewSchema.parse({
      plan: 'GROWTH',
      planId: 'growth-monthly',
      planName: 'Growth',
      status: 'ACTIVE',
      startedAt: '2026-01-01T00:00:00.000Z',
      currentPeriodEnd: '2026-02-01T00:00:00.000Z',
      autoRenewEnabled: true,
      cancelAtPeriodEnd: false,
      billingSource: 'FYGARO',
      entitled: true,
      paymentMethod: {
        last4: '4242',
        brand: 'visa',
        expMonth: 12,
        expYear: 2027,
      },
    })
    expect(sample.plan).toBe('GROWTH')
  })

  it('parses project members with assignableMembers', () => {
    const sample = ProjectMembersResponseSchema.parse({
      ok: true,
      projectId: 'p1',
      creator: {
        userId: 'u1',
        email: 'owner@acme.com',
        implicitAccess: 'MANAGE',
      },
      members: [],
      canManage: true,
      assignableMembers: [
        {
          userId: 'u2',
          email: 'member@acme.com',
          clientOrgRole: 'MEMBER',
        },
      ],
    })
    expect(sample.assignableMembers).toHaveLength(1)
  })

  it('parses collaborator author role on request messages', () => {
    const sample = ProjectRequestMessageSchema.parse({
      id: 'm1',
      requestId: 'r1',
      authorUserId: 'u1',
      authorEmail: 'collab@agency.com',
      body: 'Update from collaborator',
      authorRole: 'COLLABORATOR',
      createdAt: '2026-01-01T00:00:00.000Z',
    })
    expect(sample.authorRole).toBe('COLLABORATOR')
  })

  it('parses org inbox conversation and message', () => {
    const conversation = OrgInboxConversationSchema.parse({
      id: 'c1',
      organizationId: 'o1',
      organizationName: 'Acme',
      visibility: 'ORG_WIDE',
      subject: null,
      createdByUserId: 'u1',
      createdByEmail: 'owner@acme.com',
      unreadCount: 2,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    const message = OrgInboxMessageSchema.parse({
      id: 'm1',
      conversationId: 'c1',
      authorUserId: 'u1',
      authorEmail: 'owner@acme.com',
      authorRole: 'CLIENT',
      body: 'Hello team',
      createdAt: '2026-01-01T00:00:00.000Z',
    })
    expect(conversation.visibility).toBe('ORG_WIDE')
    expect(message.body).toBe('Hello team')
  })

  it('parses client approval history item with attachments', () => {
    const sample = ClientApprovalRecordItemSchema.parse({
      id: 'ar1',
      projectId: 'p1',
      projectTitle: 'Launch site',
      requestId: 'r1',
      messageId: 'm1',
      title: 'Homepage checkpoint',
      summary: 'Review the homepage mockups.',
      targetPhase: 'CLIENT_REVIEW',
      approvedAt: '2026-01-01T00:00:00.000Z',
      attachments: [
        {
          id: 'a1',
          projectId: 'p1',
          requestId: 'r1',
          fileName: 'home.png',
          mimeType: 'image/png',
          sizeBytes: 1024,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    })
    expect(sample.attachments).toHaveLength(1)
    expect(sample.attachments?.[0]?.fileName).toBe('home.png')
  })

  it('parses pending open approval files for client portal', () => {
    const attachmentOne = {
      id: 'att-1',
      projectId: 'proj-1',
      requestId: 'req-1',
      storagePath: 'orgs/org-1/projects/proj-1/mockup.png',
      fileName: 'mockup.png',
      mimeType: 'image/png',
      sizeBytes: 2048,
      uploadedByUserId: 'admin-1',
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
    }
    const attachmentTwo = {
      ...attachmentOne,
      id: 'att-2',
      fileName: 'layout.png',
      storagePath: 'orgs/org-1/projects/proj-1/layout.png',
    }
    const files = serializePendingApprovalFiles([
      {
        id: 'msg-1',
        body: 'Please review both files.',
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        attachmentLinks: [{ attachment: attachmentOne }, { attachment: attachmentTwo }],
        request: {
          id: 'req-1',
          title: 'Review homepage',
          projectId: 'proj-1',
          project: { title: 'Launch site' },
        },
      },
    ])

    const parsed = OpenApprovalsResponseSchema.parse({ files, items: [] })
    expect(parsed.files).toHaveLength(2)
    expect(parsed.files.map((file) => file.attachmentId)).toEqual(['att-1', 'att-2'])
    expect(parsed.files[0]?.messageId).toBe('msg-1')
    expect(parsed.files[0]).not.toHaveProperty('storagePath')
  })

  it('parses per-file approve checkpoint response', () => {
    const sample = ApproveCheckpointFileResponseSchema.parse({
      attachmentId: 'att-1',
      fileName: 'poster.png',
      checkpointCompleted: false,
      remainingFiles: 2,
    })
    expect(sample.remainingFiles).toBe(2)
    expect(sample.checkpointCompleted).toBe(false)
  })

  it('parses approval history serialized for client portal', () => {
    const snapshottedAttachment = {
      id: 'att-1',
      projectId: 'proj-1',
      requestId: 'req-1',
      storagePath: 'orgs/org-1/projects/proj-1/mockup.png',
      fileName: 'mockup.png',
      mimeType: 'image/png',
      sizeBytes: 2048,
      uploadedByUserId: 'admin-1',
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
    }
    const serialized = {
      ...serializeApprovalRecord(
        {
          id: 'ar-1',
          projectId: 'proj-1',
          requestId: 'req-1',
          messageId: 'msg-1',
          title: 'Homepage checkpoint — mockup.png',
          summary: 'Approved homepage mockups.',
          targetPhase: 'CLIENT_REVIEW',
          approvedAt: new Date('2026-01-03T00:00:00.000Z'),
          approvedByUserId: 'client-1',
          attachmentIds: ['att-1'],
          approvedAttachmentId: 'att-1',
          snapshottedAttachments: [snapshottedAttachment],
          message: { id: 'msg-1', attachmentLinks: [] },
        },
        { omitStoragePath: true },
      ),
      projectTitle: 'Launch site',
    }

    const [parsed] = z.array(ClientApprovalRecordItemSchema).parse([serialized])
    expect(parsed.projectTitle).toBe('Launch site')
    expect(parsed.attachments).toHaveLength(1)
    expect(parsed.attachments?.[0]?.fileName).toBe('mockup.png')
    expect(parsed.attachments?.[0]).not.toHaveProperty('storagePath')
  })

  it('parses admin auth me response', () => {
    const sample = AdminAuthMeResponseSchema.parse({
      ok: true,
      mode: 'user',
      admin: {
        id: 'a1',
        email: 'admin@cocreate.com',
        status: 'ACTIVE',
        role: 'ADMIN',
        profile: null,
      },
    })
    expect(sample.admin?.email).toBe('admin@cocreate.com')
  })

  it('accepts attachment-only project request messages', () => {
    const sample = CreateRequestMessageSchema.parse({
      body: '',
      attachmentIds: ['att-1'],
    })
    expect(sample.attachmentIds).toEqual(['att-1'])
  })

  it('rejects empty project request messages without attachments', () => {
    expect(() => CreateRequestMessageSchema.parse({ body: '   ' })).toThrow()
  })

  it('accepts attachment-only progress checkpoints with title', () => {
    const sample = CreateCheckpointSchema.parse({
      title: 'Review homepage',
      body: '',
      attachmentIds: ['att-1'],
    })
    expect(sample.attachmentIds).toEqual(['att-1'])
  })

  it('rejects progress checkpoints without body or attachments', () => {
    expect(() =>
      CreateCheckpointSchema.parse({
        title: 'Review homepage',
        body: '   ',
      }),
    ).toThrow()
  })

  it('rejects progress checkpoints without title', () => {
    expect(() =>
      CreateCheckpointSchema.parse({
        title: '   ',
        body: 'Please review',
      }),
    ).toThrow()
  })

  it('accepts attachment-only org inbox messages', () => {
    const sample = SendOrgInboxMessageSchema.parse({
      body: '',
      attachmentIds: ['att-1'],
    })
    expect(sample.attachmentIds).toEqual(['att-1'])
  })

  it('parses org inbox message with attachments', () => {
    const sample = OrgInboxMessageSchema.parse({
      id: 'm1',
      conversationId: 'c1',
      authorUserId: 'u1',
      authorEmail: 'owner@acme.com',
      authorRole: 'CLIENT',
      body: '',
      createdAt: '2026-01-01T00:00:00.000Z',
      attachments: [
        {
          id: 'a1',
          fileName: 'photo.png',
          mimeType: 'image/png',
          sizeBytes: 1024,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    })
    expect(sample.attachments).toHaveLength(1)
  })
})
