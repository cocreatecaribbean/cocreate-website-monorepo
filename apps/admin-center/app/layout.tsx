import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CoCreate Admin Center',
  description: 'Internal dashboard for CoCreate Caribbean',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
