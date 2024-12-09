export function useAnchorPosition() {
  function adjustPositionToBounds(targetElement: Ref<HTMLElement>) {
    const boundingRect = getWIndowBoundingRect()

    const targetRect = targetElement.value?.getBoundingClientRect()
    if (targetElement === undefined) {
      throw new Error("要素が見つかりません。")
    }

    const resultRect = {
      left: targetRect.left,
      top: targetRect.top,
      right: targetRect.right,
      bottom: targetRect.bottom,
    }
    const targetWidth = targetRect.width
    const targetHeight = targetRect.height
    const margin = 8

    if (targetRect.left < boundingRect.left) {
      resultRect.left = margin
      resultRect.right = targetWidth + margin
    }
    if (targetRect.top < boundingRect.top) {
      resultRect.top = margin
      resultRect.bottom = targetHeight + margin
    }
    if (targetRect.right > boundingRect.right) {
      resultRect.right = boundingRect.right - margin
      resultRect.left = boundingRect.right - targetWidth - margin
    }
    if (targetRect.bottom > boundingRect.bottom) {
      resultRect.bottom = boundingRect.bottom - margin
      resultRect.top = resultRect.bottom - targetHeight - margin
    }

    return resultRect
  }

  function getWindowBoundingRect() {
    const topSideStickies = document.querySelectorAll("[data-sticky-top]")
    const topMargin = Array.from(topSideStickies.values()).reduce<number>(
      (sum, element) => {
        sum += element.getBoundingClientRect().height
        return sum
      },
      0,
    )

    const leftSideStickies = document.querySelectorAll("[data-sticky-left]")
    const leftMargin = Array.from(leftSideStickies.values()).reduce<number>(
      (sum, element) => {
        sum += element.getBoundingClientRect().width
        return sum
      },
      0,
    )

    return {
      left: leftMargin,
      top: topMargin,
      right: window.innerWidth - leftMargin,
      bottom: window.innerHeight - topMargin,
      width: window.innerWidth - leftMargin,
      height: window.innerHeight - topMargin,
    }
  }

  return {
    adjustPositionToBounds,
  }
}
