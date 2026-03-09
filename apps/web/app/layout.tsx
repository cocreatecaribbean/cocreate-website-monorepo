import type { Metadata } from "next";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${font.bricolage_grot400.className} antialiased max-w-full overflow-x-hidden`}>
      <body
        
      >
        <LandscapeWarning/>
        {/* <ScrollToTop/> */}
        <nav className="hidden md:block relative w-full h-0 z-100">
          <NavDesktop/>
        </nav>
        <nav className="block md:hidden relative w-full h-0 z-100">
          <NavMobile/>
        </nav>
        <ScrollSmoothWrapper>
          <PageTransition>
            {children}
          </PageTransition>
          <Footer/>
        </ScrollSmoothWrapper>
        
      </body>
    </html> 
  );
}
