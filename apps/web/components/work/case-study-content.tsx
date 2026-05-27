import { PortableText, type PortableTextComponents } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'
import Image from 'next/image'
import * as fonts from '@/styles/fonts'

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className={`mb-4 last:mb-0 ${fonts.bricolage_grot400.className}`}>{children}</p>
    ),
    h2: ({ children }) => (
      <h2
        className={`mb-4 mt-8 text-2xl text-sanmarino first:mt-0 ${fonts.bricolage_grot700.className}`}
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3
        className={`mb-3 mt-6 text-xl text-chambray first:mt-0 ${fonts.bricolage_grot600.className}`}
      >
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote
        className={`my-6 border-l-4 border-casablanca pl-5 text-lg italic text-slate-700 ${fonts.alkatra400.className}`}
      >
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className={`mb-4 list-disc space-y-2 pl-6 ${fonts.bricolage_grot400.className}`}>
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className={`mb-4 list-decimal space-y-2 pl-6 ${fonts.bricolage_grot400.className}`}>
        {children}
      </ol>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    link: ({ children, value }) => {
      const href = typeof value?.href === 'string' ? value.href : '#'
      return (
        <a href={href} className="text-sanmarino underline underline-offset-2 hover:text-chambray">
          {children}
        </a>
      )
    },
  },
  types: {
    image: ({ value }) => {
      const src = value?.asset?.url as string | undefined
      if (!src) return null
      const alt = typeof value?.alt === 'string' ? value.alt : ''
      const caption = typeof value?.caption === 'string' ? value.caption : undefined

      return (
        <figure className="my-8 overflow-hidden rounded-2xl ring-1 ring-chambray/10">
          <div className="relative aspect-[16/10] w-full">
            <Image src={src} alt={alt} fill sizes="900px" className="object-cover" />
          </div>
          {caption ? (
            <figcaption
              className={`px-4 py-3 text-sm text-slate-600 ${fonts.bricolage_grot400.className}`}
            >
              {caption}
            </figcaption>
          ) : null}
        </figure>
      )
    },
  },
}

type CaseStudyContentProps = {
  value: PortableTextBlock[]
}

export default function CaseStudyContent({ value }: CaseStudyContentProps) {
  return (
    <div className="prose-cocreate max-w-none text-lg leading-relaxed text-slate-800 min-[1024px]:text-xl">
      <PortableText value={value} components={components} />
    </div>
  )
}
