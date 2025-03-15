export const BREAK_POINTS = {
  DESKTOP: 'desktop',
  MOBILE: 'mobile',
} as const

export const VALID_BREAK_POINTS = Object.values(BREAK_POINTS)
export type BreakPoint = (typeof BREAK_POINTS)[keyof typeof BREAK_POINTS]

export function useScreenBreakPoint() {
  const breakPoint = ref<BreakPoint>(BREAK_POINTS.MOBILE)
  const windowSize = ref({
    width: 0,
    height: 0,
  })

  function handleResize() {
    windowSize.value = {
      width: window.innerWidth,
      height: window.innerHeight,
    }
    console.log('handleResize', windowSize.value)
    breakPoint.value = calcBreakPoint(windowSize.value.width)
  }

  function calcBreakPoint(width: number) {
    if (width <= 640) {
      return BREAK_POINTS.MOBILE
    }

    return BREAK_POINTS.DESKTOP
  }

  function isMobile() {
    return breakPoint.value === BREAK_POINTS.MOBILE
  }

  function isDesktop() {
    return breakPoint.value === BREAK_POINTS.DESKTOP
  }

  onMounted(() => {
    window.addEventListener('resize', handleResize)
    handleResize()
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })

  return {
    breakPoint,
    windowSize,

    isMobile,
    isDesktop,
  }
}
