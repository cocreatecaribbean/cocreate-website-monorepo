import type { ProjectPreview } from '@cocreate/types'
import { enrichProjectPreviews } from '@/lib/project-preview'

/** Caribbean / Black representation — IDs verified with HTTP 200 */
const cover = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=1500&q=90`

const rawGalleryProjectPreviews: ProjectPreview[] = [
  {
    id: 'proven',
    clientName: 'Proven',
    projectName: 'Employee Experience Intranet',
    coverImageSrc: cover('photo-1739303987830-ca19742b19bc'),
  },
  {
    id: 'jps',
    clientName: 'JPS',
    projectName: 'Customer Self-Service Portal',
    coverImageSrc: cover('photo-1612115958726-9af4b6bd28d1'),
  },
  {
    id: 'vm-wealth',
    clientName: 'VM Wealth',
    projectName: 'Advisor Insights Dashboard',
    coverImageSrc: cover('photo-1641759013206-083e03f67462'),
  },
  {
    id: 'cancara',
    clientName: 'Cancara',
    projectName: 'Bernard Lodge',
    coverImageSrc: cover('photo-1594242505542-bca88a4076fc'),
  },
  {
    id: 'udc',
    clientName: 'UDC',
    projectName: 'Portmore Park',
    coverImageSrc: cover('photo-1542356670-bdf906b3ac87'),
  },
  {
    id: 'cibc',
    clientName: 'CIBC',
    projectName: 'Caribbean Brand Campaign',
    coverImageSrc: cover('photo-1605994543054-6ffbabbd8139'),
  },
  {
    id: 'grace-kennedy',
    clientName: 'GraceKennedy',
    projectName: 'Digital Commerce Refresh',
    coverImageSrc: cover('photo-1524504388940-b1c1722653e1'),
  },
  {
    id: 'ncb',
    clientName: 'NCB',
    projectName: 'Mobile Banking Experience',
    coverImageSrc: cover('photo-1507003211169-0a1dd7228f2d'),
  },
  {
    id: 'flow',
    clientName: 'Flow',
    projectName: 'Brand Evolution',
    coverImageSrc: cover('photo-1573496359142-b8d87734a5a2'),
  },
  {
    id: 'sandals',
    clientName: 'Sandals',
    projectName: 'Resort Launch Campaign',
    coverImageSrc: cover('photo-1519085360753-af0119f7cbe7'),
  },
  {
    id: 'grace-foods',
    clientName: 'Grace Foods',
    projectName: 'Product Story Hub',
    coverImageSrc: cover('photo-1560250097-0b93528c311a'),
  },
  {
    id: 'digicel',
    clientName: 'Digicel',
    projectName: 'Prepaid Journey',
    coverImageSrc: cover('photo-1522075469751-3a6694fb2f61'),
  },
  {
    id: 'taj-jamaica',
    clientName: 'Taj Jamaica',
    projectName: 'Heritage Microsite',
    coverImageSrc: cover('photo-1506794778202-cad84cf45f1d'),
  },
  {
    id: 'guardian',
    clientName: 'Guardian Group',
    projectName: 'Advisor Portal',
    coverImageSrc: cover('photo-1544005313-94ddf0286df2'),
  },
  {
    id: 'red-stripe',
    clientName: 'Red Stripe',
    projectName: 'Festival Activation',
    coverImageSrc: cover('photo-1534528741775-53994a69daeb'),
  },
  {
    id: 'epics',
    clientName: 'Epics Jamaica',
    projectName: 'Youth Sports Platform',
    coverImageSrc: cover('photo-1517841905240-472988babdf9'),
  },
  {
    id: 'atl',
    clientName: 'ATL',
    projectName: 'Insurance Self-Service',
    coverImageSrc: cover('photo-1487412720507-e7ab37603c6f'),
  },
  {
    id: 'kingston-freezone',
    clientName: 'Kingston Free Zone',
    projectName: 'Investor Portal',
    coverImageSrc: cover('photo-1438761681033-6461ffad8d80'),
  },
  {
    id: 'maia-chung',
    clientName: 'Maia Chung Foundation',
    projectName: 'Impact Stories',
    coverImageSrc: cover('photo-1508214751196-bcfd4ca60f91'),
  },
  {
    id: 'cpj',
    clientName: 'CPJ',
    projectName: 'Editorial Platform',
    coverImageSrc: cover('photo-1649972904349-6e44c42644a7'),
  },
  {
    id: 'petrojam',
    clientName: 'Petrojam',
    projectName: 'Stakeholder Hub',
    coverImageSrc: cover('photo-1531746020798-e6953c6e8e04'),
  },
  {
    id: 'mbj-airports',
    clientName: 'MBJ Airports',
    projectName: 'Passenger Experience',
    coverImageSrc: cover('photo-1552058544-f2b08422138a'),
  },
  {
    id: 'scotiabank-ja',
    clientName: 'Scotiabank Jamaica',
    projectName: 'Onboarding Flow',
    coverImageSrc: cover('photo-1525134479668-1bee5c7c6845'),
  },
  {
    id: 'hilo',
    clientName: 'Hi-Lo',
    projectName: 'Retail Loyalty App',
    coverImageSrc: cover('photo-1557862921-37829c790f19'),
  },
  {
    id: 'island-grill',
    clientName: 'Island Grill',
    projectName: 'Ordering Experience',
    coverImageSrc: cover('photo-1571019613454-1cb2f99b2d8b'),
  },
  {
    id: 'blue-mountain',
    clientName: 'Blue Mountain',
    projectName: 'Origin Campaign',
    coverImageSrc: cover('photo-1594824476967-48c8b964273f'),
  },
  {
    id: 'jamaica-tourist',
    clientName: 'Jamaica Tourist Board',
    projectName: 'Discover Jamaica Hub',
    coverImageSrc: cover('photo-1529156069898-49953e39b3ac'),
  },
]

/** Shared by work grid, home arc gallery, bento, and carousel */
export const galleryProjectPreviews = enrichProjectPreviews(rawGalleryProjectPreviews)

/** Home arc gallery — first N only; work grid uses full list with scroll batches */
export const HOME_GALLERY_PREVIEW_COUNT = 10

export const homeGalleryProjectPreviews = galleryProjectPreviews.slice(
  0,
  HOME_GALLERY_PREVIEW_COUNT,
)
