import * as fonts from '@/styles/fonts'
import ViewAllWorkLink from '@/components/work/view-all-work-link'
import { getWorkPageTitle } from '@/site-info/work-page-data'
import { workPageTopOffsetClass } from '@/lib/work-page-layout'
import { cn } from '@/utils/tailwind-helpers'

type WorkPageHeaderProps = {
  clientFilterName?: string | null
  categoryFilterName?: string | null
}

export default function WorkPageHeader({
  clientFilterName,
  categoryFilterName,
}: WorkPageHeaderProps) {
  const title = getWorkPageTitle({
    clientName: clientFilterName,
    categoryName: categoryFilterName,
  })
  const isFiltered = Boolean(clientFilterName ?? categoryFilterName)

  return (
    <section className="work-page-header mx-auto mb-8 flex w-[88svw] max-w-[1320px] flex-col text-black min-[1024px]:mb-12 min-[1500px]:mb-16">
      <h1
        data-work-page-heading
        className={cn(
          'work-page-title w-fit overflow-hidden bg-clip-text text-center leading-none',
          'uppercase opacity-0',
          'bg-linear-to-r from-sanmarino via-sanmarino to-casablanca text-transparent',
          'mx-auto',
          workPageTopOffsetClass,
        )}
      >
        {title.variant === 'filter' ? (
          <span
            className={`text-[clamp(2rem,6.5vw,4.5rem)] min-[1500px]:text-[clamp(3rem,4.5vw,6rem)] ${fonts.bricolage_grot800.className}`}
          >
            {title.text}
          </span>
        ) : (
          <>
            <span
              className={`text-[clamp(2.75rem,8vw,5rem)] min-[1500px]:text-[clamp(4rem,5vw,7rem)] ${fonts.bricolage_grot800.className}`}
            >
              {title.lineOne}
            </span>{' '}
            <br />
            <span
              className={`text-[clamp(1.85rem,6vw,3.5rem)] min-[1500px]:text-[clamp(3rem,4vw,6rem)] ${fonts.alkatra400.className}`}
            >
              {title.lineTwo}
            </span>
          </>
        )}
      </h1>
      {isFiltered ? (
        <ViewAllWorkLink className="mx-auto mt-6 min-[1024px]:mt-8" />
      ) : null}
    </section>
  )
}
