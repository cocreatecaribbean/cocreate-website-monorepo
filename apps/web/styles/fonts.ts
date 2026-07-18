// styles/fonts.ts
import localFont from 'next/font/local'
import {
  Alkatra,
  Bricolage_Grotesque,
  Dela_Gothic_One,
  Krona_One,
  Michroma,
  Oi,
  Press_Start_2P,
  Syne,
} from 'next/font/google'

// You MUST include subsets: ['latin'] for Google Fonts to work
const bricolage_grot300 = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: '300',
  variable: '--font-brico-300',
})

const bricolage_grot400 = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-brico-400',
})

const bricolage_grot500 = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: '500',
  variable: '--font-brico-500',
})

const bricolage_grot600 = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: '600',
  variable: '--font-brico-600',
})

const bricolage_grot700 = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: '700',
  variable: '--font-brico-700',
})

const bricolage_grot800 = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: '800',
  variable: '--font-brico-800',
})

const alkatra400 = Alkatra({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-alkatra-400',
})

const alkatra600 = Alkatra({
  subsets: ['latin'],
  weight: '600',
  variable: '--font-alkatra-600',
})

/** Philosophy title loop faces */
const syne700 = Syne({
  subsets: ['latin'],
  weight: '700',
  variable: '--font-syne-700',
})

const kronaOne = Krona_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-krona-one',
})

const oi = Oi({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-oi',
})

const pressStart2P = Press_Start_2P({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-press-start-2p',
})

const michroma = Michroma({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-michroma',
})

const delaGothicOne = Dela_Gothic_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-dela-gothic-one',
})

/** OFL display face — https://github.com/koci-design/AlienBlock */
const alienBlock = localFont({
  src: './fonts/AlienBlock-Regular.ttf',
  weight: '400',
  style: 'normal',
  variable: '--font-alien-block',
  display: 'swap',
})

export {
  bricolage_grot300,
  bricolage_grot400,
  bricolage_grot500,
  bricolage_grot600,
  bricolage_grot700,
  bricolage_grot800,
  alkatra400,
  alkatra600,
  syne700,
  kronaOne,
  oi,
  pressStart2P,
  michroma,
  delaGothicOne,
  alienBlock,
}
