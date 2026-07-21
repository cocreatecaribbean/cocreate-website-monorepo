/** Company-local timezone for assistant “today” / relative date answers. */
export const ASSISTANT_TIMEZONE = 'America/Jamaica'

function formatLocalDateTime(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'shortOffset',
  }).format(now)
}

function formatDayOfWeek(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
  }).format(now)
}

/**
 * Short runtime block prepended to assistant system prompts.
 * Rebuilt per request so date/time stay current.
 */
export function formatAssistantRuntimeContext(
  now: Date = new Date(),
  timeZone: string = ASSISTANT_TIMEZONE,
): string {
  const local = formatLocalDateTime(now, timeZone)
  const dayOfWeek = formatDayOfWeek(now, timeZone)
  const utc = now.toISOString().replace(/\.\d{3}Z$/, 'Z')

  return `CURRENT CONTEXT (authoritative for “today”, “this week”, relative dates):
- Local date/time: ${local} (${timeZone})
- UTC: ${utc}
- Day of week: ${dayOfWeek}

General knowledge:
- Use CURRENT CONTEXT for any date/time/“today” questions.
- You may use ordinary general knowledge (calendar, units, definitions, math) when helpful.
- Do not invent live/external facts (weather, news, stock prices, user account data) that are not in CURRENT CONTEXT, SITE/PRODUCT FACTS, or RETRIEVED CONTEXT.
- Product/company answers still follow SITE FACTS / PRODUCT FACTS / grounding rules — do not invent CoCreate-specific details.`
}
