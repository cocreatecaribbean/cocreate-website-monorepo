const SHORT_QUOTE_MAX_CHARS = 280
const SHORT_QUOTE_MAX_SENTENCES = 2
const LONG_QUOTE_CHARS_FOR_FOUR = 600

/**
 * Split a CMS testimonial quote into readable paragraphs.
 * Honors blank-line breaks from editors; otherwise buckets sentences into ~3–4 paras.
 */
export function formatTestimonialQuoteParagraphs(quote: string): string[] {
  const trimmed = quote.trim()
  if (!trimmed) return []

  const withNormalizedNewlines = trimmed.replace(/\r\n/g, '\n')

  const explicit = withNormalizedNewlines
    .split(/\n\s*\n/)
    .map((block) => collapseInlineWhitespace(block))
    .filter(Boolean)

  if (explicit.length >= 2) return explicit

  const singleBlock = collapseInlineWhitespace(withNormalizedNewlines)
  const sentences = splitSentences(singleBlock)

  if (
    sentences.length <= SHORT_QUOTE_MAX_SENTENCES ||
    singleBlock.length <= SHORT_QUOTE_MAX_CHARS
  ) {
    return [singleBlock]
  }

  const targetCount =
    singleBlock.length >= LONG_QUOTE_CHARS_FOR_FOUR || sentences.length >= 8
      ? 4
      : 3

  return bucketSentences(sentences, Math.min(targetCount, sentences.length))
}

function collapseInlineWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+(?:[.!?]+(?:["”']+)?(?=\s|$)|$)/g)
  if (!matches?.length) return [text]
  return matches.map((s) => s.trim()).filter(Boolean)
}

function bucketSentences(sentences: string[], targetCount: number): string[] {
  if (targetCount <= 1 || sentences.length <= 1) {
    return [sentences.join(' ')]
  }

  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0)
  const targetChars = totalChars / targetCount
  const paragraphs: string[] = []
  let current: string[] = []
  let currentChars = 0

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i]!
    const remainingSentences = sentences.length - i
    const remainingSlots = targetCount - paragraphs.length

    current.push(sentence)
    currentChars += sentence.length

    const shouldClose =
      paragraphs.length < targetCount - 1 &&
      remainingSentences - 1 >= remainingSlots - 1 &&
      (currentChars >= targetChars || remainingSentences - 1 === remainingSlots - 1)

    if (shouldClose) {
      paragraphs.push(current.join(' '))
      current = []
      currentChars = 0
    }
  }

  if (current.length) {
    paragraphs.push(current.join(' '))
  }

  return paragraphs
}
