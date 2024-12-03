export function useListKeyboardSelect(
  items: unknown[],
  selectedIndexRef: Ref<number | undefined>,
  onSelected: (index: number) => void,
  onCanceled: () => void,
) {
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      if (selectedIndexRef.value === undefined) {
        selectedIndexRef.value = 0
      } else {
        selectedIndexRef.value = (selectedIndexRef.value + 1) % items.length
      }
    } else if (event.key === "ArrowUp") {
      if (selectedIndexRef.value === undefined) {
        selectedIndexRef.value = items.length - 1
      } else {
        selectedIndexRef.value =
          selectedIndexRef.value - 1 >= 0
            ? selectedIndexRef.value - 1
            : items.length - 1
      }
    }

    if (event.key === "Enter" && selectedIndexRef.value !== undefined) {
      onSelected(selectedIndexRef.value)
    }

    if (event.key === "Escape") {
      onCanceled()
    }
  }

  onMounted(() => {
    document.addEventListener("keydown", handleKeyDown)
  })

  onUnmounted(() => {
    document.removeEventListener("keydown", handleKeyDown)
  })
}
