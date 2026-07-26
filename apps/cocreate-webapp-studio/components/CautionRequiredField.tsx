import {Card, Stack, Text} from '@sanity/ui'
import type {FieldProps} from 'sanity'

function isEmptyValue(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return !value.trim()
  if (typeof value === 'object' && value !== null) {
    const slug = value as {current?: string; asset?: {_ref?: string}}
    if ('current' in slug) return !slug.current?.trim()
    if ('asset' in slug) return !slug.asset?._ref
  }
  return false
}

/**
 * Yellow caution chrome when a required field is empty / invalid.
 */
export function CautionRequiredField(props: FieldProps) {
  const hasError = (props.validation ?? []).some((marker) => marker.level === 'error')
  const empty = isEmptyValue(props.value)
  const highlight = hasError || empty

  if (!highlight) {
    return props.renderDefault(props)
  }

  return (
    <Card tone="caution" padding={3} radius={2} border>
      <Stack space={3}>
        <Stack space={2}>
          <Text size={1} weight="semibold">
            {props.title || props.name}
          </Text>
          <Text size={1}>
            Required to publish
            {typeof props.description === 'string' && props.description.trim()
              ? ` — ${props.description}`
              : '.'}
          </Text>
        </Stack>
        {props.renderDefault({
          ...props,
          title: '',
          description: undefined,
        })}
      </Stack>
    </Card>
  )
}
