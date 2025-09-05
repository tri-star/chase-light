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
    <!-- Header -->
    <ClHeader
      :brand-text="props.brandText"
      :sidebar-open="sidebarOpen"
      @toggle-sidebar="toggleSidebar"
    />

    <div class="flex h-[calc(100vh-4rem)]">
      <!-- 4rem = header height (h-16) -->
      <!-- Sidebar -->
      <ClSidebar
        :is-open="sidebarOpen"
        :is-mobile="isMobile"
        @close="closeSidebar"
      />

      <!-- Main content -->
      <main class="flex-1 overflow-y-auto">
        <div class="p-4 sm:p-6 lg:p-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
