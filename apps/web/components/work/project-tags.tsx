import Link from 'next/link'
import * as fonts from '@/styles/fonts'
import { toTagSlug, workTagFilterHref } from '@/lib/tag-slug'

type ProjectTagsProps = {
  tags?: string[]
}

export default function ProjectTags({ tags }: ProjectTagsProps) {
  const items = tags?.filter(Boolean) ?? []
  if (items.length === 0) return null

  return (
    <ul
      className={`mt-5 flex flex-wrap gap-2 min-[1024px]:mt-6 ${fonts.bricolage_grot500.className}`}
      aria-label="Project tags"
    >
      {items.map((tag) => (
        <li key={tag}>
          <Link
            href={workTagFilterHref(toTagSlug(tag))}
            className="
              inline-flex items-center rounded-full border border-chambray/15
              bg-white/70 px-3 py-1 text-[0.7rem] uppercase tracking-[0.14em]
              text-chambray transition-colors hover:border-sanmarino/35
              hover:bg-sanmarino/8 hover:text-sanmarino
              min-[1024px]:text-xs
            "
          >
            {tag}
          </Link>
        </li>
      ))}
    </ul>
  )
}
