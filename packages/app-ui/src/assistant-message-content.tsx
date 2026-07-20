import {
  Fragment,
  type MouseEvent,
  type ReactNode,
} from 'react'

type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'ordered'; items: string[] }
  | { type: 'unordered'; items: string[] }

const ORDERED_RE = /^\s*(\d+)[.)]\s+(.+)$/
const UNORDERED_RE = /^\s*[-*•]\s+(.+)$/
const FENCE_RE = /^\s*```/
/** Bold (`**` / `__`) or markdown link `[label](href)`. */
const INLINE_RE = /(\*\*|__)(.+?)\1|\[([^\]]+)\]\(([^)\s]+)\)/g

const ALLOWED_HTTPS_HOST_SUFFIXES = [
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'youtube.com',
  'youtu.be',
] as const

/** Brand colors that stay readable on the always-light assistant panel. */
const BOLD_CLASS = 'font-semibold text-[#39419a]'
const LINK_CLASS =
  'font-medium text-[#406eb5] underline underline-offset-2 hover:text-[#39419a]'
const MARKER_CLASS = 'marker:text-[#39419a]'

/**
 * Models sometimes echo the href next to the label
 * (e.g. Team (`/?ccView=team`)). Strip that noise without touching
 * real markdown links `[label](href)`.
 */
function stripVisiblePathNoise(text: string): string {
  const links: string[] = []
  const protectedText = text.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (match) => {
      const token = `\u0000LINK${links.length}\u0000`
      links.push(match)
      return token
    },
  )

  const cleaned = protectedText
    // Team (`/?ccView=team`) / Team (`/team`)
    .replace(/\s*\(\s*`\/[^`]+`\s*\)/g, '')
    // Team (/?ccView=team) / Team (/team)
    .replace(/\s*\(\s*\/[^\s)]+\s*\)/g, '')
    // leftover bare `/path` in backticks
    .replace(/`\/[^`]+`/g, '')

  return cleaned.replace(/\u0000LINK(\d+)\u0000/g, (_, index: string) => {
    return links[Number(index)] ?? ''
  })
}

function stripDecorations(raw: string): string {
  return stripVisiblePathNoise(
    raw
      .replace(/\r\n/g, '\n')
      .split('\n')
      .filter((line) => !FENCE_RE.test(line))
      .join('\n')
      .replace(/^\s*#{1,6}\s+/gm, ''),
  ).trim()
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

function hostAllowed(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return ALLOWED_HTTPS_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  )
}

/** Relative site paths, mailto/tel, and known https social hosts. */
export function isAllowedAssistantHref(href: string): boolean {
  const trimmed = href.trim()
  if (!trimmed) return false

  const lower = trimmed.toLowerCase()
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('blob:')
  ) {
    return false
  }

  if (trimmed.startsWith('/')) {
    // Protocol-relative URLs are not same-origin paths.
    if (trimmed.startsWith('//')) return false
    return true
  }

  if (lower.startsWith('mailto:') || lower.startsWith('tel:')) return true

  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'https:') return false
    return hostAllowed(url.hostname)
  } catch {
    return false
  }
}

function stripResidualMarkdown(text: string): string {
  return text.replace(/\*\*/g, '').replace(/__/g, '')
}

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  )
}

function renderInline(
  text: string,
  keyPrefix: string,
  onNavigate?: (href: string) => void,
): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0
  INLINE_RE.lastIndex = 0

  while ((match = INLINE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={`${keyPrefix}-t-${key++}`}>
          {stripResidualMarkdown(text.slice(lastIndex, match.index))}
        </Fragment>,
      )
    }

    const isBold = Boolean(match[1])
    if (isBold) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${key++}`} className={BOLD_CLASS}>
          {match[2]}
        </strong>,
      )
    } else {
      const label = match[3] ?? ''
      const href = (match[4] ?? '').trim()
      if (isAllowedAssistantHref(href)) {
        const isExternal = /^https?:/i.test(href)
        const isRelative = href.startsWith('/')
        nodes.push(
          <a
            key={`${keyPrefix}-a-${key++}`}
            href={href}
            className={LINK_CLASS}
            {...(isExternal
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
            onClick={
              isRelative && onNavigate
                ? (event) => {
                    if (event.defaultPrevented || isModifiedClick(event)) return
                    event.preventDefault()
                    onNavigate(href)
                  }
                : undefined
            }
          >
            {label}
          </a>,
        )
      } else {
        nodes.push(
          <Fragment key={`${keyPrefix}-t-${key++}`}>{label}</Fragment>,
        )
      }
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push(
      <Fragment key={`${keyPrefix}-t-${key++}`}>
        {stripResidualMarkdown(text.slice(lastIndex))}
      </Fragment>,
    )
  }

  return nodes.length > 0
    ? nodes
    : [
        <Fragment key={`${keyPrefix}-empty`}>
          {stripResidualMarkdown(text)}
        </Fragment>,
      ]
}

export type AssistantMessageContentProps = {
  text: string
  /** Soft-navigate relative `/…` links (e.g. Next.js router.push). */
  onNavigate?: (href: string) => void
}

export default function AssistantMessageContent({
  text,
  onNavigate,
}: AssistantMessageContentProps) {
  const blocks = parseBlocks(text)
  if (blocks.length === 0) return null

  return (
    <div className="space-y-2.5">
      {blocks.map((block, index) => {
        if (block.type === 'paragraph') {
          return (
            <p key={`p-${index}`} className="m-0">
              {renderInline(block.text, `p-${index}`, onNavigate)}
            </p>
          )
        }

        if (block.type === 'ordered') {
          return (
            <ol
              key={`ol-${index}`}
              className={`m-0 list-decimal space-y-1.5 pl-5 marker:font-semibold ${MARKER_CLASS}`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`ol-${index}-${itemIndex}`} className="pl-0.5">
                  {renderInline(item, `ol-${index}-${itemIndex}`, onNavigate)}
                </li>
              ))}
            </ol>
          )
        }

        return (
          <ul
            key={`ul-${index}`}
            className={`m-0 list-disc space-y-1.5 pl-5 ${MARKER_CLASS}`}
          >
            {block.items.map((item, itemIndex) => (
              <li key={`ul-${index}-${itemIndex}`} className="pl-0.5">
                {renderInline(item, `ul-${index}-${itemIndex}`, onNavigate)}
              </li>
            ))}
          </ul>
        )
      })}
    </div>
  )
}
