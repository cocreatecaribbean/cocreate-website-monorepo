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
import MuxBackgroundVideo from "@/components/media/mux-background-video";
import WhatWeDoAccordions from "@/components/what-we-do-accordions";
import EmblaCarousel from "@/components/emblaCarousel";
import { philosophies } from "@/site-info/home-page-data";
import { EmblaOptionsType } from "embla-carousel";
import { splitTextGradient } from "@/utils/util-funcs";
import { consumeSpaNavigation } from "@/lib/scroll/navigation";
import { prefersNativeScroll } from "@/lib/scroll/native-scroll";
import {
  DEFAULT_AGENCY_INTRO,
  DEFAULT_HERO_REEL_FALLBACK_SRC,
} from "@/site-info/landing-page-defaults";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const OPTIONS: EmblaOptionsType = { loop: true, align: "start" };
const FRAME_COUNT = 185;
const IMG_WIDTH = 1920;
const IMG_HEIGHT = 1080;
const FILE_PATH = (index: number) =>
  `/cocreate-graphic-anim/cocreate-home-graphic_${index}.webp`

const FRAME_ASPECT = IMG_WIDTH / IMG_HEIGHT

const INITIAL_PRELOAD_FRAMES = 28
const INITIAL_PRELOAD_FRAMES_NATIVE = 56
const IDLE_BATCH_SIZE = 16
const MOBILE_BREAKPOINT = 768

function scheduleIdle(cb: () => void) {
  if (typeof window === "undefined") return
  const ric = window.requestIdleCallback
  if (ric) {
    ric(() => cb(), { timeout: 120 })
  } else {
    window.setTimeout(cb, 32)
  }
}

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

/** True when restore would leave the hero mid/past the intro (not a near-top refresh). */
function isDeepReloadRestore(): boolean {
  const y = getReloadScrollY();
  if (y == null) return false;
  return y > Math.min(window.innerHeight * 0.35, 280);
}

/** px — must match Tailwind translate-y on brand_elem; mobile uses a higher (smaller y) start */
function getBrandStartY(): number {
  if (typeof window === "undefined") return 160;
  if (window.matchMedia("(max-width: 767px) and (orientation: landscape)").matches) {
    return 40;
  }
  if (window.matchMedia("(max-width: 767px)").matches) {
    return 64;
  }
  if (window.matchMedia("(min-width: 1536px)").matches) {
    return 288;
  }
  return 160;
}

function progressToFrameIndex(progress: number) {
  const frame = progress * 1.75;
  const val = Math.round(frame * (FRAME_COUNT - 1)) + 1;
  return Math.min(Math.max(val, 1), FRAME_COUNT);
}

export default function HomeHeroSection({
  heroReelPlaybackId = null,
  fallbackVideoSrc = DEFAULT_HERO_REEL_FALLBACK_SRC,
  agencyIntro = DEFAULT_AGENCY_INTRO,
}: {
  heroReelPlaybackId?: string | null
  fallbackVideoSrc?: string
  agencyIntro?: string
}) {
  const mainRef = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const brand_elem = useRef<HTMLDivElement>(null);
  const hero_text = useRef<HTMLDivElement>(null);
  const vid_container = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const lastRenderedFrameRef = useRef(0);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastPrefetchCenterRef = useRef(0);
  const heroScrollingRef = useRef(false);
  const idlePumpRef = useRef<(() => void) | null>(null);

  const [emblaApi, setEmblaApi] = useState<EmblaCarouselType | null>(null)

  /** Size backing store like object-cover — 16:9, never stretch to viewport aspect */
  const fitCanvasForDisplay = (canvas: HTMLCanvasElement) => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;

    const cap = prefersNativeScroll() ? 1.25 : 2;
    const dpr = Math.min(window.devicePixelRatio || 1, cap);
    const containerAspect = w / h;

    let bw: number;
    let bh: number;
    if (containerAspect > FRAME_ASPECT) {
      bw = Math.round(w * dpr);
      bh = Math.round((w / FRAME_ASPECT) * dpr);
    } else {
      bh = Math.round(h * dpr);
      bw = Math.round(h * FRAME_ASPECT * dpr);
    }

    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
      canvasCtxRef.current = null;
    }
  };

  const ensureImage = (index: number) => {
    if (index < 1 || index > FRAME_COUNT) return;
    if (imagesRef.current[index]) return;
    const img = new window.Image();
    img.src = FILE_PATH(index);
    imagesRef.current[index] = img;
  };

  const prefetchAroundFrame = (center: number) => {
    if (center === lastPrefetchCenterRef.current) return;
    lastPrefetchCenterRef.current = center;
    for (let i = center - 2; i <= center + 8; i++) {
      if (i >= 1 && i <= FRAME_COUNT) ensureImage(i);
    }
  };

  const renderFrame = (index: number) => {
    if (index === lastRenderedFrameRef.current) return;

    const canvas = canvasRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !img) return;

    if (!img.complete) {
      ensureImage(index);
      img.addEventListener("load", () => renderFrame(index), { once: true });
      return;
    }

    fitCanvasForDisplay(canvas);

    if (!canvasCtxRef.current) {
      canvasCtxRef.current = canvas.getContext("2d", {
        alpha: true,
        desynchronized: prefersNativeScroll(),
      });
    }
    const ctx = canvasCtxRef.current;
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    lastRenderedFrameRef.current = index;
  };

  // Batched preload — avoids 185 simultaneous decodes on cold load
  useEffect(() => {
    ScrollTrigger.config({ ignoreMobileResize: true });
    let cancelled = false;

    const initialCount = prefersNativeScroll()
      ? INITIAL_PRELOAD_FRAMES_NATIVE
      : INITIAL_PRELOAD_FRAMES;

    ensureImage(1);
    const first = imagesRef.current[1];
    if (first) {
      first.onload = () => {
        if (cancelled || getReloadScrollY() != null) return;
        renderFrame(1);
      };
    }

    for (let i = 2; i <= initialCount; i++) {
      ensureImage(i);
    }

    let next = initialCount + 1;
    const pump = () => {
      if (cancelled || next > FRAME_COUNT) return;
      if (heroScrollingRef.current) {
        scheduleIdle(pump);
        return;
      }
      const end = Math.min(next + IDLE_BATCH_SIZE - 1, FRAME_COUNT);
      for (let i = next; i <= end; i++) {
        ensureImage(i);
      }
      next = end + 1;
      if (next <= FRAME_COUNT) scheduleIdle(pump);
    };
    idlePumpRef.current = pump;
    scheduleIdle(pump);

    return () => {
      cancelled = true;
      idlePumpRef.current = null;
    };
  }, []);

  // ─── Main Animations ─────────────────────────────────────────────────────────

  useGSAP(
    () => {
      const enteredViaSpa = consumeSpaNavigation();

      let h1_text_split: SplitText | null = null;
      let about_text_split: SplitText | null = null;
      let headlineTween: gsap.core.Tween | null = null;

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
      const breakpoint = MOBILE_BREAKPOINT;
      const nativeScroll = prefersNativeScroll();

      /** Float animation fights pin scrub on native touch scroll — desktop only */
      const setBrandFloatActive = (active: boolean) => {
        if (nativeScroll) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.classList.toggle("animate-float", active);
      };

      if (!nativeScroll) {
        setBrandFloatActive(true);
      } else {
        canvasRef.current?.classList.remove("animate-float");
      }

      let heroScrollEndTimer: ReturnType<typeof setTimeout> | undefined;
      const markHeroScrolling = () => {
        heroScrollingRef.current = true;
        if (heroScrollEndTimer) clearTimeout(heroScrollEndTimer);
        heroScrollEndTimer = setTimeout(() => {
          heroScrollingRef.current = false;
          if (idlePumpRef.current) scheduleIdle(idlePumpRef.current);
        }, 200);
      };

      const waitForSmoothContentReady = () =>
        new Promise<void>((resolve) => {
          const check = () => {
            const content = document.getElementById("smooth-content");
            const opacity = content
              ? (gsap.getProperty(content, "opacity") as number)
              : 1;
            if (opacity >= 0.99) {
              resolve();
              return;
            }
            requestAnimationFrame(check);
          };
          check();
        });

      const runAfterLayoutReady = async (fn: () => void) => {
        if (document.fonts?.ready) {
          await document.fonts.ready.catch(() => undefined);
        }
        await waitForSmoothContentReady();
        fn();
      };

      // ─── SplitText ─────────────────────────────────────────────────────────

      h1_text_split = new SplitText(".headline-text", { type: "words" });
      about_text_split = new SplitText(".about-text", {
        type: "words",
        linesClass: "overflow-hidden",
      });

      splitTextGradient(h1_text_split);

      // ─── Intro Animation ────────────────────────────────────────────────────

      headlineTween = gsap.from(h1_text_split.words, {
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
        .fromTo(
          brand_elem.current,
          { y: getBrandStartY() },
          { y: 0, duration: 3 },
        )
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

      let pendingFrame: number | null = null;
      let rafScheduled = false;

      const flushPendingFrame = () => {
        rafScheduled = false;
        if (pendingFrame == null) return;
        const index = pendingFrame;
        pendingFrame = null;
        renderFrame(index);
      };

      const scheduleFrameFromProgress = (progress: number, coalesce: boolean) => {
        const safeIndex = progressToFrameIndex(progress);
        if (!coalesce || safeIndex !== lastRenderedFrameRef.current) {
          prefetchAroundFrame(safeIndex);
        }
        if (!coalesce) {
          pendingFrame = null;
          rafScheduled = false;
          renderFrame(safeIndex);
          return;
        }
        pendingFrame = safeIndex;
        if (rafScheduled) return;
        rafScheduled = true;
        requestAnimationFrame(flushPendingFrame);
      };

      const syncHeroFrameFromScroll = () => {
        const st = ScrollTrigger.getById("home-hero-pin");
        if (!st) return;
        scheduleFrameFromProgress(st.progress, false);
      };

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
            // Fixed pin to viewport works on native document scroll; transform
            // pairs with ScrollSmoother on desktop.
            pinType: isMobile && nativeScroll ? "fixed" : "transform",
            anticipatePin: isMobile && nativeScroll ? 0 : 1,
            fastScrollEnd: !(isMobile && nativeScroll),
            invalidateOnRefresh: isMobile && nativeScroll,
            onLeaveBack: () => setBrandFloatActive(true),
            onUpdate: (self) => {
              if (isMobile && nativeScroll) markHeroScrolling();
              setBrandFloatActive(self.progress < 0.02);
              scheduleFrameFromProgress(self.progress, isMobile);
            },
          });

          let vvTimer: ReturnType<typeof setTimeout> | undefined;
          let onViewportResize: (() => void) | undefined;
          if (isMobile && nativeScroll) {
            onViewportResize = () => {
              if (vvTimer) clearTimeout(vvTimer);
              vvTimer = setTimeout(() => ScrollTrigger.refresh(true), 120);
            };
            window.visualViewport?.addEventListener("resize", onViewportResize);
          }

          ScrollTrigger.create({
            id: "home-what-we-do",
            animation: whatWeDoTimeline,
            trigger: ".what-we-do",
            start: isMobile ? "top 170%" : "top 150%",
            end: isMobile ? "top 70%" : "top 40%",
            scrub: true,
          });

          const resetHeroToScrollStart = () => {
            gsap.set(vid_container.current, { scale: 0 });
            gsap.set(hero_text.current, { opacity: 1 });
            gsap.set(brand_elem.current, { y: getBrandStartY() });
            mainTimeline.progress(0);
            pendingFrame = null;
            rafScheduled = false;
            lastRenderedFrameRef.current = 0;
            lastPrefetchCenterRef.current = 0;

            const st = ScrollTrigger.getById("home-hero-pin");
            if (st) {
              st.scroll(0);
              st.animation?.progress(0);
            }

            renderFrame(1);
            setBrandFloatActive(true);
          };

          if (enteredViaSpa) {
            resetHeroToScrollStart();
            requestAnimationFrame(() => {
              ScrollTrigger.refresh();
              resetHeroToScrollStart();
            });
          }

          return () => {
            if (vvTimer) clearTimeout(vvTimer);
            if (onViewportResize) {
              window.visualViewport?.removeEventListener(
                "resize",
                onViewportResize,
              );
            }
          };
        },
      );

      const revealMain = () => {
        gsap.to(mainRef.current, { autoAlpha: 1, duration: 0.2 });
      };

      if (isDeepReloadRestore()) {
        gsap.set(container.current, { visibility: "hidden" });
        void runAfterLayoutReady(() => {
          ScrollTrigger.refresh(true);
          syncHeroFrameFromScroll();
          gsap.set(container.current, { visibility: "visible" });
          revealMain();
        });
      } else {
        revealMain();
      }

      }, mainRef);

      return () => {
        headlineTween?.kill();
        headlineTween = null;
        if (h1_text_split) gsap.killTweensOf(h1_text_split.words);
        if (about_text_split) gsap.killTweensOf(about_text_split.words);
        h1_text_split?.revert();
        about_text_split?.revert();
        h1_text_split = null;
        about_text_split = null;
        ctx.revert();
      };
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
            col-span-1 col-start-1 row-span-1 row-start-1 text-center
            ${fonts.bricolage_grot800.className}
          `}
        >
          <div ref={hero_text} className="headline-text">
            Transforming Caribbean <span className={`${fonts.alkatra600.className}`}>Creativity</span> into Global Impact.
          </div>
        </h1>

        <div
          ref={brand_elem}
          className="w-screen h-screen mx-auto z-10 col-span-1 col-start-1 row-span-1 row-start-1"
        >
          <canvas
            ref={canvasRef}
            width={IMG_WIDTH}
            height={IMG_HEIGHT}
            className="w-full h-full object-cover md:will-change-transform md:animate-float"
          />
        </div>

        <div
          ref={vid_container}
          className="w-screen h-full col-span-1 col-start-1 row-span-1 row-start-1 self-start scale-0 overflow-hidden will-change-transform"
        >
          {heroReelPlaybackId ? (
            <MuxBackgroundVideo playbackId={heroReelPlaybackId} />
          ) : (
            <BackgroundVideo src={fallbackVideoSrc} />
          )}
        </div>
      </section>

      <section className="bg-white">
        <div className="w-screen">
          <p
            key={agencyIntro}
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
            {agencyIntro}
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

      <section className="@container mb-20 flex w-svw flex-col gap-20 md:mb-20 lg:flex-row lg:mb-28 xl:mb-36">
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
