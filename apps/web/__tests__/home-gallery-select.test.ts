import type { ProjectPreview } from '@cocreate/types'
import { selectHomeGalleryPreviews } from '@/lib/cms/home-gallery-select'

function preview(
  id: string,
  options?: { featured?: boolean; cover?: boolean },
): ProjectPreview {
  return {
    id,
    slug: id,
    projectName: id,
    clientName: 'Client',
    coverImageSrc: options?.cover === false ? '' : `https://cdn.example.com/${id}.jpg`,
    featured: options?.featured ?? false,
  }
}

describe('selectHomeGalleryPreviews', () => {
  it('puts featured projects first while preserving array order within groups', () => {
    const items = [
      preview('a'),
      preview('b', { featured: true }),
      preview('c'),
      preview('d', { featured: true }),
      preview('e'),
    ]

    expect(selectHomeGalleryPreviews(items, 10).map((p) => p.id)).toEqual([
      'b',
      'd',
      'a',
      'c',
      'e',
    ])
  })

  it('fills remaining slots with non-featured after featured', () => {
    const items = [
      preview('a'),
      preview('b', { featured: true }),
      preview('c'),
    ]

    expect(selectHomeGalleryPreviews(items, 2).map((p) => p.id)).toEqual([
      'b',
      'a',
    ])
  })

  it('prefers projects with covers when any exist', () => {
    const items = [
      preview('no-cover', { featured: true, cover: false }),
      preview('with-cover'),
      preview('featured-cover', { featured: true }),
    ]

    expect(selectHomeGalleryPreviews(items, 10).map((p) => p.id)).toEqual([
      'featured-cover',
      'with-cover',
    ])
  })

  it('falls back to coverless projects when none have covers', () => {
    const items = [
      preview('a', { cover: false }),
      preview('b', { featured: true, cover: false }),
    ]

    expect(selectHomeGalleryPreviews(items, 10).map((p) => p.id)).toEqual([
      'b',
      'a',
    ])
  })
})
