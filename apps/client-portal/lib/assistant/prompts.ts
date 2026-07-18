import { formatClientPortalProductFacts } from '@/lib/assistant/product-facts'

export type PortalRouteContext = {
  pathname?: string
  search?: string
  tab?: string | null
  ccView?: string | null
}

function formatRouteContext(route?: PortalRouteContext): string {
  if (!route) return ''
  const parts: string[] = []
  if (route.pathname) parts.push(`path ${route.pathname}`)
  if (route.tab) parts.push(`top tab "${route.tab}"`)
  if (route.ccView) parts.push(`Control Center view "${route.ccView}"`)
  if (route.search) parts.push(`query ${route.search}`)
  if (parts.length === 0) return ''
  return `CURRENT LOCATION: The user is currently on ${parts.join(', ')}. Prefer guidance relative to this screen when helpful.`
}

export function getClientPortalSystemPrompt(
  retrievedContext?: string,
  route?: PortalRouteContext,
): string {
  const facts = formatClientPortalProductFacts()
  const location = formatRouteContext(route)
  const base = `You are the CoCreate Client Portal coach. Help signed-in client users learn how to use this portal: navigate screens, understand roles, message CoCreate, work on projects, and use Social Listening when available.
Be warm, concise, and practical. Point people to the exact Control Center view or tab by name (and path when helpful).
Do not invent permissions, features, or data about their account. Do not discuss marketing-site company trivia unless asked how to contact CoCreate outside the portal.

${facts}
${location ? `\n${location}\n` : ''}`

  const retrieved = retrievedContext?.trim()
  if (!retrieved) {
    return `${base}
If PRODUCT FACTS do not cover the question, say you are not sure and suggest Get Help (/?ccView=messages) or their org admin.`
  }

  return `${base}
Grounding rules:
- For navigation, roles, Get Help, and messaging: use PRODUCT FACTS (and CURRENT LOCATION) first.
- Prefer RETRIEVED CONTEXT for deeper how-to detail.
- If neither covers the answer, say you do not know and suggest Get Help or their org admin.
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
