/** Shared heuristics for stripping / rejecting noisy PDF RAG chunks. */

const PAGE_MARKER_RE = /^--\s*\d+\s*of\s*\d+\s*--$/i
const FOOTER_RE = /^CoCreate Caribbean\s*[—–-]\s*Knowledge Base for AI RAG\b/i
const BULLET_ONLY_RE = /^[•·●◦\s]+$/
const MIN_USEFUL_CHARS = 40

/** Remove pagination, footer, and bullet-only lines from extracted PDF text. */
export function cleanPdfText(raw: string): string {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => {
      const trimmed = line.trim()
      if (!trimmed) return true
      if (PAGE_MARKER_RE.test(trimmed)) return false
      if (FOOTER_RE.test(trimmed)) return false
      if (BULLET_ONLY_RE.test(trimmed)) return false
      return true
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** True when a chunk is too noisy or too short to keep in the index / context. */
export function isJunkChunkText(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return true
  if (PAGE_MARKER_RE.test(trimmed)) return true
  if (FOOTER_RE.test(trimmed) && trimmed.length < 120) return true

  const withoutBullets = trimmed.replace(/[•·●◦]/g, '').trim()
  if (!withoutBullets) return true

  const meaningful = withoutBullets.replace(/\s+/g, ' ')
  if (meaningful.length < MIN_USEFUL_CHARS) return true

  // Mostly page markers / footer fragments mixed in a short blob
  if (
    PAGE_MARKER_RE.test(meaningful) ||
    (/^\d+\s*$/.test(meaningful) && meaningful.length < MIN_USEFUL_CHARS)
  ) {
    return true
  }

  return false
}
