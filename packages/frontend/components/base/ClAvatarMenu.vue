<script setup lang="ts">
const { user, logout } = useAuth()

const handleLogout = async () => {
  await logout()
}
</script>

<template>
  <ClDropdownMenu aria-label="ユーザーメニュー">
    <template #trigger="{ isOpen }">
      <button
        type="button"
        class="focus:ring-status-focus-default flex items-center space-x-2
          rounded-full p-2 text-interactive-default transition-colors
          hover:bg-interactive-hovered focus:ring-2 focus:outline-none"
        :aria-expanded="isOpen"
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
    </template>

    <!-- User info header -->
    <div
      class="text-sm border-b border-menu-default px-4 py-2 text-menu-default"
    >
      <div class="font-medium">{{ user?.name || 'ゲスト' }}</div>
      <div class="text-xs opacity-75">
        {{ user?.email || '' }}
      </div>
    </div>

    <!-- Menu items -->
    <ClMenuItem type="link" to="/profile">
      <template #icon>
        <svg
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </template>
      プロフィール
    </ClMenuItem>

    <ClMenuItem type="button" @click="handleLogout">
      <template #icon>
        <svg
          class="h-5 w-5 text-status-alert-default"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      </template>
      <span class="text-status-alert-default">ログアウト</span>
    </ClMenuItem>
  </ClDropdownMenu>
</template>
