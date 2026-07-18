/** Always-on product facts for the Admin Center assistant. */

export const ADMIN_CENTER_PRODUCT_FACTS = {
  productName: 'CoCreate Admin Center',
  purpose:
    'Internal agency workspace for clients, projects, messaging, Social Listening grants, and the agency team.',
  nav: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/',
      description: 'Agency overview, activity, and quick actions',
    },
    {
      id: 'project-center',
      label: 'Project Center',
      path: '/project-center',
      description: 'Active projects, pipelines, and delivery status',
    },
    {
      id: 'clients',
      label: 'Clients',
      path: '/clients',
      description: 'Client organizations, portal access, and brand assets',
    },
    {
      id: 'messages',
      label: 'Get Help',
      path: '/messages',
      description: 'Conversations with client organizations (org inbox)',
    },
    {
      id: 'social-listening',
      label: 'Social Listening',
      path: '/social-listening',
      description: 'Brand mentions, analytics, and listening setups',
    },
    {
      id: 'team',
      label: 'Team',
      path: '/team',
      description: 'Agency members, roles, and permissions',
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '/profile',
      description: 'Your account details and preferences',
    },
    {
      id: 'agency-profile',
      label: 'Profile options',
      path: '/settings/agency-profile',
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
      'Sidebar → Get Help (/messages) — pick an organization, then the conversation.',
    projectThreads:
      'Open a project from Project Center or Clients and use the project request thread / Progress UI.',
  },
  whenStuck:
    'Check Team or Clients for access, or escalate to a Super admin.',
} as const

export function formatAdminCenterProductFacts(): string {
  const f = ADMIN_CENTER_PRODUCT_FACTS
  const nav = f.nav
    .map((item) => `- ${item.label} (${item.path}): ${item.description}`)
    .join('\n')
  const roles = f.roles.map((r) => `- ${r.label}: ${r.blurb}`).join('\n')
  return `PRODUCT FACTS (Admin Center — always use these for how-to-navigate questions):
- Product: ${f.productName}
- Purpose: ${f.purpose}

Main navigation:
${nav}

Agency roles:
${roles}

Messaging:
- Get Help: ${f.messaging.getHelp}
- Project threads: ${f.messaging.projectThreads}

When stuck: ${f.whenStuck}`
}
