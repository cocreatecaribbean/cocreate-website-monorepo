import type { SentimentId } from '@/lib/social-listening/types'

/** Chart arc / stream colors — brand-tinted, not generic traffic-light green */
export const SENTIMENT_BRAND_COLORS: Record<SentimentId, string> = {
  positive: '#406eb5',
  neutral: '#a8b8e8',
  negative: '#d94f4f',
}

export const SENTIMENT_GRADIENT_STOPS: Record<
  SentimentId,
  { start: string; end: string }
> = {
  positive: { start: '#406eb5', end: '#f6b03f' },
  neutral: { start: '#c5cee8', end: '#94a3b8' },
  negative: { start: '#39419a', end: '#e85d5d' },
}

export const SENTIMENT_LABELS: Record<SentimentId, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
}

export const SENTIMENT_EMOJI: Record<SentimentId, string> = {
  positive: '😊',
  neutral: '😐',
  negative: '😞',
}
