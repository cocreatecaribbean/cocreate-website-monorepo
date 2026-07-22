import type { Metadata } from 'next'
import { QueryProvider } from '@cocreate/app-ui/query-provider'
import AdminShell from '@/components/admin-shell'
import { PresenceHeartbeat } from '@/components/presence-heartbeat'
import { AdminMessagingProvider } from '@/lib/messaging/admin-messaging-provider'
import { ThemeProvider } from '@/components/theme-provider'
import {
  alkatra600,
  bricolage_grot400,
  bricolage_grot500,
  bricolage_grot600,
  bricolage_grot700,
} from '@/styles/fonts'
import './globals.css'

export const metadata: Metadata = {
  title: 'CoCreate Admin Center',
  description: 'Internal dashboard for CoCreate Caribbean',
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
    <html lang="en" className={`${fontVariables} max-w-full overflow-x-clip`} suppressHydrationWarning>
      <body
        className={`${bricolage_grot400.className} max-w-full overflow-x-clip antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <ThemeProvider>
            <AdminMessagingProvider>
              <PresenceHeartbeat />
              <AdminShell>{children}</AdminShell>
            </AdminMessagingProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
