import { Fragment, type ReactNode } from 'react'

type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'ordered'; items: string[] }
  | { type: 'unordered'; items: string[] }

const ORDERED_RE = /^\s*(\d+)[.)]\s+(.+)$/
const UNORDERED_RE = /^\s*[-*•]\s+(.+)$/
const FENCE_RE = /^\s*```/

function stripDecorations(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => !FENCE_RE.test(line))
    .join('\n')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .trim()
}

function parseBlocks(text: string): Block[] {
  const lines = stripDecorations(text).split('\n')
  const blocks: Block[] = []
  let paragraphLines: string[] = []
  let ordered: string[] | null = null
  let unordered: string[] | null = null

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return
    const joined = paragraphLines.join(' ').replace(/\s+/g, ' ').trim()
    if (joined) blocks.push({ type: 'paragraph', text: joined })
    paragraphLines = []
  }

  const flushLists = () => {
    if (ordered?.length) {
      blocks.push({ type: 'ordered', items: ordered })
      ordered = null
    }
    if (unordered?.length) {
      blocks.push({ type: 'unordered', items: unordered })
      unordered = null
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      flushParagraph()
      flushLists()
      continue
    }

    const orderedMatch = trimmed.match(ORDERED_RE)
    if (orderedMatch) {
      flushParagraph()
      if (unordered) {
        blocks.push({ type: 'unordered', items: unordered })
        unordered = null
      }
      ordered = ordered ?? []
      ordered.push(orderedMatch[2] ?? '')
      continue
    }

    const unorderedMatch = trimmed.match(UNORDERED_RE)
    if (unorderedMatch) {
      flushParagraph()
      if (ordered) {
        blocks.push({ type: 'ordered', items: ordered })
        ordered = null
      }
      unordered = unordered ?? []
      unordered.push(unorderedMatch[1] ?? '')
      continue
    }

    flushLists()
    paragraphLines.push(trimmed)
  }

  flushParagraph()
  flushLists()
  return blocks
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /(\*\*|__)(.+?)\1/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={`${keyPrefix}-t-${key++}`}>
          {text.slice(lastIndex, match.index)}
        </Fragment>,
      )
    }
    nodes.push(
      <strong
        key={`${keyPrefix}-b-${key++}`}
        className="font-semibold text-chambray"
      >
        {match[2]}
      </strong>,
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push(
      <Fragment key={`${keyPrefix}-t-${key++}`}>
        {text.slice(lastIndex).replace(/\*\*/g, '').replace(/__/g, '')}
      </Fragment>,
    )
  }

  return nodes.length > 0
    ? nodes
    : [
        <Fragment key={`${keyPrefix}-empty`}>
          {text.replace(/\*\*/g, '').replace(/__/g, '')}
        </Fragment>,
      ]
}

export default function AssistantMessageContent({ text }: { text: string }) {
  const blocks = parseBlocks(text)
  if (blocks.length === 0) return null

  return (
    <div className="space-y-2.5">
      {blocks.map((block, index) => {
        if (block.type === 'paragraph') {
          return (
            <p key={`p-${index}`} className="m-0">
              {renderInline(block.text, `p-${index}`)}
            </p>
          )
        }

        if (block.type === 'ordered') {
          return (
            <ol
              key={`ol-${index}`}
              className="m-0 list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-chambray"
            >
              {block.items.map((item, itemIndex) => (
                <li key={`ol-${index}-${itemIndex}`} className="pl-0.5">
                  {renderInline(item, `ol-${index}-${itemIndex}`)}
                </li>
              ))}
            </ol>
          )
        }

        return (
          <ul
            key={`ul-${index}`}
            className="m-0 list-disc space-y-1.5 pl-5 marker:text-chambray"
          >
            {block.items.map((item, itemIndex) => (
              <li key={`ul-${index}-${itemIndex}`} className="pl-0.5">
                {renderInline(item, `ul-${index}-${itemIndex}`)}
              </li>
            ))}
          </ul>
        )
      })}
    </div>
  )
}
