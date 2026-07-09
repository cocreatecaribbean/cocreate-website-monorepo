import {Card, Text} from '@sanity/ui'

type DatasetBadgeProps = {
  dataset: string
}

export function DatasetBadge({dataset}: DatasetBadgeProps) {
  const isProduction = dataset === 'production'

  return (
    <Card
      padding={2}
      radius={2}
      tone={isProduction ? 'critical' : 'primary'}
      marginRight={3}
      style={{flexShrink: 0}}
    >
      <Text size={1} weight="semibold">
        {isProduction ? 'Production — LIVE DATA' : `Dataset: ${dataset}`}
      </Text>
    </Card>
  )
}
