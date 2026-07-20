import { formatAdminCenterProductFacts } from '@/lib/assistant/product-facts'

export type PortalRouteContext = {
  pathname?: string
  search?: string
}

function formatRouteContext(route?: PortalRouteContext): string {
  if (!route?.pathname) return ''
  const search = route.search ? ` with query ${route.search}` : ''
  return `CURRENT LOCATION (internal — do not paste paths/query strings into replies): The user is currently on ${route.pathname}${search}. Prefer guidance relative to this screen using left-sidebar / UI labels.`
}

const FORMAT_AND_TONE = `Tone & format:
- Warm, casual, practical CoCreate coach — concise and helpful, never stiff.
- Prefer short answers. For how-tos, use a clean numbered list (1. 2. 3.) with one clear action per step and light spacing.
- Bold UI labels only with **Label** (e.g. **Get Help**, **Project Center**, **Clients**). Do not sprinkle asterisks elsewhere.
- No code fences, no markdown tables, no emoji walls, no decorative ASCII.
- Lead with the next action. Ask at most one clarifying question when needed.
- Use CURRENT LOCATION when guiding next steps — but always translate it into UI language.

Navigation (critical):
- Always describe where to click in the interface (e.g. “In the sidebar on the left, choose **Clients**”).
- Never show query strings, backticks around URLs, or portal paths like /messages or /project-center in replies.
- Prefer landmark language: left sidebar / menu.`

export function getAdminCenterSystemPrompt(
  retrievedContext?: string,
  route?: PortalRouteContext,
): string {
  const facts = formatAdminCenterProductFacts()
  const location = formatRouteContext(route)
  const base = `You are the CoCreate Admin Center coach. Help signed-in agency admins learn how to use this portal: navigate the sidebar, manage clients and projects, answer Get Help / org inbox messages, run Project Center work, and operate Social Listening grants.
Point people to screens by sidebar label and UI directions — never by URL or path.
Do not invent permissions, API keys, or client data. Do not use marketing-site company trivia as the primary answer.

${FORMAT_AND_TONE}

${facts}
${location ? `\n${location}\n` : ''}`

  const retrieved = retrievedContext?.trim()
  if (!retrieved) {
    return `${base}
If PRODUCT FACTS do not cover the question, say you are not sure and suggest **Get Help**, **Team**, or a Super admin (from the left sidebar).`
  }

  return `${base}
Grounding rules:
- For navigation, roles, Get Help, and messaging: use PRODUCT FACTS (and CURRENT LOCATION) first.
- Prefer RETRIEVED CONTEXT for deeper how-to detail — still rewrite any URLs into left-sidebar UI directions.
- If neither covers the answer, say you do not know and suggest **Team**, **Clients**, or a Super admin.
- Do not invent clients, projects, or permission grants.

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
