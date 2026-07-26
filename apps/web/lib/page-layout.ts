/**
 * Clears the fixed site nav (layout wrappers are h-0).
 * Geometry-based: mobile bar + gap; desktop rem stack (not svh) so short
 * widescreen laptops don’t get a huge empty band under the pill.
 */
export const pageNavClearanceClass = [
  'pt-[calc(max(3.5rem,10svh)+3rem)]',
  'sm:pt-[calc(max(3.5rem,10svh)+3.25rem)]',
  'min-[1024px]:pt-[9.5rem]',
  'min-[1500px]:pt-44',
  // Short viewports: tighten further (max-height, not max-width)
  '[@media(max-height:800px)]:min-[1024px]:pt-32',
  '[@media(max-height:800px)]:min-[1500px]:pt-36',
  'landscape:pt-28',
  'landscape:lg:pt-36',
  'landscape:xl:pt-44',
].join(' ')

/**
 * Space above the global site footer (Home’s former last-section + main gap).
 * Height spacer in root layout — not margin (avoids collapse) and not per-page pb.
 * Note: pb-68 is not a default Tailwind key; use rem arbitrary values when needed.
 */
export const pageFooterClearanceClass = 'h-48 md:h-[17rem] lg:h-72 shrink-0'

/** @deprecated Prefer pageNavClearanceClass — same value. */
export const workPageTopOffsetClass = pageNavClearanceClass
