<script setup lang="ts">
const { user, logout } = useAuth()

const isOpen = ref(false)
const menuRef = ref<HTMLElement>()

const toggleMenu = () => {
  isOpen.value = !isOpen.value
}

const closeMenu = () => {
  isOpen.value = false
}

const handleLogout = async () => {
  closeMenu()
  await logout()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeMenu()
  }
}

const handleClickOutside = (event: Event) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div ref="menuRef" class="relative">
    <!-- Avatar button -->
    <button
      type="button"
      class="focus:ring-status-focus-default flex items-center space-x-2
        rounded-full p-2 text-interactive-default transition-colors
        hover:bg-interactive-hovered focus:ring-2 focus:outline-none"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      @click="toggleMenu"
    >
      <img
        v-if="user?.avatar"
        :src="user.avatar"
        :alt="user.name || 'ユーザーアバター'"
        class="h-8 w-8 rounded-full"
      />
      <div
        v-else
        class="flex h-8 w-8 items-center justify-center rounded-full
          bg-surface-secondary-default"
      >
        <svg
          class="h-5 w-5 text-content-default"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
      <span
        v-if="user?.name"
        class="text-sm hidden text-content-default sm:block"
      >
        {{ user.name }}
      </span>
    </button>

    <!-- Dropdown menu -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md
          border border-dialog-default bg-dialog-default shadow-lg"
      >
        <div class="py-1" role="menu" aria-orientation="vertical">
          <div
            class="text-sm border-b border-dialog-default px-4 py-2
              text-dialog-default"
          >
            <div class="font-medium">{{ user?.name || 'ゲスト' }}</div>
            <div class="text-xs text-content-default opacity-75">
              {{ user?.email || '' }}
            </div>
          </div>

          <NuxtLink
            to="/profile"
            class="text-sm block px-4 py-2 text-dialog-default transition-colors
              hover:bg-surface-secondary-hovered"
            role="menuitem"
            @click="closeMenu"
          >
            プロフィール
          </NuxtLink>

          <button
            type="button"
            class="text-sm block w-full px-4 py-2 text-left
              text-status-alert-default transition-colors
              hover:bg-surface-secondary-hovered"
            role="menuitem"
            @click="handleLogout"
          >
            ログアウト
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
