import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CoCreate Client Portal',
  description: 'Client workspace for CoCreate Caribbean',
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
