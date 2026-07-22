/** Always-on product facts for the Admin Center assistant. */

export const ADMIN_CENTER_PRODUCT_FACTS = {
  productName: 'CoCreate Admin Center',
  purpose:
    'Internal agency workspace for clients, projects, messaging, Social Listening grants, and the agency team.',
  /**
   * Paths are for markdown hrefs only (invisible to users).
   * Replies must show only the label word as a clickable link.
   */
  nav: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/',
      howToNavigate: 'In the sidebar on the left, choose [Dashboard](/)',
      description: 'Agency overview, activity, and quick actions',
    },
    {
      id: 'project-center',
      label: 'Project Center',
      path: '/project-center',
      howToNavigate:
        'In the sidebar on the left, choose [Project Center](/project-center)',
      description: 'Active projects, pipelines, and delivery status',
    },
    {
      id: 'clients',
      label: 'Clients',
      path: '/clients',
      howToNavigate: 'In the sidebar on the left, choose [Clients](/clients)',
      description: 'Client organizations, portal access, and brand assets',
    },
    {
      id: 'messages',
      label: 'Get Help',
      path: '/messages',
      howToNavigate: 'In the sidebar on the left, choose [Get Help](/messages)',
      description: 'Conversations with client organizations (org inbox)',
    },
    {
      id: 'social-listening',
      label: 'Social Listening',
      path: '/social-listening',
      howToNavigate:
        'In the sidebar on the left, choose [Social Listening](/social-listening)',
      description: 'Brand mentions, analytics, and listening setups',
    },
    {
      id: 'team',
      label: 'Team',
      path: '/team',
      howToNavigate: 'In the sidebar on the left, choose [Team](/team)',
      description: 'Agency members, roles, and permissions',
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '/profile',
      howToNavigate: 'In the sidebar on the left, choose [Profile](/profile)',
      description: 'Your account details and preferences',
    },
    {
      id: 'agency-profile',
      label: 'Profile options',
      path: '/settings/agency-profile',
      howToNavigate:
        'In the sidebar on the left, open settings / [Profile options](/settings/agency-profile) (super admins)',
      description: 'Agency branding and configuration (super admins)',
    },
  ],
  roles: [
    {
      id: 'SUPER_ADMIN',
      label: 'Super admin',
      blurb: 'Invite/suspend admins, change roles, manage agency profile options',
    },
    {
      id: 'ADMIN',
      label: 'Admin',
      blurb: 'Day-to-day clients, projects, messaging, and Social Listening ops',
    },
  ],
  messaging: {
    overview:
      'There are two messaging places — never assume which one they mean. If they just say “messaging” or “chat”, name both, explain the difference in one line each, then ask which they want (or give both short paths).',
    getHelp:
      '**Get Help** (org inbox) — general chat with a client org (billing, timelines, account). Sidebar label is **Get Help** ([Get Help](/messages)); the page chrome often says **Messages**. Pick an organization, then the conversation.',
    projectUpdates:
      '**Project updates** — the main day-to-day project messaging thread with the client. Open the project from [Project Center](/project-center) or [Clients](/clients), then open the **Project updates** tab.',
    onboarding:
      '**Onboarding** — onboarding request threads live on the **Onboarding** tab inside a project.',
    teamReview:
      '**Team review** — internal agency-only project thread (clients never see this). Same project workspace, **Team review** tab.',
  },
  whenStuck:
    'Offer the right messaging path: [Get Help](/messages) for org inbox, or open a project’s **Project updates** via [Project Center](/project-center) / [Clients](/clients) — or escalate to a Super admin. Do not only push Get Help.',
} as const

export function formatAdminCenterProductFacts(): string {
  const f = ADMIN_CENTER_PRODUCT_FACTS
  const nav = f.nav
    .map(
      (item) =>
        `- **${item.label}**: ${item.howToNavigate} — ${item.description}`,
    )
    .join('\n')
  const roles = f.roles.map((r) => `- ${r.label}: ${r.blurb}`).join('\n')
  const pageLinks = f.nav
    .map(
      (item) =>
        `- Copy exactly: [${item.label}](${item.path}) → user sees only clickable “${item.label}”`,
    )
    .join('\n')
  const locationHints = f.nav.map((item) => `${item.path}=${item.label}`).join(', ')

  return `PRODUCT FACTS (Admin Center — always use these for how-to-navigate questions):
- Product: ${f.productName}
- Purpose: ${f.purpose}
- Layout: Main navigation is the **sidebar on the left**. Point people there with clickable label links only (see PAGE LINKS).

Main navigation (how to say it to users — copy the markdown; never echo the path):
${nav}

PAGE LINKS (markdown only — the path inside () is invisible; users must NEVER see /paths or backticks):
${pageLinks}
Wrong: Team (\`/team\`) or Team (/team) or “go to /team”
Right: In the sidebar on the left, choose [Team](/team)

Internal paths (for matching CURRENT LOCATION only — never quote these in replies): ${locationHints}

Agency roles:
${roles}

Messaging (critical — two different places):
- ${f.messaging.overview}
- ${f.messaging.getHelp}
- ${f.messaging.projectUpdates}
- ${f.messaging.onboarding}
- ${f.messaging.teamReview}

When stuck: ${f.whenStuck}`
}
