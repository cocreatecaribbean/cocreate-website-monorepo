import type { ProjectPreview } from '@cocreate/types'

/** Caribbean / Black representation — IDs verified with HTTP 200 */
const cover = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=1500&q=90`

/** Shared by work grid, home arc gallery, bento, and carousel */
export const galleryProjectPreviews: ProjectPreview[] = [
  {
    id: 'proven',
    clientName: 'Proven',
    projectName: 'Employee Experience Intranet',
    coverImageSrc: cover('photo-1739303987830-ca19742b19bc'),
    href: '/work',
  },
  {
    id: 'jps',
    clientName: 'JPS',
    projectName: 'Customer Self-Service Portal',
    coverImageSrc: cover('photo-1612115958726-9af4b6bd28d1'),
    href: '/work',
  },
  {
    id: 'vm-wealth',
    clientName: 'VM Wealth',
    projectName: 'Advisor Insights Dashboard',
    coverImageSrc: cover('photo-1641759013206-083e03f67462'),
    href: '/work',
  },
  {
    id: 'cancara',
    clientName: 'Cancara',
    projectName: 'Bernard Lodge',
    coverImageSrc: cover('photo-1594242505542-bca88a4076fc'),
    href: '/work',
  },
  {
    id: 'udc',
    clientName: 'UDC',
    projectName: 'Portmore Park',
    coverImageSrc: cover('photo-1542356670-bdf906b3ac87'),
    href: '/work',
  },
  {
    id: 'cibc',
    clientName: 'CIBC',
    projectName: 'Caribbean Brand Campaign',
    coverImageSrc: cover('photo-1605994543054-6ffbabbd8139'),
    href: '/work',
  },
]
