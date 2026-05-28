export const DEFAULT_PROJECT_COVER_SRC = '/project-cover-default.svg'

export function projectCoverSrc(coverImageUrl?: string | null): string {
  return coverImageUrl ?? DEFAULT_PROJECT_COVER_SRC
}
