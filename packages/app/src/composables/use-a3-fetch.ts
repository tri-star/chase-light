export const useA3Fetch: typeof useFetch = (req, opts) => {
  let _fetch = useNuxtApp().$a3Fetch

  if (import.meta.server) {
    const ssrFetch = useRequestFetch()
    _fetch = ((req, opts) => {
      return ssrFetch(req, opts).catch((e) => {
        console.error('useA3Fetch error: ', e)
      })
    }) as typeof _fetch
  }

  return useFetch(req, { ...opts, $fetch: _fetch } as typeof opts)
}
