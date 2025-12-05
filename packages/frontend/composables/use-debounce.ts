/**
 * デバウンス関数を生成するコンポーザブル
 * @param fn - デバウンスする関数
 * @param delay - 遅延時間（ミリ秒）
 * @returns デバウンスされた関数
 */
export function useDebounce<T extends unknown[], R = void>(
  fn: (...args: T) => R,
  delay: number
): (...args: T) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  return (...args: T) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}
