import type { SocialListeningMetricDelta } from '@cocreate/api-contracts/v1/social-listening'

export function formatMetricDeltaLine(
  delta: SocialListeningMetricDelta,
  asPercent = false,
): string {
  const sign = delta.change > 0 ? '+' : ''
  if (asPercent && delta.percentChange !== null) {
    const pctSign = delta.percentChange > 0 ? '+' : ''
    return `${pctSign}${delta.percentChange.toFixed(1)}% vs baseline`
  }
  return `${sign}${delta.change.toLocaleString()} vs baseline`
}

/** Percent + absolute change on one line with a single "vs baseline" suffix. */
export function formatMetricDeltaCompact(delta: SocialListeningMetricDelta): string {
  const sign = delta.change > 0 ? '+' : ''
  const changePart = `${sign}${delta.change.toLocaleString()}`
  if (delta.percentChange !== null) {
    const pctSign = delta.percentChange > 0 ? '+' : ''
    return `${pctSign}${delta.percentChange.toFixed(1)}% (${changePart} vs baseline)`
  }
  return `${changePart} vs baseline`
}

export function metricDelta(baseline: number, current: number): SocialListeningMetricDelta {
  const change = current - baseline
  const percentChange =
    baseline === 0 ? (current === 0 ? 0 : null) : (change / baseline) * 100
  return { baseline, current, change, percentChange }
}
