import { ref, onMounted, onUnmounted, type Ref, getCurrentInstance } from 'vue'

/**
 * 無限スクロール機能を提供するcomposable
 *
 * @param callback - スクロールが閾値に達したときに実行されるコールバック関数
 * @param options - オプション設定
 * @returns - スクロール監視用のref、有効化/無効化関数、ローディング状態
 */
export function useInfiniteScroll(
  callback: () => Promise<void> | void,
  options: {
    threshold?: number // スクロール位置の閾値（px）
    initialLoadingState?: boolean // 初期ローディング状態
    enabled?: Ref<boolean> // 無限スクロールの有効/無効を制御
  } = {}
) {
  const {
    threshold = 200, // デフォルト: 下端から200px
    enabled = ref(true),
    initialLoadingState = false,
  } = options

  const isLoading = ref(initialLoadingState)
  const targetRef = ref<HTMLElement | null>(null)
  let scrollHandler: (() => void) | null = null

  const handleLoad = async () => {
    isLoading.value = true
    try {
      await callback()
    } finally {
      isLoading.value = false
    }
  }

  /**
   * スクロールイベントハンドラ
   */
  const handleScroll = async () => {
    // 無効化されている場合は何もしない
    if (!enabled.value) {
      return
    }

    // 既にローディング中の場合は何もしない
    if (isLoading.value) {
      return
    }

    // targetRefが設定されていない場合はwindowのスクロール位置を使用
    const target = targetRef.value || window
    const scrollTop =
      target === window
        ? window.scrollY || window.pageYOffset
        : (target as HTMLElement).scrollTop
    const scrollHeight =
      target === window
        ? document.documentElement.scrollHeight
        : (target as HTMLElement).scrollHeight
    const clientHeight =
      target === window
        ? window.innerHeight
        : (target as HTMLElement).clientHeight

    // 下端までの距離を計算
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)

    // 閾値に達したらコールバックを実行
    if (distanceFromBottom < threshold) {
      handleLoad()
    }
  }

  scrollHandler = handleScroll

  /**
   * スクロール監視を開始
   */
  const enable = () => {
    enabled.value = true
  }

  /**
   * スクロール監視を停止
   */
  const disable = () => {
    enabled.value = false
  }

  /**
   * 手動でスクロールリスナーを開始
   */
  const startListening = () => {
    if (scrollHandler) {
      const target = targetRef.value || window
      target.addEventListener('scroll', scrollHandler)
    }
  }

  /**
   * 手動でスクロールリスナーを停止
   */
  const stopListening = () => {
    if (scrollHandler) {
      const target = targetRef.value || window
      target.removeEventListener('scroll', scrollHandler)
    }
  }

  // コンポーネントインスタンスが存在する場合のみライフサイクルフックを使用
  const instance = getCurrentInstance()
  if (instance) {
    /**
     * マウント時にスクロールイベントリスナーを登録
     */
    onMounted(() => {
      startListening()
    })

    /**
     * アンマウント時にスクロールイベントリスナーを解除
     */
    onUnmounted(() => {
      stopListening()
    })
  }

  return {
    targetRef,
    isLoading,
    enable,
    disable,
    startListening,
    stopListening,
    handleLoad,
  }
}
