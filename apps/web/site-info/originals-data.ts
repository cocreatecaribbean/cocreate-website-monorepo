import type { OriginalPreview } from '@cocreate/types'

const cover = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=1500&q=90`

/** Static originals until Sanity content is live */
export const originalPreviews: OriginalPreview[] = [
  {
    id: 'island-pulse',
    title: 'Island Pulse',
    slug: 'island-pulse',
    format: 'Docuseries',
    description: 'A studio-led look at Caribbean creators reshaping culture.',
    coverImageSrc: cover('photo-1492566660923-9eb435b7bb9a'),
    href: '/originals',
  },
  {
    id: 'midnight-market',
    title: 'Midnight Market',
    slug: 'midnight-market',
    format: 'Short film',
    description: 'Night markets, neon light, and stories after closing time.',
    coverImageSrc: cover('photo-1514525253161-7a46d19cd819'),
    href: '/originals',
  },
  {
    id: 'sound-of-kingston',
    title: 'Sound of Kingston',
    slug: 'sound-of-kingston',
    format: 'Podcast',
    description: 'Conversations with producers defining the modern dancehall sound.',
    coverImageSrc: cover('photo-1470225620780-dba8ba36b745'),
    href: '/originals',
  },
  {
    id: 'coastal-lines',
    title: 'Coastal Lines',
    slug: 'coastal-lines',
    format: 'Brand film',
    description: 'An original visual poem celebrating Caribbean coastlines.',
    coverImageSrc: cover('photo-1507525428034-b723cf961d3e'),
    href: '/originals',
  },
]
