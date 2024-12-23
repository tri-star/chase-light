import { defu } from "defu"

export const useA3Fetch: typeof useFetch = (req, opts) =>
  useFetch(req, defu(opts, { $fetch: useNuxtApp().$a3Fetch }) as typeof opts)
