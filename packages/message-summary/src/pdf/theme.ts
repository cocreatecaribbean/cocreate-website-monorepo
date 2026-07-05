import { StyleSheet } from '@react-pdf/renderer'

export const colors = {
  chambray: '#2c4a7c',
  sanmarino: '#406eb5',
  casablanca: '#f5b84c',
  slate600: '#475569',
  slate500: '#64748b',
  slate200: '#e2e8f0',
  white: '#ffffff',
  pageBg: '#f8fafc',
} as const

export const pdfTheme = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: colors.chambray,
    backgroundColor: colors.pageBg,
  },
  coverPage: {
    paddingTop: 72,
    paddingBottom: 56,
    paddingHorizontal: 48,
    backgroundColor: colors.chambray,
    color: colors.white,
    fontFamily: 'Helvetica',
  },
  coverEyebrow: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.casablanca,
    marginBottom: 12,
  },
  coverTitle: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 11,
    color: '#dbeafe',
    marginBottom: 24,
  },
  coverMeta: {
    fontSize: 9,
    color: '#cbd5e1',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.sanmarino,
    marginBottom: 8,
    marginTop: 16,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.5,
    color: colors.slate600,
    marginBottom: 6,
  },
  bodyLead: {
    fontSize: 11,
    lineHeight: 1.6,
    color: colors.slate600,
    marginBottom: 8,
  },
  bullet: {
    fontSize: 10,
    lineHeight: 1.45,
    color: colors.slate600,
    marginBottom: 4,
    paddingLeft: 8,
  },
  visualCard: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
  },
  visualImage: {
    maxHeight: 200,
    objectFit: 'contain',
    marginBottom: 8,
  },
  visualMeta: {
    fontSize: 9,
    color: colors.sanmarino,
    marginBottom: 4,
  },
  visualBody: {
    fontSize: 10,
    lineHeight: 1.45,
    color: colors.slate600,
    marginBottom: 4,
  },
  visualCaption: {
    fontSize: 9,
    lineHeight: 1.4,
    color: colors.slate500,
    fontStyle: 'italic',
  },
  fileRow: {
    fontSize: 10,
    lineHeight: 1.45,
    color: colors.slate600,
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    fontSize: 8,
    color: colors.slate500,
    borderTopWidth: 1,
    borderTopColor: colors.slate200,
    paddingTop: 8,
  },
})
