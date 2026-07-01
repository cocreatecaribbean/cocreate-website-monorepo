export const adminQueryKeys = {
  projects: {
    all: ['admin', 'projects'] as const,
    lists: () => [...adminQueryKeys.projects.all, 'list'] as const,
    list: () => [...adminQueryKeys.projects.lists()] as const,
    details: () => [...adminQueryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...adminQueryKeys.projects.details(), id] as const,
    byOrganization: (organizationId: string) =>
      [...adminQueryKeys.projects.all, 'organization', organizationId] as const,
    workspace: (organizationId: string, projectId: string) =>
      [...adminQueryKeys.projects.all, 'workspace', organizationId, projectId] as const,
  },
  dashboard: {
    all: ['admin', 'dashboard'] as const,
    stats: () => [...adminQueryKeys.dashboard.all, 'stats'] as const,
    activity: (limit = 15) =>
      [...adminQueryKeys.dashboard.all, 'activity', limit] as const,
  },
  notifications: {
    all: ['admin', 'notifications'] as const,
    list: (params?: Record<string, unknown>) =>
      [...adminQueryKeys.notifications.all, 'list', params ?? {}] as const,
  },
  files: {
    all: ['admin', 'files'] as const,
    library: (params?: Record<string, unknown>) =>
      [...adminQueryKeys.files.all, 'library', params ?? {}] as const,
    project: (projectId: string, params?: Record<string, unknown>) =>
      [...adminQueryKeys.files.all, 'project', projectId, params ?? {}] as const,
  },
  team: {
    all: ['admin', 'team'] as const,
    members: (organizationId: string) =>
      [...adminQueryKeys.team.all, 'members', organizationId] as const,
    invites: (organizationId: string) =>
      [...adminQueryKeys.team.all, 'invites', organizationId] as const,
  },
  socialListening: {
    all: ['admin', 'social-listening'] as const,
    stats: () => [...adminQueryKeys.socialListening.all, 'stats'] as const,
    subscriptions: () => [...adminQueryKeys.socialListening.all, 'subscriptions'] as const,
    subscription: (organizationId: string) =>
      [...adminQueryKeys.socialListening.all, 'subscription', organizationId] as const,
    analytics: (organizationId: string, params?: Record<string, unknown>) =>
      [
        ...adminQueryKeys.socialListening.all,
        'analytics',
        organizationId,
        params ?? {},
      ] as const,
  },
  clients: {
    all: ['admin', 'clients'] as const,
    list: () => [...adminQueryKeys.clients.all, 'list'] as const,
    detail: (organizationId: string) =>
      [...adminQueryKeys.clients.all, 'detail', organizationId] as const,
    activity: (organizationId: string) =>
      [...adminQueryKeys.clients.all, 'activity', organizationId] as const,
  },
  admins: {
    all: ['admin', 'admins'] as const,
    list: () => [...adminQueryKeys.admins.all, 'list'] as const,
  },
  collaborators: {
    all: ['admin', 'collaborators'] as const,
    roster: () => [...adminQueryKeys.collaborators.all, 'roster'] as const,
    project: (projectId: string) =>
      [...adminQueryKeys.collaborators.all, 'project', projectId] as const,
  },
  inbox: {
    all: ['admin', 'inbox'] as const,
    list: (organizationId: string) =>
      [...adminQueryKeys.inbox.all, 'list', organizationId] as const,
    unreadCount: (organizationId: string) =>
      [...adminQueryKeys.inbox.all, 'unread-count', organizationId] as const,
  },
  profile: {
    all: ['admin', 'profile'] as const,
    current: () => [...adminQueryKeys.profile.all, 'current'] as const,
    options: () => [...adminQueryKeys.profile.all, 'options'] as const,
    settingsOptions: () => [...adminQueryKeys.profile.all, 'settings-options'] as const,
  },
  session: {
    all: ['admin', 'session'] as const,
    current: () => [...adminQueryKeys.session.all, 'current'] as const,
  },
  requests: {
    all: ['admin', 'requests'] as const,
    detail: (requestId: string) => [...adminQueryKeys.requests.all, requestId] as const,
  },
  orgInbox: {
    all: ['admin', 'org-inbox'] as const,
    conversations: () => [...adminQueryKeys.orgInbox.all, 'conversations'] as const,
    orgConversations: (organizationId: string) =>
      [...adminQueryKeys.orgInbox.all, 'org', organizationId] as const,
    messages: (conversationId: string) =>
      [...adminQueryKeys.orgInbox.all, 'messages', conversationId] as const,
    unreadCount: () => [...adminQueryKeys.orgInbox.all, 'unread-count'] as const,
  },
} as const
