export type IntersectionCallback = (
  isIntersecting: boolean,
  event: IntersectionObserverEntry,
  observer: IntersectionObserver,
) => void

export type InfiniteScrollPaginationInfo = {
  total: number
  pageSize: number
  page: number
}

export function useInfiniteScroll() {
  function observe(
    element: Ref<HTMLElement | null>,
    onIntersection: IntersectionCallback,
    options: Partial<IntersectionObserverInit> = {},
  ) {
    if (element.value === null) {
      console.warn('element is null')
      return
    }
    const observer = new IntersectionObserver(
      (events: IntersectionObserverEntry[]) => {
        onIntersection(events[0].isIntersecting, events[0], observer)
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 1.0,
        ...options,
      },
    )
    observer.observe(element.value)
  }

  function hasNextPage(paginationInfo: InfiniteScrollPaginationInfo) {
    const nextOffset = paginationInfo.page * paginationInfo.pageSize
    return nextOffset < paginationInfo.total
  }

  return {
    observe,
    hasNextPage,
  }
}
