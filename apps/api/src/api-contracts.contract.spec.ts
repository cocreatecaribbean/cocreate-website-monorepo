/** @jest-environment node */
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
  PortalProfileResponseSchema,
  ProjectRequestMessageSchema,
  TeamHubResponseSchema,
} from '@cocreate/api-contracts/v1/client-portal'
import { CreateProjectSchema } from '@cocreate/api-contracts/v1/requests/projects'
import { SubscribeNewsletterSchema } from '@cocreate/api-contracts/v1/requests/newsletter'
import { SocialListeningAnalyticsPayloadSchema } from '@cocreate/api-contracts/v1/social-listening'

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
    })
    expect(sample.user.email).toBe('owner@acme.com')
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
          storagePath: 'orgs/o1/projects/p1/home.png',
          fileName: 'home.png',
          mimeType: 'image/png',
          sizeBytes: 1024,
          uploadedByUserId: 'u1',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    })
    expect(sample.attachments).toHaveLength(1)
    expect(sample.attachments?.[0]?.fileName).toBe('home.png')
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
})
