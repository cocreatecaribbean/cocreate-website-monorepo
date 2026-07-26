import {Card, Stack, Text} from '@sanity/ui'
import {pathToString, useFormValue, useValidationStatus, type ObjectInputProps} from 'sanity'

function formatPath(path: unknown): string {
  if (!Array.isArray(path) || path.length === 0) return ''
  try {
    return pathToString(path as Parameters<typeof pathToString>[0])
  } catch {
    return path
      .map((segment) => {
        if (typeof segment === 'string' || typeof segment === 'number') return String(segment)
        if (segment && typeof segment === 'object' && '_key' in segment) {
          return `[_key=${String((segment as {_key?: string})._key)}]`
        }
        return '?'
      })
      .join('.')
  }
}

/**
 * Top-of-form banner listing every validation error (with path) so Publish
 * blockers are obvious — including nested brand-fill / leftover film fields.
 */
export function OriginalDocumentInput(props: ObjectInputProps) {
  const documentId = useFormValue(['_id']) as string | undefined
  const documentType = (useFormValue(['_type']) as string | undefined) || 'original'
  const {validation} = useValidationStatus(documentId || 'noop', documentType, false)

  const fromStatus = validation.filter((marker) => marker.level === 'error')
  const fromProps = (props.validation ?? []).filter((marker) => marker.level === 'error')

  // Prefer full document status; fall back to root props if status is empty.
  const errors = fromStatus.length > 0 ? fromStatus : fromProps

  // Dedupe by message+path
  const seen = new Set<string>()
  const uniqueErrors = errors.filter((marker) => {
    const key = `${marker.message}|${formatPath(marker.path)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return (
    <Stack space={4}>
      {uniqueErrors.length > 0 ? (
        <Card tone="critical" padding={4} radius={2} border>
          <Stack space={3}>
            <Text size={2} weight="semibold">
              Can’t publish yet — fix these first
            </Text>
            <Text size={1} muted>
              Sanity blocks Publish while any field has an error. Use this list (field path in
              parentheses), then scroll to that section.
            </Text>
            <Stack space={2} as="ul" style={{margin: 0, paddingLeft: 18}}>
              {uniqueErrors.map((marker, index) => {
                const pathLabel = formatPath(marker.path)
                return (
                  <Text key={`${marker.message}-${pathLabel}-${index}`} as="li" size={1}>
                    {marker.message}
                    {pathLabel ? (
                      <span style={{opacity: 0.75}}> ({pathLabel})</span>
                    ) : null}
                  </Text>
                )
              })}
            </Stack>
          </Stack>
        </Card>
      ) : null}
      {props.renderDefault(props)}
    </Stack>
  )
}
