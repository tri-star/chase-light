import { describe, test, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { useInfiniteScroll } from '../use-infinite-scroll'

describe('useInfiniteScroll', () => {
  beforeEach(() => {
    // window.scrollYをモック
    vi.stubGlobal('scrollY', 0)
    vi.stubGlobal('pageYOffset', 0)
    vi.stubGlobal('innerHeight', 800)

    // document.documentElement.scrollHeightをモック
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 2000,
    })
  })

  test('初期状態が正しく設定される', () => {
    const callback = vi.fn()
    const { isLoading, targetRef } = useInfiniteScroll(callback)

    expect(isLoading.value).toBe(false)
    expect(targetRef.value).toBeNull()
  })

  test('スクロール閾値に達したときにコールバックが呼ばれる', async () => {
    const callback = vi.fn()
    const { isLoading, startListening, stopListening } = useInfiniteScroll(
      callback,
      { threshold: 200 }
    )

    // 手動でリスニングを開始
    startListening()

    // スクロール位置を閾値に達するように設定
    // scrollHeight = 2000, clientHeight = 800, threshold = 200
    // distanceFromBottom < 200 となるには scrollTop > 1000 が必要
    vi.stubGlobal('scrollY', 1100)

    // スクロールイベントを発火
    const scrollEvent = new Event('scroll')
    window.dispatchEvent(scrollEvent)

    // コールバックが実行されるまで待つ
    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledTimes(1)
    })

    expect(isLoading.value).toBe(false)

    // クリーンアップ
    stopListening()
  })

  test('ローディング中はコールバックが複数回呼ばれない', async () => {
    let resolveCallback: (() => void) | undefined
    const callback = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveCallback = resolve
        })
    )

    const { isLoading, startListening, stopListening } = useInfiniteScroll(
      callback,
      { threshold: 200 }
    )

    // 手動でリスニングを開始
    startListening()

    // スクロール位置を閾値に達するように設定
    vi.stubGlobal('scrollY', 1100)

    // 1回目のスクロールイベント
    const scrollEvent1 = new Event('scroll')
    window.dispatchEvent(scrollEvent1)

    await vi.waitFor(() => {
      expect(isLoading.value).toBe(true)
    })

    // ローディング中に2回目のスクロールイベント
    const scrollEvent2 = new Event('scroll')
    window.dispatchEvent(scrollEvent2)

    // コールバックは1回のみ呼ばれる
    expect(callback).toHaveBeenCalledTimes(1)

    // コールバック完了
    if (resolveCallback) {
      resolveCallback()
    }

    await vi.waitFor(() => {
      expect(isLoading.value).toBe(false)
    })

    // クリーンアップ
    stopListening()
  })

  test('無効化されている場合はコールバックが呼ばれない', () => {
    const callback = vi.fn()
    const enabled = ref(false)
    const { startListening, stopListening } = useInfiniteScroll(callback, {
      threshold: 200,
      enabled,
    })

    // 手動でリスニングを開始
    startListening()

    // スクロール位置を閾値に達するように設定
    vi.stubGlobal('scrollY', 1100)

    // スクロールイベントを発火
    const scrollEvent = new Event('scroll')
    window.dispatchEvent(scrollEvent)

    // コールバックは呼ばれない
    expect(callback).not.toHaveBeenCalled()

    // クリーンアップ
    stopListening()
  })

  test('enable/disable関数で有効/無効を切り替えられる', async () => {
    const callback = vi.fn()
    const { enable, disable, startListening, stopListening } =
      useInfiniteScroll(callback, { threshold: 200 })

    // 手動でリスニングを開始
    startListening()

    // スクロール位置を閾値に達するように設定
    vi.stubGlobal('scrollY', 1100)

    // 無効化
    disable()

    // スクロールイベントを発火
    const scrollEvent1 = new Event('scroll')
    window.dispatchEvent(scrollEvent1)

    // コールバックは呼ばれない
    expect(callback).not.toHaveBeenCalled()

    // 有効化
    enable()

    // スクロールイベントを発火
    const scrollEvent2 = new Event('scroll')
    window.dispatchEvent(scrollEvent2)

    // コールバックが呼ばれる
    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledTimes(1)
    })

    // クリーンアップ
    stopListening()
  })

  test('閾値に達しない場合はコールバックが呼ばれない', () => {
    const callback = vi.fn()
    const { startListening, stopListening } = useInfiniteScroll(callback, {
      threshold: 200,
    })

    // 手動でリスニングを開始
    startListening()

    // スクロール位置を閾値に達しないように設定
    // distanceFromBottom = 2000 - (0 + 800) = 1200 > 200
    vi.stubGlobal('scrollY', 0)

    // スクロールイベントを発火
    const scrollEvent = new Event('scroll')
    window.dispatchEvent(scrollEvent)

    // コールバックは呼ばれない
    expect(callback).not.toHaveBeenCalled()

    // クリーンアップ
    stopListening()
  })
})
