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
  /**
   * Paths are internal-only for CURRENT LOCATION matching.
   * Never echo these in user-facing replies — use howToNavigate instead.
   */
  controlCenterViews: [
    {
      id: 'overview',
      label: 'Overview',
      path: '/?ccView=overview',
      howToNavigate: 'In the menu on the left, choose **Overview**',
      description: 'Snapshot of projects, files, and actions',
    },
    {
      id: 'projects',
      label: 'Projects',
      path: '/?ccView=projects',
      howToNavigate: 'In the menu on the left, choose **Projects**',
      description: 'Active workstreams with your CoCreate team',
    },
    {
      id: 'activity',
      label: 'Activity',
      path: '/?ccView=activity',
      howToNavigate: 'In the menu on the left, choose **Activity**',
      description: 'Recent updates across your workspace',
    },
    {
      id: 'messages',
      label: 'Get Help',
      path: '/?ccView=messages',
      howToNavigate: 'In the menu on the left, choose **Get Help**',
      description: 'Message CoCreate about billing, timelines, or general questions',
    },
    {
      id: 'team',
      label: 'Team',
      path: '/?ccView=team',
      howToNavigate: 'In the menu on the left, choose **Team**',
      description: 'Organization members and project access (org admins)',
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/?ccView=settings',
      howToNavigate: 'In the menu on the left, choose **Settings**',
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
      'Open **Control Center**, then use the menu on the left to open **Get Help** for general messages with CoCreate.',
    projectThreads:
      'From the left menu open **Projects**, open a project, then use that project’s conversation thread for deliverable-specific chat.',
  },
  whenStuck:
    'Use **Get Help** from the left menu if you have access, or contact your org admin / CoCreate team.',
} as const

export function formatClientPortalProductFacts(): string {
  const f = CLIENT_PORTAL_PRODUCT_FACTS
  const views = f.controlCenterViews
    .map(
      (v) =>
        `- **${v.label}**: ${v.howToNavigate} — ${v.description}`,
    )
    .join('\n')
  const roles = f.roles.map((r) => `- ${r.label}: ${r.blurb}`).join('\n')
  const locationHints = f.controlCenterViews
    .map((v) => `${v.id}=${v.label}`)
    .join(', ')

  return `PRODUCT FACTS (Client Portal — always use these for how-to-navigate questions):
- Product: ${f.productName}
- Purpose: ${f.purpose}
- Layout: **Control Center** has a main menu on the left. Tell people to use that left menu (and bold item labels). Never show URLs, query strings, or ccView=… in replies.
- Top areas: ${f.topTabs.map((t) => t.label).join('; ')}

Control Center views (how to say it to users):
${views}

Internal location ids (for matching CURRENT LOCATION only — never quote these or paths in replies): ${locationHints}

Roles:
${roles}

Messaging:
- Get Help: ${f.messaging.getHelp}
- Project threads: ${f.messaging.projectThreads}

When stuck: ${f.whenStuck}`
}
