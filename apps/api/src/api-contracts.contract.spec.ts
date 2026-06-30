/** @jest-environment node */
import {
  AdminDashboardStatsSchema,
  ClientProjectSummarySchema as AdminClientProjectSummarySchema,
} from '@cocreate/api-contracts/v1/admin-portal'
import {
  ClientProjectSummarySchema,
  ClientDashboardStatsSchema,
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
})
