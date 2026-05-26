export const ATTENTION_PAGE_PATH = '/attention'

/** Fallback badge count when notifications have not loaded yet. */
export function getAttentionItemCount(): number {
  return 0
}

export function formatAttentionStatusLabel(count: number): string {
  if (count <= 0) return ''
  const noun = count === 1 ? 'item needs' : 'items need'
  return `${count} ${noun} attention`
}
