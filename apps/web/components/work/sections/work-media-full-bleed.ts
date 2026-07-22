/**
 * Break out of the work article (`w-[88svw] max-w-[1200px]`) to viewport edges.
 * Uses margin (not transform) so ScrollTrigger / section reveals keep correct bounds.
 */
export const workMediaFullBleedClass =
  'relative w-screen max-w-[100vw] ml-[calc(50%-50vw)] mr-[calc(50%-50vw)]'
