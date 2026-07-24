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
import PhilosophyTitleLoop from "@/components/philosophy-title-loop";
import EmblaCarousel from "@/components/emblaCarousel";
import { philosophies } from "@/site-info/home-page-data";
import { EmblaOptionsType } from "embla-carousel";
import { applySharedTextGradient, splitTextGradient } from "@/utils/util-funcs";
import { consumeSpaNavigation } from "@/lib/scroll/navigation";
import { prefersNativeScroll } from "@/lib/scroll/native-scroll";
import { resetRouteScrollToTop } from "@/lib/scroll/reset-route-scroll";
import {
  DEFAULT_AGENCY_INTRO,
  DEFAULT_HERO_REEL_FALLBACK_SRC,
} from "@/site-info/landing-page-defaults";
import {
  HERO_SEQUENCES as SEQUENCES,
  type HeroSequenceKey as SequenceKey,
} from "@/lib/home-hero-sequence";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const OPTIONS: EmblaOptionsType = { loop: true, align: "start" };

/** Tailwind `xl` — full-frame cover for landscape sequence at this width and up */
const BRAND_COVER_MIN_WIDTH = 1280
/**
 * Centered fraction of each 16:9 landscape frame that holds the mark (padding outside).
 * Used below xl on landscape viewports — cover-like size, no shape crop.
 */
const BRAND_CONTENT_W = 0.5
const BRAND_CONTENT_H = 0.78

const MOBILE_BREAKPOINT = 768
/** Default in-flight frame loads (good / unknown connection). */
const LOAD_CONCURRENCY_DEFAULT = 6
/** Constrained links (Save-Data / 2g): fewer parallel downloads. */
const LOAD_CONCURRENCY_SLOW = 3
const PREFETCH_BEHIND = 2
const PREFETCH_AHEAD_DEFAULT = 10
const PREFETCH_AHEAD_SLOW = 6
/** Low-priority background fill batch size when the playhead window is healthy. */
const FILL_BATCH_SIZE = 8

type LoaderTuning = {
  maxConcurrent: number
  prefetchBehind: number
  prefetchAhead: number
}

type NetworkConnection = {
  saveData?: boolean
  effectiveType?: string
}

function getLoaderTuning(): LoaderTuning {
  if (typeof navigator === "undefined") {
    return {
      maxConcurrent: LOAD_CONCURRENCY_DEFAULT,
      prefetchBehind: PREFETCH_BEHIND,
      prefetchAhead: PREFETCH_AHEAD_DEFAULT,
    }
  }
  const c = (navigator as Navigator & { connection?: NetworkConnection }).connection
  const constrained =
    !!c?.saveData ||
    c?.effectiveType === "slow-2g" ||
    c?.effectiveType === "2g"
  return {
    maxConcurrent: constrained ? LOAD_CONCURRENCY_SLOW : LOAD_CONCURRENCY_DEFAULT,
    prefetchBehind: PREFETCH_BEHIND,
    prefetchAhead: constrained ? PREFETCH_AHEAD_SLOW : PREFETCH_AHEAD_DEFAULT,
  }
}

function getSequenceKey(): SequenceKey {
  if (typeof window === "undefined") return "landscape"
  return window.innerHeight > window.innerWidth ? "portrait" : "landscape"
}

function usesBrandCoverFit() {
  return typeof window !== "undefined" && window.innerWidth >= BRAND_COVER_MIN_WIDTH
}

function scheduleIdle(cb: () => void) {
  if (typeof window === "undefined") return
  const ric = window.requestIdleCallback
  if (ric) {
    ric(() => cb(), { timeout: 120 })
  } else {
    window.setTimeout(cb, 32)
  }
}

function isImageReady(img?: HTMLImageElement) {
  return !!img && img.complete && img.naturalWidth > 0
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

/** Intro Y offset (px) — fluid with viewport height; short/landscape uses a lower band */
function getBrandStartY(): number {
  if (typeof window === "undefined") return 160;
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const landscape = window.matchMedia("(orientation: landscape)").matches;

  if (landscape && vw < 1024) {
    return Math.min(72, Math.max(32, vh * 0.08));
  }

  const min = vw < 768 ? 48 : 88;
  const max = vw < 768 ? 88 : 80;
  const ratio = vw < 768 ? 0.1 : 0.12;
  return Math.min(max, Math.max(min, vh * ratio));
}

function progressToFrameIndex(progress: number, frameCount: number) {
  const frame = progress * 1.75;
  const val = Math.round(frame * (frameCount - 1)) + 1;
  return Math.min(Math.max(val, 1), frameCount);
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
  const hero_subhead = useRef<HTMLParagraphElement>(null);
  const vid_container = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<Record<SequenceKey, HTMLImageElement[]>>({
    landscape: [],
    portrait: [],
  });
  const sequenceKeyRef = useRef<SequenceKey>(getSequenceKey());
  const lastRenderedFrameRef = useRef(0);
  const lastRenderedSequenceRef = useRef<SequenceKey | null>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastPrefetchCenterRef = useRef(0);
  const wantedFrameRef = useRef(1);
  const heroScrollingRef = useRef(false);
  const fillPumpRef = useRef<(() => void) | null>(null);
  const preloadCancelledRef = useRef(false);
  const brandCanvasRevealedRef = useRef(false);
  const loaderTuningRef = useRef<LoaderTuning>(getLoaderTuning());
  const loadInFlightRef = useRef(0);
  const loadQueueRef = useRef<{ key: SequenceKey; index: number; priority: number }[]>(
    [],
  );
  const loadQueuedIdsRef = useRef(new Set<string>());
  const fillNextRef = useRef<Record<SequenceKey, number>>({
    landscape: 1,
    portrait: 1,
  });

  const [emblaApi, setEmblaApi] = useState<EmblaCarouselType | null>(null)
  const [brandCanvasVisible, setBrandCanvasVisible] = useState(false)

  const isHeroSurfaceVisible = () => {
    const main = mainRef.current
    if (!main) return false
    if (parseFloat(getComputedStyle(main).opacity) < 0.99) return false
    // Desktop ScrollSmoother starts #smooth-content hidden — fading while it's
    // still at 0 means the transition finishes before anything is on screen.
    const smooth = document.getElementById("smooth-content")
    if (smooth) {
      const smoothOpacity = parseFloat(getComputedStyle(smooth).opacity)
      if (Number.isFinite(smoothOpacity) && smoothOpacity < 0.5) return false
    }
    return true
  }

  const revealBrandCanvas = () => {
    if (brandCanvasRevealedRef.current) return
    brandCanvasRevealedRef.current = true

    if (prefersReducedMotion()) {
      setBrandCanvasVisible(true)
      return
    }

    const startFade = () => {
      // Paint one frame at opacity 0 after the surface is visible, then fade.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setBrandCanvasVisible(true)
        })
      })
    }

    const startedAt = performance.now()
    const waitForSurface = () => {
      if (isHeroSurfaceVisible() || performance.now() - startedAt > 1200) {
        startFade()
        return
      }
      requestAnimationFrame(waitForSurface)
    }
    waitForSurface()
  }

  /** Match canvas backing store to the CSS box (drawImage handles fit). */
  const fitCanvasForDisplay = (canvas: HTMLCanvasElement) => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return false;

    const cap = prefersNativeScroll() ? 1.25 : 2;
    const dpr = Math.min(window.devicePixelRatio || 1, cap);
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);

    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
      canvasCtxRef.current = null;
      return true;
    }
    return false;
  };

  const loadId = (key: SequenceKey, index: number) => `${key}:${index}`

  const findNearestReadyFrame = (wanted: number, key: SequenceKey): number | null => {
    const frames = imagesRef.current[key]
    const frameCount = SEQUENCES[key].frameCount
    if (isImageReady(frames[wanted])) return wanted
    for (let d = 1; d < frameCount; d++) {
      const hi = wanted + d
      const lo = wanted - d
      // Prefer slightly ahead on ties so scrub feels progressive.
      if (hi <= frameCount && isImageReady(frames[hi])) return hi
      if (lo >= 1 && isImageReady(frames[lo])) return lo
    }
    return null
  }

  const playheadWindowHealthy = (center: number, key: SequenceKey) => {
    const frameCount = SEQUENCES[key].frameCount
    const behind = loaderTuningRef.current.prefetchBehind
    const ahead = Math.min(4, loaderTuningRef.current.prefetchAhead)
    for (let i = center - behind; i <= center + ahead; i++) {
      if (i < 1 || i > frameCount) continue
      if (!imagesRef.current[key][i]) return false
    }
    return true
  }

  const pumpLoader = () => {
    if (preloadCancelledRef.current) return
    const max = loaderTuningRef.current.maxConcurrent
    const queue = loadQueueRef.current

    while (loadInFlightRef.current < max && queue.length > 0) {
      queue.sort((a, b) => a.priority - b.priority)
      const next = queue.shift()
      if (!next) break
      const id = loadId(next.key, next.index)
      loadQueuedIdsRef.current.delete(id)

      if (imagesRef.current[next.key][next.index]) continue

      loadInFlightRef.current += 1
      const img = new window.Image()
      imagesRef.current[next.key][next.index] = img

      const finish = () => {
        loadInFlightRef.current = Math.max(0, loadInFlightRef.current - 1)
        if (preloadCancelledRef.current) return
        if (next.key === sequenceKeyRef.current) {
          const nearest = findNearestReadyFrame(wantedFrameRef.current, next.key)
          if (nearest != null) paintFrame(nearest)
        }
        pumpLoader()
        if (fillPumpRef.current) scheduleIdle(fillPumpRef.current)
      }

      img.addEventListener("load", finish, { once: true })
      img.addEventListener("error", finish, { once: true })
      img.src = SEQUENCES[next.key].path(next.index)
    }
  }

  /** Enqueue a frame load. Lower `priority` = sooner. No-ops if already started. */
  const enqueueFrame = (
    index: number,
    key: SequenceKey = sequenceKeyRef.current,
    priority = 100,
  ) => {
    const sequence = SEQUENCES[key]
    if (index < 1 || index > sequence.frameCount) return
    if (imagesRef.current[key][index]) return

    const id = loadId(key, index)
    if (loadQueuedIdsRef.current.has(id)) {
      const item = loadQueueRef.current.find(
        (q) => q.key === key && q.index === index,
      )
      if (item && priority < item.priority) item.priority = priority
      return
    }

    loadQueuedIdsRef.current.add(id)
    loadQueueRef.current.push({ key, index, priority })
    pumpLoader()
  }

  /** Kick a frame request at high priority (scroll / paint path). */
  const ensureImage = (index: number, key: SequenceKey = sequenceKeyRef.current) => {
    enqueueFrame(index, key, 0)
  }

  const prioritizeAroundFrame = (center: number) => {
    const key = sequenceKeyRef.current
    const frameCount = SEQUENCES[key].frameCount
    const { prefetchBehind, prefetchAhead } = loaderTuningRef.current
    lastPrefetchCenterRef.current = center

    for (let i = center - prefetchBehind; i <= center + prefetchAhead; i++) {
      if (i < 1 || i > frameCount) continue
      // Ahead of playhead slightly preferred over equal distance behind.
      const distance = Math.abs(i - center)
      const aheadBias = i >= center ? 0 : 0.5
      enqueueFrame(i, key, distance + aheadBias)
    }
  }

  const prefetchAroundFrame = (center: number) => {
    if (center === lastPrefetchCenterRef.current) {
      // Still nudge the exact frame in case queue priorities went stale.
      ensureImage(center)
      return
    }
    prioritizeAroundFrame(center)
  }

  const paintFrame = (index: number) => {
    const key = sequenceKeyRef.current
    const sequence = SEQUENCES[key]
    const canvas = canvasRef.current
    const img = imagesRef.current[key][index]
    if (!canvas || !isImageReady(img)) return

    const resized = fitCanvasForDisplay(canvas)
    const sameFrame =
      !resized &&
      index === lastRenderedFrameRef.current &&
      lastRenderedSequenceRef.current === key
    if (sameFrame) return

    if (!canvasCtxRef.current) {
      canvasCtxRef.current = canvas.getContext("2d", {
        alpha: true,
        desynchronized: prefersNativeScroll(),
      })
    }
    const ctx = canvasCtxRef.current
    if (!ctx || !img) return

    const cw = canvas.width
    const ch = canvas.height
    const { width: imgW, height: imgH } = sequence
    ctx.clearRect(0, 0, cw, ch)

    if (key === "portrait" || usesBrandCoverFit()) {
      // Portrait 9:16 frames are authored for tall screens; landscape xl+ uses cover.
      const scale = Math.max(cw / imgW, ch / imgH)
      const dw = imgW * scale
      const dh = imgH * scale
      ctx.drawImage(
        img,
        0,
        0,
        imgW,
        imgH,
        (cw - dw) / 2,
        (ch - dh) / 2,
        dw,
        dh,
      )
    } else {
      // Landscape below xl: zoom to the mark (skip empty padding), contain so shapes aren’t clipped
      const sw = imgW * BRAND_CONTENT_W
      const sh = imgH * BRAND_CONTENT_H
      const sx = (imgW - sw) / 2
      const sy = (imgH - sh) / 2
      const scale = Math.min(cw / sw, ch / sh)
      const dw = sw * scale
      const dh = sh * scale
      ctx.drawImage(
        img,
        sx,
        sy,
        sw,
        sh,
        (cw - dw) / 2,
        (ch - dh) / 2,
        dw,
        dh,
      )
    }

    lastRenderedFrameRef.current = index
    lastRenderedSequenceRef.current = key
    revealBrandCanvas()
  }

  const renderFrame = (wanted: number) => {
    const key = sequenceKeyRef.current
    wantedFrameRef.current = wanted
    enqueueFrame(wanted, key, 0)

    const nearest = findNearestReadyFrame(wanted, key)
    if (nearest == null) return
    paintFrame(nearest)
  }

  const startPreloadForSequence = (
    key: SequenceKey,
    cancelled: () => boolean,
    { autoRenderFirst = false }: { autoRenderFirst?: boolean } = {},
  ) => {
    loaderTuningRef.current = getLoaderTuning()
    fillNextRef.current[key] = 1

    const startPriorityAndFill = () => {
      if (cancelled()) return

      prioritizeAroundFrame(
        key === sequenceKeyRef.current ? wantedFrameRef.current || 1 : 1,
      )

      const fill = () => {
        if (cancelled()) return
        const activeKey = sequenceKeyRef.current
        const activeCount = SEQUENCES[activeKey].frameCount
        const playhead =
          activeKey === key ? wantedFrameRef.current || 1 : 1

        if (heroScrollingRef.current) {
          scheduleIdle(fill)
          return
        }

        if (!playheadWindowHealthy(playhead, activeKey)) {
          prioritizeAroundFrame(playhead)
          scheduleIdle(fill)
          return
        }

        let next = fillNextRef.current[activeKey]
        let enqueued = 0
        while (next <= activeCount && enqueued < FILL_BATCH_SIZE) {
          if (!imagesRef.current[activeKey][next]) {
            // Background fill — far below playhead priorities.
            enqueueFrame(next, activeKey, 500 + next)
            enqueued += 1
          }
          next += 1
        }
        fillNextRef.current[activeKey] = next
        if (next <= activeCount) scheduleIdle(fill)
      }

      fillPumpRef.current = fill
      scheduleIdle(fill)
    }

    // Load frame 1 alone first so the burst cannot contend for bandwidth.
    enqueueFrame(1, key, 0)
    const waitForFirst = () => {
      if (cancelled()) return
      const first = imagesRef.current[key][1]
      if (isImageReady(first)) {
        if (
          autoRenderFirst &&
          key === sequenceKeyRef.current &&
          getReloadScrollY() == null
        ) {
          wantedFrameRef.current = 1
          paintFrame(1)
        }
        startPriorityAndFill()
        return
      }
      if (first) {
        first.addEventListener(
          "load",
          () => {
            if (cancelled()) return
            if (
              autoRenderFirst &&
              key === sequenceKeyRef.current &&
              getReloadScrollY() == null
            ) {
              wantedFrameRef.current = 1
              paintFrame(1)
            }
            startPriorityAndFill()
          },
          { once: true },
        )
        first.addEventListener("error", startPriorityAndFill, { once: true })
        return
      }
      // Not queued yet — try again after pump.
      scheduleIdle(waitForFirst)
    }
    waitForFirst()
  }

  // Priority preload — concurrency-capped, playhead-first
  useEffect(() => {
    ScrollTrigger.config({ ignoreMobileResize: true });
    preloadCancelledRef.current = false;
    loaderTuningRef.current = getLoaderTuning();
    sequenceKeyRef.current = getSequenceKey();
    startPreloadForSequence(
      sequenceKeyRef.current,
      () => preloadCancelledRef.current,
      { autoRenderFirst: true },
    );

    return () => {
      preloadCancelledRef.current = true;
      fillPumpRef.current = null;
      loadQueueRef.current = [];
      loadQueuedIdsRef.current.clear();
    };
  }, []);

  // ─── Main Animations ─────────────────────────────────────────────────────────

  useGSAP(
    () => {
      const enteredViaSpa = consumeSpaNavigation();

      let h1_text_split: SplitText | null = null;
      let about_text_split: SplitText | null = null;
      let introTimeline: gsap.core.Timeline | null = null;
      let headlineFitTimer: ReturnType<typeof setTimeout> | undefined;
      let onHeadlineResize: (() => void) | undefined;
      let brandYResizeTimer: ReturnType<typeof setTimeout> | undefined;
      let onBrandYResize: (() => void) | undefined;

      const revealMain = () => {
        const el = mainRef.current;
        if (!el) return;
        // Do NOT use gsap.set here — useGSAP/context.revert() restores autoAlpha:0 and
        // leaves the home hero blank after SPA remounts (contact → home).
        el.classList.remove("opacity-0");
        el.style.opacity = "1";
        el.style.visibility = "visible";
      };

      // Reveal ASAP so a later setup failure / deep-restore wait can't leave a blank home.
      revealMain();

      // Kill inherited scroll from the previous route before any home ScrollTriggers.
      if (enteredViaSpa) {
        resetRouteScrollToTop();
      }

      const ctx = gsap.context(() => {
      if (prefersReducedMotion()) {
        const canvas = canvasRef.current;
        if (canvas) canvas.classList.remove("animate-float");

        revealMain();
        gsap.set(container.current, { visibility: "visible" });
        gsap.set(brand_elem.current, { translateY: 0 });
        gsap.set(hero_text.current, { opacity: 1 });
        gsap.set(hero_subhead.current, { opacity: 1 });
        gsap.set(vid_container.current, { scale: 0 });
        gsap.set(".headline-text", { opacity: 1 });
        gsap.set(".about-text", { opacity: 1 });
        gsap.set(".what-we-do", { scale: 1 });
        gsap.set(".accordion-item", { opacity: 1, xPercent: 0 });

        const key = sequenceKeyRef.current;
        wantedFrameRef.current = 1;
        ensureImage(1, key);
        renderFrame(1);

        return;
      }

      const mm = gsap.matchMedia();
      const breakpoint = MOBILE_BREAKPOINT;
      const nativeScroll = prefersNativeScroll();

      /** Float only when idle near pin start — pause while scrubbing (incl. native touch) */
      const setBrandFloatActive = (active: boolean) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.classList.toggle("animate-float", active);
      };

      setBrandFloatActive(true);

      let heroScrollEndTimer: ReturnType<typeof setTimeout> | undefined;
      const markHeroScrolling = () => {
        heroScrollingRef.current = true;
        if (heroScrollEndTimer) clearTimeout(heroScrollEndTimer);
        heroScrollEndTimer = setTimeout(() => {
          heroScrollingRef.current = false;
          if (fillPumpRef.current) scheduleIdle(fillPumpRef.current);
        }, 200);
      };

      const waitForSmoothContentReady = () =>
        new Promise<void>((resolve) => {
          const started = performance.now();
          const check = () => {
            const content = document.getElementById("smooth-content");
            const opacity = content
              ? Number(gsap.getProperty(content, "opacity"))
              : 1;
            // Never hang forever — SPA / smoother races can leave opacity mid-fade.
            if (
              !Number.isFinite(opacity) ||
              opacity >= 0.99 ||
              performance.now() - started > 2000
            ) {
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

      const repaintAboutGradient = about_text_split.words?.length
        ? applySharedTextGradient(about_text_split)
        : null;

      const fitHeroHeadline = () => {
        const box = hero_text.current?.parentElement
        const words = h1_text_split?.words
        if (!box || !words?.length) return

        // Prefer the authored clamp — only shrink when a word overflows the box.
        box.style.fontSize = ""
        const available = box.clientWidth
        if (available <= 0) return

        let widest = 0
        for (const word of words) {
          widest = Math.max(widest, (word as HTMLElement).getBoundingClientRect().width)
        }
        if (widest <= available + 0.5) return

        const current = parseFloat(getComputedStyle(box).fontSize)
        if (!Number.isFinite(current) || current <= 0) return
        box.style.fontSize = `${(current * available) / widest}px`
      }

      fitHeroHeadline()
      void document.fonts?.ready.then(() => {
        fitHeroHeadline()
        repaintAboutGradient?.()
      })

      onHeadlineResize = () => {
        if (headlineFitTimer) clearTimeout(headlineFitTimer)
        headlineFitTimer = setTimeout(() => {
          fitHeroHeadline()
          repaintAboutGradient?.()
        }, 100)
      }
      window.addEventListener("resize", onHeadlineResize)

      // ─── Intro Animation ────────────────────────────────────────────────────

      // SPA remounts (e.g. contact → home): skip the from() entrance — ScrollTrigger
      // refresh can leave SplitText words stuck at opacity 0 mid-tween.
      if (enteredViaSpa) {
        gsap.set(h1_text_split.words, { opacity: 1, y: 0 });
        gsap.set(hero_subhead.current, { opacity: 1 });
      } else {
        gsap.set(hero_subhead.current, { opacity: 0 });
        introTimeline = gsap.timeline();
        introTimeline
          .from(h1_text_split.words, {
            y: -100,
            opacity: 0,
            duration: 1.5,
            ease: "back.out",
            stagger: 0.07,
          })
          .to(
            hero_subhead.current,
            {
              opacity: 1,
              duration: 1,
              ease: "power2.out",
            },
            "-=1.1",
          );
      }

      // ─── Timelines ──────────────────────────────────────────────────────────

      const mainTimeline = gsap.timeline();
      mainTimeline
        .fromTo(
          brand_elem.current,
          { y: () => getBrandStartY() },
          { y: 0, duration: 3 },
        )
        .to(
          [hero_text.current, hero_subhead.current],
          { opacity: 0, duration: 1 },
          "-=0.5",
        )
        .to(vid_container.current, { scale: 1, duration: 1 })
        .to({}, { duration: 1 });

      const syncBrandStartY = () => {
        const st = ScrollTrigger.getById("home-hero-pin");
        if (!st || st.progress >= 0.02) return;
        mainTimeline.invalidate();
        gsap.set(brand_elem.current, { y: getBrandStartY() });
        mainTimeline.progress(st.progress);
      };

      onBrandYResize = () => {
        if (brandYResizeTimer) clearTimeout(brandYResizeTimer);
        brandYResizeTimer = setTimeout(() => {
          syncBrandStartY();
          const nextKey = getSequenceKey();
          const st = ScrollTrigger.getById("home-hero-pin");

          if (nextKey !== sequenceKeyRef.current) {
            sequenceKeyRef.current = nextKey;
            lastPrefetchCenterRef.current = 0;
            lastRenderedFrameRef.current = 0;
            lastRenderedSequenceRef.current = null;
            startPreloadForSequence(nextKey, () => preloadCancelledRef.current);

            const frame = st
              ? progressToFrameIndex(st.progress, SEQUENCES[nextKey].frameCount)
              : 1;
            ensureImage(frame, nextKey);
            prefetchAroundFrame(frame);
            renderFrame(frame);
            return;
          }

          const frameCount = SEQUENCES[sequenceKeyRef.current].frameCount;
          const frame = st
            ? progressToFrameIndex(st.progress, frameCount)
            : Math.min(Math.max(lastRenderedFrameRef.current || 1, 1), frameCount);
          lastRenderedFrameRef.current = 0;
          lastRenderedSequenceRef.current = null;
          renderFrame(frame);
        }, 100);
      };
      window.addEventListener("resize", onBrandYResize);
      window.addEventListener("orientationchange", onBrandYResize);

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
        const frameCount = SEQUENCES[sequenceKeyRef.current].frameCount;
        const safeIndex = progressToFrameIndex(progress, frameCount);
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
            invalidateOnRefresh: true,
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

          // About / What We Do: mobile scrub windows tuned for on-screen play without lagging entry.
          if (about_text_split?.words?.length) {
            gsap.from(about_text_split.words, {
              y: 40,
              opacity: 0,
              duration: 1,
              stagger: isMobile ? 0.08 : 0.2,
              ease: "power2.out",
              scrollTrigger: {
                id: "home-about-text",
                trigger: ".about-text",
                start: isMobile ? "top 92%" : "top 85%",
                end: isMobile ? "top 35%" : "top 10%",
                scrub: isMobile ? 1.25 : 1,
              },
            });
          }

          ScrollTrigger.create({
            id: "home-what-we-do",
            animation: whatWeDoTimeline,
            trigger: ".what-we-do",
            start: isMobile ? "top 140%" : "top 175%",
            end: isMobile ? "top 78%" : "top 65%",
            scrub: true,
          });

          const resetHeroToScrollStart = () => {
            resetRouteScrollToTop();
            gsap.set(vid_container.current, { scale: 0 });
            gsap.set(hero_text.current, { opacity: 1 });
            gsap.set(hero_subhead.current, { opacity: 1 });
            gsap.set(brand_elem.current, { y: getBrandStartY() });
            mainTimeline.progress(0);
            pendingFrame = null;
            rafScheduled = false;
            lastRenderedFrameRef.current = 0;
            lastRenderedSequenceRef.current = null;
            lastPrefetchCenterRef.current = 0;
            sequenceKeyRef.current = getSequenceKey();
            ensureImage(1);

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
              resetRouteScrollToTop();
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

      // Stale lastScrollY + SPA (e.g. contact → home) must not use the deep-reload
      // hide/wait path — that left the hero blank until smoother opacity settled.
      if (isDeepReloadRestore() && !enteredViaSpa) {
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
        if (headlineFitTimer) clearTimeout(headlineFitTimer);
        if (onHeadlineResize) {
          window.removeEventListener("resize", onHeadlineResize);
        }
        if (brandYResizeTimer) clearTimeout(brandYResizeTimer);
        if (onBrandYResize) {
          window.removeEventListener("resize", onBrandYResize);
          window.removeEventListener("orientationchange", onBrandYResize);
        }
        introTimeline?.kill();
        introTimeline = null;
        if (h1_text_split) gsap.killTweensOf(h1_text_split.words);
        if (hero_subhead.current) gsap.killTweensOf(hero_subhead.current);
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

      const revealSlides = () => {
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
      }

      ScrollTrigger.create({
        trigger: '.embla',
        start: 'top 90%',
        onEnter: revealSlides,
        onEnterBack: revealSlides,
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
        className="grid grid-cols-1 grid-rows-1 h-svh w-full max-w-full justify-start content-start items-start"
      >
        <h1
          className={`
            text-[clamp(3rem,5vw,7rem)] md:text-[clamp(4rem,5vw,7rem)]
            leading-none uppercase w-[calc(100%-1.5rem)] sm:w-[65%] md:w-[70%] lg:w-[70%] 2xl:w-[65%] 3xl:w-[60%]
            mx-auto pt-60 landscape:pt-20 landscape:lg:pt-48 landscape:xl:pt-72 landscape:2xl:pt-90
            col-span-1 col-start-1 row-span-1 row-start-1 text-center overflow-visible
            ${fonts.bricolage_grot800.className}
          `}
        >
          <span ref={hero_text} className="headline-text block">
          Every brand <br /> has a <span className={`${fonts.alkatra600.className}`}>story <br /> worth telling</span>.
          </span>

          <p
            ref={hero_subhead}
            className={`
          ${fonts.bricolage_grot600.className}
          normal-case
          bg-linear-to-r from-sanmarino to-chambray bg-clip-text text-transparent
          mt-4 min-[1024px]:mt-6
          mb-8 min-[1024px]:mb-10
          text-center leading-snug
          text-[clamp(1.1rem,2vw,1.5rem)]
        `}
          >
            We make sure yours is Memorable.
          </p>
        </h1>

        <div
          ref={brand_elem}
          className="z-10 col-span-1 col-start-1 row-span-1 row-start-1 mx-auto h-screen w-full max-w-full overflow-hidden"
        >
          <canvas
            ref={canvasRef}
            width={SEQUENCES.landscape.width}
            height={SEQUENCES.landscape.height}
            className={`h-full w-full will-change-transform transition-opacity duration-700 ease-out motion-reduce:transition-none ${
              brandCanvasVisible ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        <div
          ref={vid_container}
          className="col-span-1 col-start-1 row-span-1 row-start-1 h-full w-full max-w-full scale-0 self-start overflow-hidden will-change-transform"
        >
          {heroReelPlaybackId ? (
            <MuxBackgroundVideo playbackId={heroReelPlaybackId} />
          ) : (
            <BackgroundVideo src={fallbackVideoSrc} />
          )}
        </div>
      </section>

      <section className="bg-white">
        <div className="w-full max-w-full">
          <p
            key={agencyIntro}
            className={`about-text text-gradient-chambray-diagonal
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

      <section className="@container mb-20 flex w-full max-w-full flex-col gap-20 md:mb-20 lg:flex-row lg:mb-28 xl:mb-36">
        <div className={`@container tracking-normal w-full max-w-[min(100%,24rem)] px-4 sm:max-w-none sm:w-[60%] sm:px-0 lg:w-[45%] mx-auto flex-1 2xl:translate-y-20 3xl:translate-y-40 ${fonts.bricolage_grot500.className}`}>
          <div className="flex flex-col gap-y-10 w-full lg:w-[75cqw] xl:w-[70cqw] 3xl:w-[55cqw] mx-auto min-w-0">
            <PhilosophyTitleLoop />
            <p className="philosophy-text text-gradient-chambray-diagonal text-center lg:text-left text-[clamp(1rem,1vw,1.5rem)] ">
            The best advertising starts with understanding people.
What motivates them, what they value, what they ignore - what earns their attention!
Before we create anything, we work to understand the people we're trying to reach. We measure success by how well we understand the challenge. The extra time spent at the beginning usually leads to stronger work in the end.

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
