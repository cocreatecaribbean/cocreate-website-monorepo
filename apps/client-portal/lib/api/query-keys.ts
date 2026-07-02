export const queryKeys = {
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: () => [...queryKeys.projects.lists()] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    recentActivity: (limit?: number) =>
      [...queryKeys.dashboard.all, 'recent-activity', limit ?? 15] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (unreadOnly?: boolean) =>
      [...queryKeys.notifications.all, 'list', { unreadOnly: unreadOnly ?? false }] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },
  files: {
    all: ['files'] as const,
    library: (query?: { projectId?: string; q?: string; cursor?: string; limit?: number }) =>
      [...queryKeys.files.all, 'library', query ?? {}] as const,
    project: (projectId: string, query?: { q?: string; cursor?: string; limit?: number }) =>
      [...queryKeys.files.all, 'project', projectId, query ?? {}] as const,
  },
  team: {
    all: ['team'] as const,
    members: () => [...queryKeys.team.all, 'members'] as const,
    hub: () => [...queryKeys.team.all, 'hub'] as const,
    org: () => [...queryKeys.team.all, 'org'] as const,
    projectMembers: (projectId: string) =>
      [...queryKeys.team.all, 'project-members', projectId] as const,
  },
  profile: {
    all: ['profile'] as const,
    portal: () => [...queryKeys.profile.all, 'portal'] as const,
  },
  approvals: {
    all: ['approvals'] as const,
    open: () => [...queryKeys.approvals.all, 'open'] as const,
    history: () => [...queryKeys.approvals.all, 'history'] as const,
    unreadCount: () => [...queryKeys.approvals.all, 'unread-count'] as const,
    comments: (approvalItemId: string) =>
      [...queryKeys.approvals.all, 'comments', approvalItemId] as const,
  },
  attention: {
    all: ['attention'] as const,
    items: () => [...queryKeys.attention.all, 'items'] as const,
    unreadCount: () => [...queryKeys.attention.all, 'unread-count'] as const,
  },
  requests: {
    all: ['requests'] as const,
    detail: (requestId: string) => [...queryKeys.requests.all, requestId] as const,
  },
  attachments: {
    all: ['attachments'] as const,
    downloadUrl: (attachmentId: string) =>
      [...queryKeys.attachments.all, 'download-url', attachmentId] as const,
  },
  socialListening: {
    all: ['social-listening'] as const,
    analytics: (params?: Record<string, unknown>) =>
      [...queryKeys.socialListening.all, 'analytics', params ?? {}] as const,
    reports: () => [...queryKeys.socialListening.all, 'reports'] as const,
    subscription: () => [...queryKeys.socialListening.all, 'subscription'] as const,
  },
  inbox: {
    all: ['inbox'] as const,
    conversations: () => [...queryKeys.inbox.all, 'conversations'] as const,
    messages: (conversationId: string) =>
      [...queryKeys.inbox.all, 'messages', conversationId] as const,
    unreadCount: () => [...queryKeys.inbox.all, 'unread-count'] as const,
  },
} as const
