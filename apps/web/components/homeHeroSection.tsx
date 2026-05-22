'use client'

import { useRef, useEffect, useState } from "react";
import { EmblaCarouselType } from "embla-carousel";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";
import * as fonts from "@/styles/fonts";
import BackgroundVideo from "@/components/background_video";
import WhatWeDoAccordions from "@/components/what-we-do-accordions";
import EmblaCarousel from "@/components/emblaCarousel";
import { philosophies } from "@/site-info/home-page-data";
import { EmblaOptionsType } from "embla-carousel";
import { splitTextGradient } from "@/utils/util-funcs";
import { consumeSpaNavigation } from "@/lib/scroll/navigation";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const OPTIONS: EmblaOptionsType = { loop: true, align: "start" };
const FRAME_COUNT = 185;
const IMG_WIDTH = 1920;
const IMG_HEIGHT = 1080;
const FILE_PATH = (index: number) =>
  `/cocreate-graphic-anim/cocreate-home-graphic_${index}.webp`;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Scroll position saved on reload by ScrollSmoothWrapper */
function getReloadScrollY(): number | null {
  if (typeof window === "undefined") return null;
  if (sessionStorage.getItem("lastPath") !== window.location.pathname) return null;
  const savedY = sessionStorage.getItem("lastScrollY");
  if (!savedY) return null;
  const y = parseFloat(savedY);
  return Number.isFinite(y) ? y : null;
}

export default function HomeHeroSection() {
  const mainRef = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const brand_elem = useRef<HTMLDivElement>(null);
  const hero_text = useRef<HTMLDivElement>(null);
  const vid_container = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  const [emblaApi, setEmblaApi] = useState<EmblaCarouselType | null>(null)

  // 1. Image Preloading Logic
  useEffect(() => {
    ScrollTrigger.config({ ignoreMobileResize: true });

    const preloadImages = () => {
      for (let i = 1; i <= FRAME_COUNT; i++) {
        const img = new window.Image();
        img.src = FILE_PATH(i);
        if (i === 1) {
          img.onload = () => {
            if (getReloadScrollY() == null) renderFrame(1);
          };
        }
        imagesRef.current[i] = img;
      }
    };

    preloadImages();
  }, []);

  // 2. Optimized Render Function
  const renderFrame = (index: number) => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  };

  // ─── Main Animations ─────────────────────────────────────────────────────────

  useGSAP(
    () => {
      const enteredViaSpa = consumeSpaNavigation();

      const ctx = gsap.context(() => {
      if (prefersReducedMotion()) {
        const canvas = canvasRef.current;
        if (canvas) canvas.classList.remove("animate-float");

        gsap.set(mainRef.current, { autoAlpha: 1 });
        gsap.set(container.current, { visibility: "visible" });
        gsap.set(brand_elem.current, { translateY: 0 });
        gsap.set(hero_text.current, { opacity: 1 });
        gsap.set(vid_container.current, { scale: 0 });
        gsap.set(".headline-text", { opacity: 1 });
        gsap.set(".about-text", { opacity: 1 });
        gsap.set(".what-we-do", { scale: 1 });
        gsap.set(".accordion-item", { opacity: 1, xPercent: 0 });

        const first = imagesRef.current[1];
        if (first?.complete) renderFrame(1);
        else if (first) first.onload = () => renderFrame(1);

        return;
      }

      const mm = gsap.matchMedia();
      const breakpoint = 768;

      /** Bounce lives on the canvas — only disable once pin scrub actually starts */
      const setBrandFloatActive = (active: boolean) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.classList.toggle("animate-float", active);
      };

      setBrandFloatActive(true);

      // ─── Split Text ─────────────────────────────────────────────────────────

      const h1_text_split = new SplitText(".headline-text", { type: "words" });
      const about_text_split = new SplitText(".about-text", {
        type: "words",
        linesClass: "overflow-hidden",
      });

      splitTextGradient(h1_text_split);

      // ─── Intro Animation ────────────────────────────────────────────────────

      gsap.from(h1_text_split.words, {
        y: -100,
        opacity: 0,
        duration: 1.5,
        ease: "back.out",
        stagger: 0.07,
      });

      // ─── About Text Scrub ───────────────────────────────────────────────────

      gsap.from(about_text_split.words, {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".about-text",
          start: "top 85%",
          end: "top 10%",
          scrub: 1,
        },
      });

      // ─── Timelines ──────────────────────────────────────────────────────────

      const mainTimeline = gsap.timeline();
      mainTimeline
        .to(brand_elem.current, { translateY: 0, duration: 3 })
        .to(hero_text.current, { opacity: 0, duration: 1 }, "-=0.5")
        .to(vid_container.current, { scale: 1, duration: 1 })
        .to({}, { duration: 1 });

      const whatWeDoTimeline = gsap.timeline();
      whatWeDoTimeline
        .to(".what-we-do", { scale: 1 })
        .from(
          ".accordion-item",
          {
            xPercent: -30,
            opacity: 0,
            stagger: 0.05,
            ease: CustomEase.create('custom', "M0,0 C0,0 0.061,-0.021 0.18,0.055 0.388,0.189 0.645,0.87 0.847,0.976 0.892,1 1,1 1,1")
          },
          "<0.3",
        );

      // ─── ScrollTriggers ─────────────────────────────────────────────────────

      mm.add(
        {
          isDesktop: `(min-width: ${breakpoint}px)`,
          isMobile: `(max-width: ${breakpoint - 1}px)`,
        },
        (context) => {
          const { isDesktop, isMobile } = context.conditions as {
            isDesktop: boolean;
            isMobile: boolean;
          };
          const element = container.current;
          if (!element) return;

          ScrollTrigger.create({
            id: "home-hero-pin",
            trigger: element,
            start: "top top",
            end: isDesktop ? "+=400%" : "+=200%",
            animation: mainTimeline,
            scrub: isMobile ? 0.4 : true,
            pin: true,
            pinSpacing: true,
            pinType: "transform",
            anticipatePin: 1,
            fastScrollEnd: true,
            invalidateOnRefresh: !isMobile,
            onLeaveBack: () => setBrandFloatActive(true),
            onUpdate: (self) => {
              setBrandFloatActive(self.progress < 0.02);
              const frame = self.progress * 1.75;
              const val = Math.round(frame * (FRAME_COUNT - 1)) + 1;
              const safeIndex = Math.min(Math.max(val, 1), FRAME_COUNT);
              renderFrame(safeIndex);
            },
          });

          ScrollTrigger.create({
            id: "home-what-we-do",
            animation: whatWeDoTimeline,
            trigger: ".what-we-do",
            start: isMobile ? "top 170%" : "top 150%",
            end: isMobile ? "top 70%" : "top 40%",
            scrub: true,
          });

          if (enteredViaSpa) {
            gsap.set(vid_container.current, { scale: 0 });
            gsap.set(hero_text.current, { opacity: 1 });
            gsap.set(brand_elem.current, { clearProps: "transform" });

            const st = ScrollTrigger.getById("home-hero-pin");
            if (st?.animation) {
              st.animation.progress(0);
            }

            requestAnimationFrame(() => {
              ScrollTrigger.refresh();
              renderFrame(1);
              setBrandFloatActive(true);
            });
          }
        },
      );

      const revealMain = () => {
        gsap.to(mainRef.current, { autoAlpha: 1, duration: 0.2 });
      };

      const syncHeroFrameFromScroll = () => {
        const st = ScrollTrigger.getById("home-hero-pin");
        if (!st) return;
        const frame = st.progress * 1.75;
        const val = Math.round(frame * (FRAME_COUNT - 1)) + 1;
        const safeIndex = Math.min(Math.max(val, 1), FRAME_COUNT);
        renderFrame(safeIndex);
      };

      if (getReloadScrollY() != null) {
        gsap.set(container.current, { visibility: "hidden" });
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            ScrollTrigger.refresh();
            syncHeroFrameFromScroll();
            gsap.set(container.current, { visibility: "visible" });
            revealMain();
          });
        });
      } else {
        revealMain();
      }

      }, mainRef);

      return () => ctx.revert();
    },
    { scope: mainRef }
  );

  // ─── Carousel Animation ───────────────────────────────────────────────────────

  useGSAP(
    () => {
      if (!emblaApi) return

      const slides = gsap.utils.toArray<HTMLElement>('.embla__slide__gsap')

      if (prefersReducedMotion()) {
        gsap.set(slides, { opacity: 1 })
        return
      }

      gsap.set(slides, { opacity: 0 })

      ScrollTrigger.create({
        trigger: '.embla',
        start: 'top 90%',
        onEnter: () => {
          const selectedIndex = emblaApi.selectedScrollSnap()
          const count = slides.length
          const orderedIndices = Array.from({ length: count }, (_, i) => (selectedIndex + i) % count)

          gsap.to(
            orderedIndices.map((i) => slides[i]),
            {
              opacity: 1,
              duration: 0.8,
              stagger: 0.08,
              ease: CustomEase.create('custom', 'M0,0 C0,0 0.061,-0.021 0.18,0.055 0.388,0.189 0.645,0.87 0.847,0.976 0.892,1 1,1 1,1'),
            }
          )
        },
        onLeaveBack: () => {
          gsap.to(slides, {
            opacity: 0,
            duration: 0.3,
            stagger: 0.05,
          })
        }
      })
    },
    { scope: mainRef, dependencies: [emblaApi] }
  )

  return (
    <div ref={mainRef} className="opacity-0">
      <section
        ref={container}
        className="grid grid-cols-1 grid-rows-1 w-svw h-svh justify-start content-start items-start overflow-hidden"
      >
        <h1
          className={`
            text-[clamp(3rem,5vw,7rem)] md:text-[clamp(4rem,5vw,7rem)]
            leading-none uppercase w-[90%] sm:w-[65%] md:w-[70%] lg:w-[70%] 2xl:w-[65%] 3xl:w-[60%]
            mx-auto pt-60 landscape:pt-20 landscape:lg:pt-48 landscape:xl:pt-72 landscape:2xl:pt-90 overflow-hidden
            col-span-1 col-start-1 row-span-1 row-start-1 text-center bg-clip-text
            bg-linear-to-r from-blue-900 to-yellow-600 text-transparent
            ${fonts.bricolage_grot800.className}
          `}
        >
          <div ref={hero_text} className="headline-text">
            Transforming Caribbean <span className={`${fonts.alkatra600.className}`}>Creativity</span> into Global Impact.
          </div>
        </h1>

        <div
          ref={brand_elem}
          className="w-screen h-screen mx-auto z-10 col-span-1 col-start-1 row-span-1 row-start-1 translate-y-40 2xl:translate-y-72"
        >
          <canvas
            ref={canvasRef}
            width={IMG_WIDTH}
            height={IMG_HEIGHT}
            className="w-full h-full object-cover will-change-transform animate-float"
          />
        </div>

        <div
          ref={vid_container}
          className="w-screen h-full col-span-1 col-start-1 row-span-1 row-start-1 self-start scale-0 overflow-hidden will-change-transform"
        >
          <BackgroundVideo src="/videos/cocreate-2026-reel-web-v1.mp4" />
        </div>
      </section>

      <section className="bg-white">
        <div className="w-screen">
          <p
            className={`about-text
              text-[clamp(2.3rem,4vw,4rem)]
              xl:text-[clamp(2rem,4vw,6rem)]
              3xl:text-[clamp(2rem,5vw,6rem)]
              leading-normal
              pl-4 pr-6 pt-20 pb-32
              md:pl-20 md:pr-48
              xl:pb-72 xl:pl-32 xl:pr-72
              2xl:pl-32 2xl:pr-96
              3xl:pl-72 3xl:pr-96
              3xl:pt-48 3xl:pb-80
              ${fonts.bricolage_grot400.className}`}
          >
            We are a collective of independent creative professionals, flipping
            the traditional agency model to deliver transformational creativity.
          </p>
        </div>
      </section>

      <section className="what-we-do w-[95svw] bg-chambray scale-0 mb-20 lg:mb-60 rounded-4xl 2xl:rounded-[4rem] mx-auto">
        <div className="relative pl-0 pt-20 pb-20 xl:pt-30 xl:pb-48 md:pl-20 xl:pl-32 3xl:pl-72 w-full xl:w-[80svw] 3xl:w-[70svw]">
          <h2 className={`${fonts.bricolage_grot500.className} text-casablanca text-[clamp(2rem,2vw,3rem)] mb-4 xl:mb-12 w-fit mx-auto lg:mx-0`}>
            What We Do
          </h2>
          <WhatWeDoAccordions />
        </div>
      </section>

      <section className="@container w-svw flex gap-20 flex-col lg:flex-row mb-40 xl:mb-60">
        <div className={`@container tracking-normal w-[60%] lg:w-[45%] mx-auto flex-1 2xl:translate-y-20 3xl:translate-y-40 ${fonts.bricolage_grot500.className}`}>
          <div className="flex flex-col gap-y-10 w-[80cqw] lg:w-[75cqw] xl:w-[70cqw] 3xl:w-[55cqw] mx-auto">
            <h2 className="philosophy-header h-fit leading-none text-center lg:text-left text-[clamp(2rem,3vw,4rem)] ">
              Our<br />Philosophy
            </h2>
            <p className="philosophy-text text-center lg:text-left text-[clamp(1rem,1vw,1.5rem)] ">
            We focus on four(4) key pillars to consistently deliver superior results for our clients. Having a proven framework gives us the freedom to inject new creative breadth with fresh perspectives into every project.
            </p>
          </div>
        </div>
        <EmblaCarousel
          slides={philosophies}
          options={OPTIONS}
          onInit={setEmblaApi}
          className_embla={`flex flex-col flex-[1.5] 2xl:flex-1 justify-end gap-y-8`}
        />
      </section>
    </div>
  );
}