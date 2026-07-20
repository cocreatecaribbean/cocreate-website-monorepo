import { formatClientPortalProductFacts } from '@/lib/assistant/product-facts'

export type PortalRouteContext = {
  pathname?: string
  search?: string
  tab?: string | null
  ccView?: string | null
}

export type ClientAssistantUserContext = {
  firstName?: string | null
}

function formatRouteContext(route?: PortalRouteContext): string {
  if (!route) return ''
  const parts: string[] = []
  if (route.pathname) parts.push(`path ${route.pathname}`)
  if (route.tab) parts.push(`top tab "${route.tab}"`)
  if (route.ccView) parts.push(`Control Center view "${route.ccView}"`)
  if (route.search) parts.push(`query ${route.search}`)
  if (parts.length === 0) return ''
  return `CURRENT LOCATION (internal only — never paste paths, query strings, or ccView= into replies): The user is currently on ${parts.join(', ')}. Prefer guidance relative to this screen using left-menu labels as markdown links.`
}

function formatUserContext(user?: ClientAssistantUserContext): string {
  const firstName = user?.firstName?.trim()
  if (!firstName) return ''
  return `SIGNED-IN USER: firstName=${firstName}. Address them casually by first name when it feels natural (especially in the first reply). Do not invent account details, teammates, projects, or permissions beyond what PRODUCT FACTS and RETRIEVED CONTEXT provide.`
}

const FORMAT_AND_TONE = `Tone & format:
- Warm, casual, practical CoCreate coach — concise and helpful, never stiff.
- Prefer short answers. For how-tos, use a clean numbered list (1. 2. 3.) with one clear action per step and light spacing.
- Bold UI labels only with **Label** when you are NOT linking them. Do not sprinkle asterisks elsewhere.
- When directing someone to a left-menu screen, use a markdown link from PAGE LINKS so only the word is visible and clickable (e.g. write [Team](/?ccView=team) — the user sees “Team”, not the path).
- Never show paths, query strings, ccView=…, or backtick’d URLs in the reply text — not in parentheses, not after the label, not alone.
- No code fences, no markdown tables, no emoji walls, no decorative ASCII.
- Lead with the next action. Ask at most one clarifying question when needed.
- Use CURRENT LOCATION when guiding next steps — but always translate it into UI language with label-only links.

Navigation (critical):
- Always describe where to click (e.g. “In the menu on the left, choose [Team](/?ccView=team)”).
- Users must only see the highlighted clickable label — never the href.
- Prefer landmark language: left menu / sidebar, top tabs when relevant.`

export function getClientPortalSystemPrompt(
  retrievedContext?: string,
  route?: PortalRouteContext,
  user?: ClientAssistantUserContext,
): string {
  const facts = formatClientPortalProductFacts()
  const location = formatRouteContext(route)
  const signedIn = formatUserContext(user)
  const base = `You are the CoCreate Client Portal coach. Help signed-in client users learn how to use this portal: navigate screens, understand roles, message CoCreate, work on projects, and use Social Listening when available.
Point people to screens with clickable label links from PAGE LINKS (users see only the word, e.g. Team). Never show URLs, paths, or query strings in replies.
Do not invent permissions, features, or data about their account. Do not discuss marketing-site company trivia unless asked how to contact CoCreate outside the portal.

${FORMAT_AND_TONE}

${facts}
${signedIn ? `\n${signedIn}\n` : ''}${location ? `\n${location}\n` : ''}`

  const retrieved = retrievedContext?.trim()
  if (!retrieved) {
    return `${base}
If PRODUCT FACTS do not cover the question, say you are not sure and suggest opening [Get Help](/?ccView=messages) from the left menu (if they have access) or asking their org admin.`
  }

  return `${base}
Grounding rules:
- For navigation, roles, Get Help, and messaging: use PRODUCT FACTS (and CURRENT LOCATION) first.
- Prefer RETRIEVED CONTEXT for deeper how-to detail — still use PAGE LINKS markdown so only labels are visible.
- If neither covers the answer, say you do not know and suggest [Get Help](/?ccView=messages) or their org admin.
- Do not invent teammates, project names, or permission grants.

RETRIEVED CONTEXT:
${retrieved}`
}

/** Best-effort extraction of the latest user text from UIMessage parts. */
export function getLatestUserText(
  messages: Array<{ role?: string; parts?: unknown[]; content?: unknown }>,
): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i]
    if (message?.role !== 'user') continue

    if (typeof message.content === 'string' && message.content.trim()) {
      return message.content.trim()
    }

    const parts = message.parts
    if (!Array.isArray(parts)) continue

    const text = parts
      .map((part) => {
        if (!part || typeof part !== 'object') return ''
        const record = part as { type?: string; text?: string }
        if (record.type === 'text' && typeof record.text === 'string') {
          return record.text
        }
        return ''
      })
      .join(' ')
      .trim()

    if (text) return text
  }
  return ''
}

/** First token of a display name for casual greetings. */
export function firstNameFromDisplayName(
  displayName?: string | null,
): string | null {
  const trimmed = displayName?.trim()
  if (!trimmed) return null
  const token = trimmed.split(/\s+/)[0]
  return token || null
}
