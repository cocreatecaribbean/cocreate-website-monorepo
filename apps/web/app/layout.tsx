import type { Metadata } from "next";
import { draftMode } from 'next/headers'
import { SanityVisualEditing } from '@/components/sanity-visual-editing'
import { SanityLive } from '@/lib/sanity/live'
//import { Gabarito, Geist, Geist_Mono } from "next/font/google";
//import { gabarito400, gabarito500, gabarito600, dm_sans, work_sans } from '../styles/fonts'
import "./globals.css";
import * as font from "@/styles/fonts";
import NavDesktop from "@/components/nav-desktop";
import Footer from "@/components/footer";
import ScrollSmoothWrapper from '@/components/scrollsmoother-wrapper'
import ScrollToTop from "@/components/scroll-to-top";
import LandscapeWarning from '@/components/landscapeWarning'
import NavMobile from "@/components/nav-mobile";
import PageTransition from "@/components/pageTransition";
import { QueryProvider } from "@/components/query-provider";
import { SearchProvider } from "@/components/search/search-provider";
import { ClientPortalProvider } from "@/components/client-portal/client-portal-provider";
import { CookieConsentProvider } from "@/components/cookie-consent/cookie-consent-provider";
import MarketingAssistant from "@/components/assistant/marketing-assistant";



// const gabaritoSans = Gabarito({
//   weight: ['400', '500', '600'],
//   subsets: ["latin"],
// });



export const metadata: Metadata = {
  title: "CoCreate Caribbean",
  description: "CoCreate web application",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  other: {
    "format-detection": "telephone=no, date=no, email=no, address=no",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // joh-style: keep Live/VE mounted whenever draft mode is on so Presentation
  // soft-nav / router.refresh() can still heartbeat. Page data stays gated on
  // getSanityPreviewContext() (embedded) so a leftover cookie alone is published-only.
  const { isEnabled: isDraftMode } = await draftMode()

  return (
    <html lang="en" className={`${font.bricolage_grot400.className} antialiased max-w-full overflow-x-hidden`}>
      <body
        
      >
        <script dangerouslySetInnerHTML={{
    __html: `history.scrollRestoration = "manual";`
  }} />
        <QueryProvider>
        <SearchProvider>
        <CookieConsentProvider>
        <ClientPortalProvider>
        <MarketingAssistant />
        <LandscapeWarning/>
        <ScrollSmoothWrapper>
          <PageTransition>
            {children}
          </PageTransition>
          <ScrollToTop/>
          <Footer/>
        </ScrollSmoothWrapper>
        <nav className="pointer-events-none relative z-[250] hidden h-0 w-full lg:block">
          <NavDesktop />
        </nav>
        <nav className="pointer-events-none relative z-[250] block h-0 w-full lg:hidden">
          <NavMobile />
        </nav>
        </ClientPortalProvider>
        </CookieConsentProvider>
        </SearchProvider>
        </QueryProvider>
        {isDraftMode && <SanityLive />}
        {isDraftMode && <SanityVisualEditing />}
        
      </body>
    </html> 
  );
}
