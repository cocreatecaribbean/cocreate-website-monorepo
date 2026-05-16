import HomeHeroSection from "@/components/homeHeroSection";
import LogoTickerWrapper from "@/components/logoTickerWrapper";
import ArcGallerySection from "@/components/arc-gallery-section";
import BentoGallery from "@/components/bento-gallery";

export default function Home() {
  return (
    <main className="overflow-x-clip">
      {/* This client component handles all refs, effects, 
          and GSAP animations which require a browser environment.
      */}
      <HomeHeroSection />

      {/* This server component reads the file system 
          and passes the data into the ticker.
      */}
      <section className="border-t-[1.5] border-b-[1.5] border-black/10 pb-4 md:pb-6">
        <LogoTickerWrapper />
      </section>

      {/* <BentoGallery /> */}

      <ArcGallerySection />
    </main>
  );
}