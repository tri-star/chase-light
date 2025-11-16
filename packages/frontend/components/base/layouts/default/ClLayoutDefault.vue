<script setup lang="ts">
import ClHeader from '../ClHeader.vue'
import ClSidebar from './ClSidebar.vue'

interface Props {
  brandText?: string
}

const props = withDefaults(defineProps<Props>(), {
  brandText: 'Chase Light',
})

const sidebarOpen = ref(false)
const isMobile = ref(false)

const mainClasses = computed(() => {
  const classes = [
    'flex-1 min-h-[calc(100vh-4rem)] transition-[margin] duration-300',
  ]

  if (!isMobile.value) {
    classes.push(sidebarOpen.value ? 'md:ml-64' : 'md:ml-[3.4rem]')
  }

  return classes
})

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

// Mobile detection using window resize
const checkIsMobile = () => {
  if (import.meta.client) {
    isMobile.value = window.innerWidth < 768 // md breakpoint
  }
}

onMounted(() => {
  checkIsMobile()
  window.addEventListener('resize', checkIsMobile)
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('resize', checkIsMobile)
  }
})

// Close sidebar when switching from mobile to desktop
watch(isMobile, (newIsMobile) => {
  if (!newIsMobile) {
    sidebarOpen.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-content-default">
    <ClHeader
      :brand-text="props.brandText"
      :sidebar-open="sidebarOpen"
      @toggle-sidebar="toggleSidebar"
    />
    <NuxtLoadingIndicator />

    <div class="pt-16">
      <ClSidebar
        :is-open="sidebarOpen"
        :is-mobile="isMobile"
        @close="closeSidebar"
      />

      <main :class="mainClasses">
        <div class="p-4 sm:p-6 lg:p-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
