<script setup lang="ts">
import AppHeaderIcon from './AppHeaderIcon.vue'
import A3PopupMenuList from '~/components/common/A3PopupMenuList.vue'
import type { A3MenuItemData } from '~/components/common/a3-menu-item'
import NotificationListBox from '~/components/common/notification/NotificationListBox.vue'

const showUserMenu = ref(false)
const userIconRef = ref<HTMLElement | null>(null)
const { isExpanded: isSideMenuExpanded } = storeToRefs(useSideMenuStore())
const isNotificationBoxOpen = ref(false)

const menuItems: A3MenuItemData[] = [{ value: 'logout', label: 'ログアウト' }]

function toggleSideMenu() {
  isSideMenuExpanded.value = !isSideMenuExpanded.value
}

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}

function showNotificationBox() {
  isNotificationBoxOpen.value = true
}

function closeNotificationBox() {
  isNotificationBoxOpen.value = false
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
    class="header bg-header z-header sticky top-0 flex h-16 w-full gap-4 p-2 shadow-md backdrop-blur-md"
  >
    <div class="flex flex-1 items-center">
      <Icon
        name="mdi:menu"
        size="40"
        class="cursor-pointer"
        @click="toggleSideMenu"
      />
    </div>
    <div class="relative flex items-center gap-4">
      <AppHeaderIcon icon="mdi:bell" @click="showNotificationBox" />
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
    <ClientOnly>
      <Teleport to="body">
        <Transition name="fade">
          <NotificationListBox
            v-if="isNotificationBoxOpen"
            @close="closeNotificationBox"
          />
        </Transition>
      </Teleport>
    </ClientOnly>
  </header>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    right 0.3s ease;
  opacity: 1;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  right: -400px;
}
</style>
