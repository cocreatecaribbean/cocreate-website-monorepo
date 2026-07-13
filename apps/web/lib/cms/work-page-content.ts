import { workPageTitle } from '@/site-info/work-page-data'

export type WorkPageContent = {
  titleLineOne: string
  titleLineTwo: string
}

export type SanityWorkPageRow = {
  titleLineOne?: string | null
  titleLineTwo?: string | null
}

export function withWorkPageDefaults(
  row: SanityWorkPageRow | null | undefined,
): WorkPageContent {
  return {
    titleLineOne: row?.titleLineOne?.trim() || workPageTitle.lineOne,
    titleLineTwo: row?.titleLineTwo?.trim() || workPageTitle.lineTwo,
  }
}

export function mergeWorkPageContent(
  initial: WorkPageContent,
  live: SanityWorkPageRow | null | undefined,
): WorkPageContent {
  if (!live) return initial
  return withWorkPageDefaults({
    titleLineOne:
      live.titleLineOne !== undefined ? live.titleLineOne : initial.titleLineOne,
    titleLineTwo:
      live.titleLineTwo !== undefined ? live.titleLineTwo : initial.titleLineTwo,
  })
}
