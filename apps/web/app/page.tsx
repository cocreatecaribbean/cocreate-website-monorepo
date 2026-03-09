import HomeHeroSection from "@/components/homeHeroSection";
import LogoTickerWrapper from "@/components/logoTickerWrapper";

export default function Home() {
  return (
    <main>
      {/* This client component handles all refs, effects, 
          and GSAP animations which require a browser environment.
      */}
      <HomeHeroSection />

      {/* This server component reads the file system 
          and passes the data into the ticker.
      */}
      <section className="mb-60 border-t-[1.5] border-b-[1.5] border-black/10">
        <LogoTickerWrapper />
      </section>
    </main>
  );
}