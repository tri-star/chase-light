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
  {
    name: 'ダッシュボード',
    href: '/dashboard',
    icon: 'i-heroicons-home-20-solid',
  },
  {
    name: 'アクティビティ一覧',
    href: '/activities',
    icon: 'i-heroicons-queue-list-20-solid',
  },
  {
    name: 'データソース一覧',
    href: '/data-sources',
    icon: 'i-heroicons-circle-stack-20-solid',
  },
  { name: 'プロフィール', href: '/profile', icon: 'i-heroicons-user-20-solid' },
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
      class="bg-opacity-50 fixed inset-x-0 top-16 bottom-0 z-40
        bg-dialog-backdrop"
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
        `overflow-x-hidden overflow-y-auto border-r border-sidebar-default
        bg-sidebar-default transition-all duration-300`,
        isMobile
          ? 'fixed top-16 bottom-0 left-0 z-50 w-64'
          : isCollapsed
            ? 'fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-[3.4rem]'
            : 'fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64',
      ]"
      :aria-hidden="isMobile && !isOpen"
      role="navigation"
      aria-label="メインナビゲーション"
    >
      <!-- Mobile close button -->
      <div
        v-if="isMobile"
        class="flex items-center justify-between border-b border-sidebar-default
          p-4"
      >
        <h2 class="text-lg font-semibold text-sidebar-default">Menu</h2>
        <button
          type="button"
          class="focus:ring-status-focus-default rounded-md p-2
            text-interactive-default hover:bg-interactive-hovered focus:ring-2
            focus:outline-none"
          aria-label="サイドメニューを閉じる"
          @click="emit('close')"
        >
          <svg
            class="h-5 w-5"
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
      <nav class="mt-5 space-y-1 px-2">
        <NuxtLink
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          :class="[
            `group text-sm flex h-10 items-center rounded-md px-2 py-2
            font-medium transition-colors`,
            $route.path === item.href
              ? 'bg-sidebar-menu-active text-sidebar-menu-active'
              : `bg-sidebar-menu-default text-sidebar-menu-default
                hover:bg-sidebar-menu-hovered`,
          ]"
          :title="isCollapsed ? item.name : undefined"
          @click="isMobile && emit('close')"
        >
          <!-- Icon container - アイコンコンテナ（位置固定用） -->
          <div class="flex w-5 flex-shrink-0 justify-center">
            <Icon :name="item.icon" class="h-5 w-5" aria-hidden="true" />
          </div>

          <!-- テキストは折りたたみ時は非表示、展開中の折り返し防止 -->
          <span
            v-if="!isCollapsed"
            class="ml-3 overflow-hidden whitespace-nowrap"
          >
            {{ item.name }}
          </span>
        </NuxtLink>
      </nav>
    </aside>
  </Transition>
</template>
