// styles/fonts.ts
import {
  Alkatra,
  BioRhyme_Expanded,
  Bricolage_Grotesque,
  Krona_One,
  Michroma,
  Oi,
  Press_Start_2P,
  Stalinist_One,
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

const bioRhymeExpanded = BioRhyme_Expanded({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-biorhyme-expanded',
})

const stalinistOne = Stalinist_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-stalinist-one',
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
  bioRhymeExpanded,
  stalinistOne,
}
