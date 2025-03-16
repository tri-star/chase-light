export const BREAK_POINTS = {
  DESKTOP: 'desktop',
  MOBILE: 'mobile',
} as const

export const VALID_BREAK_POINTS = Object.values(BREAK_POINTS)
export type BreakPoint = (typeof BREAK_POINTS)[keyof typeof BREAK_POINTS]

export const useScreenBreakPointStore = defineStore(
  'ScreenBreakPointStore',
  () => {
    const breakPoint = ref<BreakPoint>(BREAK_POINTS.MOBILE)
    const windowSize = ref({
      width: 0,
      height: 0,
    })

    const isBreakPointInitialized = computed(() => {
      return breakPoint.value !== undefined
    })

    const isMobile = computed(() => {
      return breakPoint.value === BREAK_POINTS.MOBILE
    })
    const isDesktop = computed(() => breakPoint.value === BREAK_POINTS.DESKTOP)

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

    onMounted(() => {
      window.addEventListener('resize', handleResize)
      handleResize()
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })

    return {
      isBreakPointInitialized,
      breakPoint,
      windowSize,

      isMobile,
      isDesktop,
    }
  },
)
