import {Card, Stack, Text} from '@sanity/ui'
import type {FieldProps} from 'sanity'

const DEFAULT_PUBLISHED_AT_HELP =
  'Required for the public site. Empty = invisible on the live site even after you Publish this document in Studio.'

/**
 * Caution Card around Published at so label + description inherit caution fg
 * (CSS vars only apply inside tone="caution"). Hides default field chrome to
 * avoid a duplicate white title.
 */
export function PublishedAtField(props: FieldProps) {
  const help =
    typeof props.description === 'string' && props.description.trim()
      ? props.description
      : DEFAULT_PUBLISHED_AT_HELP

  return (
    <Card tone="caution" padding={3} radius={2} border>
      <Stack space={3}>
        <Stack space={2}>
          <Text size={1} weight="semibold">
            Published at
          </Text>
          <Text size={1}>{help}</Text>
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
