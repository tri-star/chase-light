<script setup lang="ts">
import AppHeaderIcon from './AppHeaderIcon.vue'
import A3PopupMenuList from '~/components/common/A3PopupMenuList.vue'
import type { A3MenuItemData } from '~/components/common/a3-menu-item'

const showUserMenu = ref(false)
const userIconRef = ref<HTMLElement | null>(null)

const menuItems: A3MenuItemData[] = [{ value: 'logout', label: 'ログアウト' }]

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}

async function handleMenuItemClick(value: string) {
  if (value === 'logout') {
    try {
      const response = await $fetch<{ logoutUrl: string }>('/api/auth/logout', {
        method: 'POST',
      })
      showUserMenu.value = false

      if (response.logoutUrl) {
        // Auth0へのログアウトURLへリダイレクト
        window.location.href = response.logoutUrl
      } else {
        // バックアップとして / にリダイレクト
        navigateTo('/')
      }
    } catch (error) {
      console.error('ログアウト中にエラーが発生しました', error)
      // エラー時も / にリダイレクト
      navigateTo('/')
    }
  } else {
    showUserMenu.value = false
  }
}

function handleMenuCancel() {
  showUserMenu.value = false
}
</script>

<template>
  <header
    class="header bg-header sticky top-0 z-50 flex h-16 gap-4 p-2 shadow-md backdrop-blur-md"
  >
    <div class="flex flex-1"></div>
    <div class="relative flex">
      <div ref="userIconRef">
        <AppHeaderIcon icon="mdi:account" @click="toggleUserMenu" />
      </div>
      <A3PopupMenuList
        v-if="showUserMenu"
        class="right-0 top-12"
        :items="menuItems"
        @click="handleMenuItemClick"
        @cancel="handleMenuCancel"
      />
    </div>
  </header>
</template>

<style scoped></style>
