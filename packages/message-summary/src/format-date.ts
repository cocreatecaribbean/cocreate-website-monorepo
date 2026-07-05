export function formatSummaryDate(
  value: string,
  options?: { includeTime?: boolean },
): string {
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return value

  const date = new Date(parsed)
  const datePart = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  if (!options?.includeTime) return datePart

  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  return `${datePart} at ${timePart}`
}

export function formatMessageTimestamp(iso: string): string {
  return formatSummaryDate(iso, { includeTime: true })
}
