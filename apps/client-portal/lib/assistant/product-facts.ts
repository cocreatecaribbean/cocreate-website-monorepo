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
   * Paths are for markdown hrefs only (invisible to users).
   * Replies must show only the label word as a clickable link.
   */
  controlCenterViews: [
    {
      id: 'overview',
      label: 'Overview',
      path: '/?ccView=overview',
      howToNavigate: 'In the menu on the left, choose [Overview](/?ccView=overview)',
      description: 'Snapshot of projects, files, and actions',
    },
    {
      id: 'projects',
      label: 'Projects',
      path: '/?ccView=projects',
      howToNavigate: 'In the menu on the left, choose [Projects](/?ccView=projects)',
      description: 'Active workstreams with your CoCreate team',
    },
    {
      id: 'activity',
      label: 'Activity',
      path: '/?ccView=activity',
      howToNavigate: 'In the menu on the left, choose [Activity](/?ccView=activity)',
      description: 'Recent updates across your workspace',
    },
    {
      id: 'messages',
      label: 'Get Help',
      path: '/?ccView=messages',
      howToNavigate: 'In the menu on the left, choose [Get Help](/?ccView=messages)',
      description: 'Message CoCreate about billing, timelines, or general questions',
    },
    {
      id: 'team',
      label: 'Team',
      path: '/?ccView=team',
      howToNavigate: 'In the menu on the left, choose [Team](/?ccView=team)',
      description: 'Organization members and project access (org admins)',
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/?ccView=settings',
      howToNavigate: 'In the menu on the left, choose [Settings](/?ccView=settings)',
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
      'Open **Control Center**, then use the menu on the left to open [Get Help](/?ccView=messages) for general messages with CoCreate.',
    projectThreads:
      'From the left menu open [Projects](/?ccView=projects), open a project, then use that project’s conversation thread for deliverable-specific chat.',
  },
  whenStuck:
    'Use [Get Help](/?ccView=messages) from the left menu if you have access, or contact your org admin / CoCreate team.',
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
  const pageLinks = f.controlCenterViews
    .map(
      (v) =>
        `- Copy exactly: [${v.label}](${v.path}) → user sees only clickable “${v.label}”`,
    )
    .join('\n')
  const locationHints = f.controlCenterViews
    .map((v) => `${v.id}=${v.label}`)
    .join(', ')

  return `PRODUCT FACTS (Client Portal — always use these for how-to-navigate questions):
- Product: ${f.productName}
- Purpose: ${f.purpose}
- Layout: **Control Center** has a main menu on the left. Point people there with clickable label links only (see PAGE LINKS).
- Top areas: ${f.topTabs.map((t) => t.label).join('; ')}

Control Center views (how to say it to users — copy the markdown; never echo the path):
${views}

PAGE LINKS (markdown only — the path inside () is invisible; users must NEVER see /?, ccView=, or backticks):
${pageLinks}
Wrong: Team (\`/?ccView=team\`) or Team (/?ccView=team) or “go to /?ccView=team”
Right: In the menu on the left, choose [Team](/?ccView=team)

Internal location ids (for matching CURRENT LOCATION only — never quote these or paths in replies): ${locationHints}

Roles:
${roles}

Messaging:
- Get Help: ${f.messaging.getHelp}
- Project threads: ${f.messaging.projectThreads}

When stuck: ${f.whenStuck}`
}
