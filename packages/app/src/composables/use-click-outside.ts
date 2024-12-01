export function useClickOutSide(
  targetRef: Ref<HTMLElement>,
  callback: () => void,
) {
  function handleClickOutside(e: MouseEvent) {
    if (targetRef.value == null) {
      return
    }
    if (targetRef.value.contains(e.target as Node)) {
      callback()
    }
  }

  onMounted(() => {
    document.addEventListener("click", handleClickOutside)
  })

  onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside)
  })
}
