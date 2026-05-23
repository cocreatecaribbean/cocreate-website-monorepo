export const workPageTitle = {
  lineOne: 'Our',
  lineTwo: 'Work',
} as const

export type WorkPageTitle =
  | { variant: 'default'; lineOne: string; lineTwo: string }
  | { variant: 'filter'; text: string }

export function getWorkPageTitle(options?: {
  clientName?: string | null
  categoryName?: string | null
}): WorkPageTitle {
  if (options?.clientName) {
    return {
      variant: 'filter',
      text: `${options.clientName} Projects`,
    }
  }

  if (options?.categoryName) {
    return {
      variant: 'filter',
      text: `${options.categoryName} Projects`,
    }
  }

  return {
    variant: 'default',
    lineOne: workPageTitle.lineOne,
    lineTwo: workPageTitle.lineTwo,
  }
}

export function formatWorkPageTitle(title: WorkPageTitle): string {
  if (title.variant === 'filter') return title.text
  return `${title.lineOne} ${title.lineTwo}`
}
