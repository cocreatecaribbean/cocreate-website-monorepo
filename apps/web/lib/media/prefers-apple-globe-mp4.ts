/**
 * Apple WebKit (iOS, iPadOS, desktop Safari) does not reliably render VP9
 * WebM alpha — use the white-composited H.264 MP4 globe instead.
 *
 * softedge variant feathers the sphere perimeter into white so Safari doesn’t
 * show the source encode’s dark anti-aliased rim (jittery on retina).
 */
export function prefersAppleGlobeMp4(): boolean {
  if (typeof navigator === 'undefined') return false

  const ua = navigator.userAgent

  if (/iPhone|iPad|iPod/.test(ua)) return true
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
    return true
  }

  const isAppleDesktop = /Macintosh|Mac OS X/.test(ua)
  const isWebKit = /AppleWebKit/.test(ua)
  const isNonSafari = /Chrome|Chromium|CriOS|FxiOS|Firefox|Edg\//.test(ua)

  return isAppleDesktop && isWebKit && !isNonSafari
}

export const APPLE_GLOBE_MP4_SRC =
  '/videos/cocreate-globe-loop_seamless-h264-white-softedge.mp4' as const

export const GLOBE_WEBM_SRC = '/videos/cocreate-globe-loop_seamless.webm' as const
