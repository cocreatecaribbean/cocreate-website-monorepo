import { Alkatra, Bricolage_Grotesque } from 'next/font/google'

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

const alkatra600 = Alkatra({
  subsets: ['latin'],
  weight: '600',
  variable: '--font-alkatra-600',
})

export {
  bricolage_grot400,
  bricolage_grot500,
  bricolage_grot600,
  bricolage_grot700,
  alkatra600,
}
