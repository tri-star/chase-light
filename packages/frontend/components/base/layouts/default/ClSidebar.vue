<script setup lang="ts">
interface Props {
  isOpen?: boolean
  isMobile?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  isMobile: false,
})

// Desktop collapsed mode: サイドバーが閉じている時はアイコンのみ表示
const isCollapsed = computed(() => !props.isMobile && !props.isOpen)

const emit = defineEmits<{
  (e: 'close'): void
}>()

const sidebarRef = ref<HTMLElement>()

const navigation = [
  { name: 'ダッシュボード', href: '/dashboard', icon: 'home' },
  { name: 'プロフィール', href: '/profile', icon: 'user' },
]

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

const handleBackdropClick = (event: Event) => {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// Focus management for mobile
watch(
  () => props.isOpen,
  (newIsOpen) => {
    if (newIsOpen && props.isMobile) {
      nextTick(() => {
        const firstFocusableElement = sidebarRef.value?.querySelector(
          'a'
        ) as HTMLElement
        firstFocusableElement?.focus()
      })
    }
  }
)
</script>

<template>
  <!-- Mobile backdrop -->
  <Transition
    v-if="isMobile"
    enter-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-300"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40 bg-dialog-backdrop bg-opacity-50"
      @click="handleBackdropClick"
    />
  </Transition>

  <!-- Sidebar -->
  <Transition
    :enter-active-class="isMobile ? 'transition transform duration-300' : ''"
    :enter-from-class="isMobile ? '-translate-x-full' : ''"
    :enter-to-class="isMobile ? 'translate-x-0' : ''"
    :leave-active-class="isMobile ? 'transition transform duration-300' : ''"
    :leave-from-class="isMobile ? 'translate-x-0' : ''"
    :leave-to-class="isMobile ? '-translate-x-full' : ''"
  >
    <aside
      v-if="!isMobile || isOpen"
      ref="sidebarRef"
      :class="[
        'bg-sidebar-default border-r border-sidebar-default transition-all duration-300',
        isMobile
          ? 'fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto'
          : isCollapsed
            ? 'w-[3.4rem] overflow-hidden'
            : 'w-64 overflow-y-auto',
      ]"
      :aria-hidden="isMobile && !isOpen"
      role="navigation"
      aria-label="メインナビゲーション"
    >
      <!-- Mobile close button -->
      <div
        v-if="isMobile"
        class="flex items-center justify-between p-4 border-b border-sidebar-default"
      >
        <h2 class="text-lg font-semibold text-sidebar-default">Menu</h2>
        <button
          type="button"
          class="p-2 rounded-md text-interactive-default hover:bg-interactive-hovered focus:outline-none focus:ring-2 focus:ring-status-focus-default"
          aria-label="サイドメニューを閉じる"
          @click="emit('close')"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Navigation items -->
      <nav class="mt-5 px-2 space-y-1">
        <NuxtLink
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          :class="[
            'group flex items-center h-10 px-2 py-2 text-sm font-medium rounded-md text-sidebar-default hover:bg-interactive-hovered hover:text-interactive-hovered transition-colors',
            $route.path === item.href
              ? 'bg-surface-primary-default text-surface-primary-default'
              : '',
          ]"
          :title="isCollapsed ? item.name : undefined"
          @click="isMobile && emit('close')"
        >
          <!-- Icon container - アイコンコンテナ（位置固定用） -->
          <div class="flex-shrink-0 w-5 flex justify-start">
            <!-- Home icon --><!-- ホームアイコン -->
            <svg
              v-if="item.icon === 'home'"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>

            <!-- User icon --><!-- ユーザーアイコン -->
            <svg
              v-else-if="item.icon === 'user'"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>

          <!-- テキストは折りたたみ時は非表示、展開中の折り返し防止 -->
          <span
            v-if="!isCollapsed"
            class="ml-3 whitespace-nowrap overflow-hidden"
          >
            {{ item.name }}
          </span>
        </NuxtLink>
      </nav>
    </aside>
  </Transition>
</template>
