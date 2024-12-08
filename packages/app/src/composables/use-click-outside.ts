export function useClickOutSide(
  targetRef: Ref<HTMLElement | null>,
  callback: () => void,
) {
  function handleClickOutside(e: MouseEvent) {
    if (targetRef.value == null) {
      return
    }
    if (!targetRef.value.contains(e.target as Node)) {
      callback()
    }
  }

  onMounted(() => {
    // メニューなどを出現させるための親要素のクリックに反応して即閉じる動作になるので1フレーム遅らせて登録する。
    // nextTickではうまく機能しないのでsetTimeoutで1フレーム分遅らせる
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside)
    })
  })

  onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside)
  })
}
