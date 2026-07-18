/** Always-on product facts for the Client Portal assistant. */

export const CLIENT_PORTAL_PRODUCT_FACTS = {
  productName: 'CoCreate Client Portal',
  purpose:
    'Your organization’s workspace with CoCreate Caribbean — projects, files, messaging, team access, and Social Listening when subscribed.',
  topTabs: [
    {
      id: 'control-center',
      label: 'Control Center',
      description: 'Projects, activity, Get Help, team, and settings',
    },
    {
      id: 'social-listening',
      label: 'Social Listening',
      description: 'Brand mentions and analytics when your org is subscribed',
    },
  ],
  controlCenterViews: [
    {
      id: 'overview',
      label: 'Overview',
      path: '/?ccView=overview',
      description: 'Snapshot of projects, files, and actions',
    },
    {
      id: 'projects',
      label: 'Projects',
      path: '/?ccView=projects',
      description: 'Active workstreams with your CoCreate team',
    },
    {
      id: 'activity',
      label: 'Activity',
      path: '/?ccView=activity',
      description: 'Recent updates across your workspace',
    },
    {
      id: 'messages',
      label: 'Get Help',
      path: '/?ccView=messages',
      description: 'Message CoCreate about billing, timelines, or general questions',
    },
    {
      id: 'team',
      label: 'Team',
      path: '/?ccView=team',
      description: 'Organization members and project access (org admins)',
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/?ccView=settings',
      description: 'Appearance and portal preferences',
    },
  ],
  roles: [
    {
      id: 'ADMIN',
      label: 'Admin',
      blurb: 'Full Control Center; invite teammates; manage Get Help / Social Listening flags',
    },
    {
      id: 'CONTRIBUTOR',
      label: 'Contributor',
      blurb: 'Assigned projects; Get Help and Social Listening when enabled for them',
    },
    {
      id: 'VIEWER',
      label: 'Viewer',
      blurb: 'Mostly read-only project access; no Get Help; no Social Listening',
    },
    {
      id: 'SOCIAL_ANALYST',
      label: 'Social Analyst',
      blurb: 'Social Listening when subscribed; little or no Control Center',
    },
  ],
  messaging: {
    getHelp:
      'Control Center → Get Help (/?ccView=messages) for general messages with CoCreate (org inbox).',
    projectThreads:
      'Open Projects → a project → use the project request thread for deliverable-specific chat.',
  },
  whenStuck:
    'Use Get Help if you have access, or contact your org admin / CoCreate team.',
} as const

export function formatClientPortalProductFacts(): string {
  const f = CLIENT_PORTAL_PRODUCT_FACTS
  const views = f.controlCenterViews
    .map((v) => `- ${v.label} (${v.path}): ${v.description}`)
    .join('\n')
  const roles = f.roles.map((r) => `- ${r.label}: ${r.blurb}`).join('\n')
  return `PRODUCT FACTS (Client Portal — always use these for how-to-navigate questions):
- Product: ${f.productName}
- Purpose: ${f.purpose}
- Top areas: ${f.topTabs.map((t) => t.label).join('; ')}

Control Center views:
${views}

Roles:
${roles}

Messaging:
- Get Help: ${f.messaging.getHelp}
- Project threads: ${f.messaging.projectThreads}

When stuck: ${f.whenStuck}`
}
