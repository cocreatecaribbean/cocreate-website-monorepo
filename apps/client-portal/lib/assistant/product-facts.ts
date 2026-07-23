/** Always-on product facts for the Client Portal assistant. */

export const CLIENT_PORTAL_PRODUCT_FACTS = {
  productName: 'CoCreate Client Portal',
  purpose:
    'Your organization’s workspace with CoCreate Caribbean — projects, files, messaging, team access, and Social Listening when subscribed.',
  topTabs: [
    {
      id: 'control-center',
      label: 'Control Center',
      path: '/',
      description: 'Projects, activity, Get Help, team, and settings',
      howToNavigate:
        'At the top of the portal workspace, choose the [Control Center](/) tab',
    },
    {
      id: 'social-listening',
      label: 'Social Listening',
      path: '/?tab=social-listening',
      description: 'Brand mentions and analytics when your org is subscribed',
      howToNavigate:
        'At the top of the portal workspace, choose the [Social Listening](/?tab=social-listening) tab',
    },
  ],
  /**
   * Paths are for markdown hrefs only (invisible to users).
   * Replies must show only the label word as a clickable link.
   */
  controlCenterViews: [
    {
      id: 'overview',
      label: 'Dashboard',
      path: '/?ccView=overview',
      howToNavigate: 'In the menu on the left, choose [Dashboard](/?ccView=overview)',
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
  socialListeningViews: [
    {
      id: 'summary',
      label: 'Summary',
      path: '/?tab=social-listening',
      howToNavigate:
        'On Social Listening, in the menu on the left, choose [Summary](/?tab=social-listening)',
      description: 'Key metrics and sentiment split',
    },
    {
      id: 'mentions',
      label: 'Mentions',
      path: '/?tab=social-listening&view=mentions',
      howToNavigate:
        'On Social Listening, in the menu on the left, choose [Mentions](/?tab=social-listening&view=mentions)',
      description: 'Volume, timing, and sentiment trends',
    },
    {
      id: 'analysis',
      label: 'Analysis',
      path: '/?tab=social-listening&view=analysis',
      howToNavigate:
        'On Social Listening, in the menu on the left, choose [Analysis](/?tab=social-listening&view=analysis)',
      description: 'Reach, engagement, and performance',
    },
    {
      id: 'sources',
      label: 'Sources',
      path: '/?tab=social-listening&view=sources',
      howToNavigate:
        'On Social Listening, in the menu on the left, choose [Sources](/?tab=social-listening&view=sources)',
      description: 'Where conversations happen',
    },
    {
      id: 'reports',
      label: 'Reports',
      path: '/?tab=social-listening&view=reports',
      howToNavigate:
        'On Social Listening, in the menu on the left, choose [Reports](/?tab=social-listening&view=reports)',
      description: 'PDF exports (Growth+ plans)',
    },
    {
      id: 'setup',
      label: 'Setup',
      path: '/?tab=social-listening&view=setup',
      howToNavigate:
        'On Social Listening, open [Setup](/?tab=social-listening&view=setup) to configure listening',
      description: 'Configure keywords, platforms, and date range',
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
    overview:
      'There are two messaging places — never assume which one they mean. If they just say “messaging” or “chat”, name both, explain the difference in one line each, then ask which they want (or give both short paths).',
    getHelp:
      '**Get Help** (org inbox) — billing, timelines, account, or anything not tied to one project. On Control Center, left menu → [Get Help](/?ccView=messages).',
    projectUpdates:
      '**Project updates** — the main day-to-day project messaging thread (deliverables, progress, replies with CoCreate). Left menu → [Projects](/?ccView=projects) → open the project → open the **Project updates** tab inside that project.',
    onboarding:
      '**Onboarding** — project onboarding chat lives on the **Onboarding** tab inside a project (same Projects → open project pattern).',
  },
  whenStuck:
    'Offer the right messaging path: [Get Help](/?ccView=messages) for general questions, or [Projects](/?ccView=projects) → **Project updates** for project chat — or ask their org admin / CoCreate team.',
} as const

export function formatClientPortalProductFacts(): string {
  const f = CLIENT_PORTAL_PRODUCT_FACTS
  const topTabs = f.topTabs
    .map(
      (t) =>
        `- **${t.label}**: ${t.howToNavigate} — ${t.description}`,
    )
    .join('\n')
  const views = f.controlCenterViews
    .map(
      (v) =>
        `- **${v.label}**: ${v.howToNavigate} — ${v.description}`,
    )
    .join('\n')
  const slViews = f.socialListeningViews
    .map(
      (v) =>
        `- **${v.label}**: ${v.howToNavigate} — ${v.description}`,
    )
    .join('\n')
  const roles = f.roles.map((r) => `- ${r.label}: ${r.blurb}`).join('\n')
  const pageLinks = [
    ...f.topTabs.map(
      (t) =>
        `- Copy exactly: [${t.label}](${t.path}) → user sees only clickable “${t.label}”`,
    ),
    ...f.controlCenterViews.map(
      (v) =>
        `- Copy exactly: [${v.label}](${v.path}) → user sees only clickable “${v.label}”`,
    ),
    ...f.socialListeningViews.map(
      (v) =>
        `- Copy exactly: [${v.label}](${v.path}) → user sees only clickable “${v.label}”`,
    ),
  ].join('\n')
  const locationHints = [
    ...f.topTabs.map((t) => `tab:${t.id}=${t.label}`),
    ...f.controlCenterViews.map((v) => `ccView:${v.id}=${v.label}`),
    ...f.socialListeningViews.map((v) => `slView:${v.id}=${v.label}`),
  ].join(', ')

  return `PRODUCT FACTS (Client Portal — always use these for how-to-navigate questions):
- Product: ${f.productName}
- Purpose: ${f.purpose}
- Layout landmarks:
  - **Workspace tabs** at the **top of the portal workspace** (under the welcome header): **Control Center** and **Social Listening** (when subscribed). Call them tabs. Social Listening is NOT in the Control Center left menu.
  - **Left menu / sidebar** only appears inside the active workspace tab.
- Workspace tabs (how to say it — copy the markdown; never echo the path):
${topTabs}

Control Center views (how to say it to users — copy the markdown; never echo the path):
${views}

Social Listening views (only after the Social Listening top tab is active — copy the markdown; never echo the path):
${slViews}

PAGE LINKS (markdown only — the path inside () is invisible; users must NEVER see /?, tab=, ccView=, view=, or backticks):
${pageLinks}
Wrong: Team (\`/?ccView=team\`) or Team (/?ccView=team) or “go to /?ccView=team”
Wrong for Social Listening: \`/?ccView=social-listening\`, \`/?ccView=mentions\`, \`/social-listening\` (Admin Center), or \`/?view=mentions\` without tab=social-listening
Right (Control Center): In the menu on the left, choose [Team](/?ccView=team)
Right (open Social Listening): At the top of the portal workspace, choose the [Social Listening](/?tab=social-listening) tab
Right (SL Mentions): On Social Listening, choose [Mentions](/?tab=social-listening&view=mentions)

Internal location ids (for matching CURRENT LOCATION only — never quote these or paths in replies): ${locationHints}

Roles:
${roles}

Messaging (critical — two different places):
- ${f.messaging.overview}
- ${f.messaging.getHelp}
- ${f.messaging.projectUpdates}
- ${f.messaging.onboarding}

When stuck: ${f.whenStuck}`
}
