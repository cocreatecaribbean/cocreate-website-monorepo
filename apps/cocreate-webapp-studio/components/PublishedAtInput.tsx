import {Card, Stack, Text} from '@sanity/ui'
import type {FieldProps} from 'sanity'

/**
 * Caution Card around Published at so label + description inherit caution fg
 * (CSS vars only apply inside tone="caution"). Hides default field chrome to
 * avoid a duplicate white title.
 */
export function PublishedAtField(props: FieldProps) {
  return (
    <Card tone="caution" padding={3} radius={2} border>
      <Stack space={3}>
        <Stack space={2}>
          <Text size={1} weight="semibold">
            Published at
          </Text>
          <Text size={1}>
            Required for the public Work page. Empty = invisible on the site even if Work page is
            Published.
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
