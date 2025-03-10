export const useSideMenuStore = defineStore('SideMenuStore', () => {
  const isExpanded = ref(true)

  return {
    isExpanded,
  }
})
