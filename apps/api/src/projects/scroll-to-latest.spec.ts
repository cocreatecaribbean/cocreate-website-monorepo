import {
  DEFAULT_NEAR_BOTTOM_THRESHOLD,
  hasItemsSignatureChanged,
  isNearBottom,
  itemsSignature,
  PIN_BOTTOM_MS,
  resolveShouldFollowScroll,
  computeScrollTopForAnchorEnd,
  scrollEndIntoView,
  shouldResetScrollOnScopeChange,
} from '@cocreate/app-ui/scroll-to-latest/scroll-to-latest-utils'

function mockScrollElement(options: {
  scrollHeight: number
  clientHeight: number
  scrollTop: number
}): HTMLElement {
  return {
    scrollHeight: options.scrollHeight,
    clientHeight: options.clientHeight,
    scrollTop: options.scrollTop,
  } as HTMLElement
}

describe('scroll-to-latest-utils', () => {
  describe('isNearBottom', () => {
    it('returns true when within the default threshold', () => {
      const element = mockScrollElement({
        scrollHeight: 1000,
        clientHeight: 400,
        scrollTop: 520,
      })
      expect(isNearBottom(element)).toBe(true)
    })

    it('returns false when scrolled well above the bottom', () => {
      const element = mockScrollElement({
        scrollHeight: 1000,
        clientHeight: 400,
        scrollTop: 100,
      })
      expect(isNearBottom(element)).toBe(false)
    })

    it('respects a custom threshold', () => {
      const element = mockScrollElement({
        scrollHeight: 500,
        clientHeight: 200,
        scrollTop: 150,
      })
      expect(isNearBottom(element, 100)).toBe(false)
      expect(isNearBottom(element, 160)).toBe(true)
    })
  })

  describe('itemsSignature', () => {
    it('joins item ids in order', () => {
      expect(itemsSignature([{ id: 'a' }, { id: 'b' }])).toBe('a|b')
    })
  })

  describe('hasItemsSignatureChanged', () => {
    it('is false on first render', () => {
      expect(hasItemsSignatureChanged('', 'a')).toBe(false)
    })

    it('is true when ids change after initial signature', () => {
      expect(hasItemsSignatureChanged('a', 'a|b')).toBe(true)
      expect(hasItemsSignatureChanged('a|b', 'a|b')).toBe(false)
    })
  })

  describe('shouldResetScrollOnScopeChange', () => {
    it('resets when scope key changes', () => {
      expect(shouldResetScrollOnScopeChange('thread-1', 'thread-2')).toBe(true)
    })

    it('does not reset when scope is undefined', () => {
      expect(shouldResetScrollOnScopeChange('thread-1', undefined)).toBe(false)
    })

    it('does not reset when scope is unchanged', () => {
      expect(shouldResetScrollOnScopeChange('thread-1', 'thread-1')).toBe(false)
    })
  })

  describe('resolveShouldFollowScroll', () => {
    const now = 1_000_000

    it('always follows in always mode', () => {
      expect(
        resolveShouldFollowScroll({
          scrollOn: 'always',
          nearBottom: false,
          pinBottomUntil: 0,
          now,
        }),
      ).toBe(true)
    })

    it('follows while pinned after user send', () => {
      expect(
        resolveShouldFollowScroll({
          scrollOn: 'pinned',
          nearBottom: false,
          pinBottomUntil: now + PIN_BOTTOM_MS,
          now,
        }),
      ).toBe(true)
    })

    it('does not follow new items when scrolled up and unpinned', () => {
      expect(
        resolveShouldFollowScroll({
          scrollOn: 'pinned',
          nearBottom: false,
          pinBottomUntil: now - 1,
          now,
        }),
      ).toBe(false)
    })

    it('follows new items near bottom in pinned mode', () => {
      expect(
        resolveShouldFollowScroll({
          scrollOn: 'pinned',
          nearBottom: true,
          pinBottomUntil: now - 1,
          now,
        }),
      ).toBe(true)
    })

    it('forces follow regardless of scroll position', () => {
      expect(
        resolveShouldFollowScroll({
          scrollOn: 'pinned',
          nearBottom: false,
          pinBottomUntil: 0,
          force: true,
          now,
        }),
      ).toBe(true)
    })
  })

  describe('computeScrollTopForAnchorEnd', () => {
    it('computes scroll position from anchor bottom within the container', () => {
      const container = {
        scrollTop: 50,
        scrollHeight: 1000,
        clientHeight: 400,
        getBoundingClientRect: () => ({
          top: 100,
          bottom: 500,
          left: 0,
          right: 0,
          width: 0,
          height: 400,
          x: 0,
          y: 100,
          toJSON: () => ({}),
        }),
      } as HTMLElement
      const anchor = {
        getBoundingClientRect: () => ({
          top: 520,
          bottom: 570,
          left: 0,
          right: 0,
          width: 0,
          height: 50,
          x: 0,
          y: 520,
          toJSON: () => ({}),
        }),
      } as HTMLElement

      expect(computeScrollTopForAnchorEnd(container, anchor)).toBe(120)
    })
  })

  describe('scrollEndIntoView', () => {
    it('scrolls only the container, not the anchor via scrollIntoView', () => {
      jest.useFakeTimers()
      const previousRaf = globalThis.requestAnimationFrame
      globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
        callback(0)
        return 1
      }) as typeof requestAnimationFrame

      const scrollIntoView = jest.fn()
      const scrollTo = jest.fn()
      const container = {
        scrollTop: 0,
        scrollHeight: 800,
        clientHeight: 400,
        scrollTo,
        getBoundingClientRect: () => ({
          top: 0,
          bottom: 400,
          left: 0,
          right: 0,
          width: 0,
          height: 400,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }),
      } as unknown as HTMLElement
      const anchor = {
        scrollIntoView,
        getBoundingClientRect: () => ({
          top: 500,
          bottom: 520,
          left: 0,
          right: 0,
          width: 0,
          height: 20,
          x: 0,
          y: 500,
          toJSON: () => ({}),
        }),
      } as unknown as HTMLElement

      scrollEndIntoView(container, anchor, 'smooth')
      jest.runAllTimers()

      expect(scrollIntoView).not.toHaveBeenCalled()
      expect(scrollTo).toHaveBeenCalledWith({ top: 120, behavior: 'smooth' })
      globalThis.requestAnimationFrame = previousRaf
      jest.useRealTimers()
    })

    it('falls back to container bottom when anchor is missing', () => {
      jest.useFakeTimers()
      const previousRaf = globalThis.requestAnimationFrame
      globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
        callback(0)
        return 1
      }) as typeof requestAnimationFrame

      const container = {
        scrollTop: 0,
        scrollHeight: 800,
        clientHeight: 400,
      } as HTMLElement

      scrollEndIntoView(container, null, 'auto')
      jest.runAllTimers()

      expect(container.scrollTop).toBe(400)
      globalThis.requestAnimationFrame = previousRaf
      jest.useRealTimers()
    })

    it('no-ops when container is missing', () => {
      expect(() => scrollEndIntoView(null, null)).not.toThrow()
    })
  })

  describe('pinned follow integration', () => {
    it('follows signature changes only when near bottom or pinned', () => {
      const prev = itemsSignature([{ id: 'm1' }])
      const next = itemsSignature([{ id: 'm1' }, { id: 'm2' }])
      expect(hasItemsSignatureChanged(prev, next)).toBe(true)

      const atBottom = mockScrollElement({
        scrollHeight: 800,
        clientHeight: 400,
        scrollTop: 400,
      })
      expect(isNearBottom(atBottom, DEFAULT_NEAR_BOTTOM_THRESHOLD)).toBe(true)

      const scrolledUp = mockScrollElement({
        scrollHeight: 800,
        clientHeight: 400,
        scrollTop: 0,
      })
      expect(isNearBottom(scrolledUp, DEFAULT_NEAR_BOTTOM_THRESHOLD)).toBe(false)
      expect(
        resolveShouldFollowScroll({
          scrollOn: 'pinned',
          nearBottom: isNearBottom(scrolledUp),
          pinBottomUntil: 0,
        }),
      ).toBe(false)
    })
  })
})
