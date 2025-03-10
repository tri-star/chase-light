export const useSideMenuStore = defineStore('SIdeMenuStore', () => {
  const isExpanded = ref(true)

  return {
    isExpanded,
  }
})
