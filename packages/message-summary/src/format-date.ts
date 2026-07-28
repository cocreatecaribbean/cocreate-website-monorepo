export const DEFAULT_PDF_TIMEZONE = 'America/Jamaica'

export function resolvePdfTimeZone(raw?: string | null): string {
  const candidate = raw?.trim()
  if (!candidate) return DEFAULT_PDF_TIMEZONE
  try {
    // Throws RangeError for invalid IANA zones
    Intl.DateTimeFormat('en-US', { timeZone: candidate }).format(new Date())
    return candidate
  } catch {
    return DEFAULT_PDF_TIMEZONE
  }
}

export function formatSummaryDate(
  value: string,
  options?: { includeTime?: boolean; timeZone?: string },
): string {
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return value

  const date = new Date(parsed)
  const timeZone = options?.timeZone
    ? resolvePdfTimeZone(options.timeZone)
    : undefined

  const datePart = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...(timeZone ? { timeZone } : {}),
  })

  if (!options?.includeTime) return datePart

  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    ...(timeZone ? { timeZone, timeZoneName: 'short' } : {}),
  })
  return `${datePart} at ${timePart}`
}

export function formatMessageTimestamp(
  iso: string,
  timeZone?: string,
): string {
  return formatSummaryDate(iso, { includeTime: true, timeZone })
}

export function formatExportInstant(
  iso: string,
  timeZone?: string,
): string {
  const parsed = Date.parse(iso)
  if (Number.isNaN(parsed)) return iso
  const zone = resolvePdfTimeZone(timeZone)
  return new Date(parsed).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: zone,
    timeZoneName: 'short',
  })
}
