const LABELS: Record<string, string> = {
  x: 'X',
  tiktok: 'TikTok',
  reddit: 'Reddit',
  instagram: 'Instagram',
  facebook: 'Facebook',
  web: 'Web & blogs',
  forums: 'Forums',
}

export function platformLabel(platformId: string): string {
  return LABELS[platformId] ?? platformId
}
