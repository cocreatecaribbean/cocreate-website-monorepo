/** US Letter portrait — print-friendly reports */
export const LETTER_PAGE_SIZE = 'LETTER' as const

/** 16:9 presentation slide dimensions (points) */
export const DECK_PAGE_SIZE: [number, number] = [1920, 1080]

export type ReportFormat = 'letter' | 'deck'
