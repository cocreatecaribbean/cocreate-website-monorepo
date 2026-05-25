import type { Metadata } from 'next'
import {
  alkatra600,
  bricolage_grot400,
  bricolage_grot500,
  bricolage_grot600,
  bricolage_grot700,
} from '@/styles/fonts'
import './globals.css'

export const metadata: Metadata = {
  title: 'CoCreate Client Portal',
  description: 'Client workspace for CoCreate Caribbean',
}

const fontVariables = [
  bricolage_grot400.variable,
  bricolage_grot500.variable,
  bricolage_grot600.variable,
  bricolage_grot700.variable,
  alkatra600.variable,
].join(' ')

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <body className={`${bricolage_grot400.className} antialiased`}>{children}</body>
    </html>
  )
}
