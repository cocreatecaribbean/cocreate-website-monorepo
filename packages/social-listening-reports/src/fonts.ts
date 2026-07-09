import { Font } from '@react-pdf/renderer'

let registered = false

const BRICOLAGE = {
  400: 'https://fonts.gstatic.com/s/bricolagegrotesque/v9/3y9U6as8bTXq_nANBjzKo3IeZx8z6up5BeSl5jBNz_19PpbpMXuECpwUxJBOm_OJWiaaD30YfKfjZZoLvRviyM0.ttf',
  600: 'https://fonts.gstatic.com/s/bricolagegrotesque/v9/3y9U6as8bTXq_nANBjzKo3IeZx8z6up5BeSl5jBNz_19PpbpMXuECpwUxJBOm_OJWiaaD30YfKfjZZoLvcXlyM0.ttf',
  700: 'https://fonts.gstatic.com/s/bricolagegrotesque/v9/3y9U6as8bTXq_nANBjzKo3IeZx8z6up5BeSl5jBNz_19PpbpMXuECpwUxJBOm_OJWiaaD30YfKfjZZoLvfzlyM0.ttf',
} as const

const ALKATRA_600 =
  'https://fonts.gstatic.com/s/alkatra/v5/r05EGLZA5qhCYsyJbuChFuK48Medznj4vLcP.ttf'

export const fontFamilies = {
  body: 'Bricolage',
  display: 'Alkatra',
} as const

export function ensureReportFontsRegistered(): void {
  if (registered) return

  Font.register({
    family: fontFamilies.body,
    fonts: [
      { src: BRICOLAGE[400], fontWeight: 400 },
      { src: BRICOLAGE[600], fontWeight: 600 },
      { src: BRICOLAGE[700], fontWeight: 700 },
    ],
  })

  Font.register({
    family: fontFamilies.display,
    fonts: [{ src: ALKATRA_600, fontWeight: 600 }],
  })

  registered = true
}
