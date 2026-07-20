/** Always-on product facts for the Admin Center assistant. */

export const ADMIN_CENTER_PRODUCT_FACTS = {
  productName: 'CoCreate Admin Center',
  purpose:
    'Internal agency workspace for clients, projects, messaging, Social Listening grants, and the agency team.',
  /**
   * Paths are internal-only for CURRENT LOCATION matching.
   * Never echo these in user-facing replies — use howToNavigate instead.
   */
  nav: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/',
      howToNavigate: 'In the sidebar on the left, choose **Dashboard**',
      description: 'Agency overview, activity, and quick actions',
    },
    {
      id: 'project-center',
      label: 'Project Center',
      path: '/project-center',
      howToNavigate: 'In the sidebar on the left, choose **Project Center**',
      description: 'Active projects, pipelines, and delivery status',
    },
    {
      id: 'clients',
      label: 'Clients',
      path: '/clients',
      howToNavigate: 'In the sidebar on the left, choose **Clients**',
      description: 'Client organizations, portal access, and brand assets',
    },
    {
      id: 'messages',
      label: 'Get Help',
      path: '/messages',
      howToNavigate: 'In the sidebar on the left, choose **Get Help**',
      description: 'Conversations with client organizations (org inbox)',
    },
    {
      id: 'social-listening',
      label: 'Social Listening',
      path: '/social-listening',
      howToNavigate: 'In the sidebar on the left, choose **Social Listening**',
      description: 'Brand mentions, analytics, and listening setups',
    },
    {
      id: 'team',
      label: 'Team',
      path: '/team',
      howToNavigate: 'In the sidebar on the left, choose **Team**',
      description: 'Agency members, roles, and permissions',
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '/profile',
      howToNavigate: 'In the sidebar on the left, choose **Profile**',
      description: 'Your account details and preferences',
    },
    {
      id: 'agency-profile',
      label: 'Profile options',
      path: '/settings/agency-profile',
      howToNavigate:
        'In the sidebar on the left, open settings / **Profile options** (super admins)',
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
    getHelp:
      'Use the sidebar on the left to open **Get Help**, pick an organization, then the conversation.',
    projectThreads:
      'Open a project from **Project Center** or **Clients** (left sidebar), then use the project conversation / Progress area.',
  },
  whenStuck:
    'Check **Team** or **Clients** in the left sidebar for access, or escalate to a Super admin.',
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
  const locationHints = f.nav.map((item) => `${item.path}=${item.label}`).join(', ')

  return `PRODUCT FACTS (Admin Center — always use these for how-to-navigate questions):
- Product: ${f.productName}
- Purpose: ${f.purpose}
- Layout: Main navigation is the **sidebar on the left**. Tell people to use that sidebar and bold item labels. Never show URLs or path segments like /messages in replies.

Main navigation (how to say it to users):
${nav}

Internal paths (for matching CURRENT LOCATION only — never quote these in replies): ${locationHints}

Agency roles:
${roles}

Messaging:
- Get Help: ${f.messaging.getHelp}
- Project threads: ${f.messaging.projectThreads}

When stuck: ${f.whenStuck}`
}
