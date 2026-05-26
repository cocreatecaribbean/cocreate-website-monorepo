import { Text, View } from '@react-pdf/renderer'
import type { SourceBreakdownRow } from '../types'
import { platformLabel } from '../platform-labels'
import { theme } from '../theme'

export function PlatformBars({ rows }: { rows: SourceBreakdownRow[] }) {
  const sorted = [...rows].sort((a, b) => b.mentions - a.mentions)
  const max = Math.max(...sorted.map((r) => r.mentions), 1)

  return (
    <View>
      <Text style={theme.sectionTitle}>Mentions by platform</Text>
      <Text style={theme.sectionDesc}>Where your brand is being discussed.</Text>
      {sorted.map((row) => {
        const widthPct = `${Math.max(4, (row.mentions / max) * 100)}%`
        return (
          <View key={row.platformId} style={theme.barRow}>
            <Text style={theme.barLabel}>{platformLabel(row.platformId)}</Text>
            <View style={theme.barTrack}>
              <View style={[theme.barFill, { width: widthPct }]} />
            </View>
            <Text style={theme.barValue}>{row.mentions.toLocaleString()}</Text>
          </View>
        )
      })}
    </View>
  )
}
