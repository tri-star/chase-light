<script setup lang="ts">
import ClHamburgerButton from '../ClHamburgerButton.vue'
import ClAvatarMenu from '../ClAvatarMenu.vue'

interface Props {
  brandText?: string
  sidebarOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  brandText: 'Chase Light',
  sidebarOpen: false,
})

const emit = defineEmits<{
  (e: 'toggleSidebar'): void
}>()

// 認証状態に基づいて表示制御
const { isLoggedIn } = useAuth()

// ハンバーガーメニューはログイン時のみ表示
const showHamburger = computed(() => isLoggedIn.value)
</script>

<template>
  <header class="bg-header-default shadow-sm border-b border-header-default">
    <div class="w-full px-2">
      <div class="flex justify-between items-center h-16">
        <!-- Left side: Brand and hamburger -->
        <div class="flex items-center space-x-4">
          <ClHamburgerButton
            v-if="showHamburger"
            :is-open="props.sidebarOpen"
            @click="emit('toggleSidebar')"
          />
          <h1 class="text-xl font-bold text-header-default">
            {{ props.brandText }}
          </h1>
        </div>

        <!-- Right side: Avatar menu -->
        <div class="flex items-center">
          <ClAvatarMenu v-if="isLoggedIn" />
        </div>
      </div>
    </div>
  </header>
</template>
