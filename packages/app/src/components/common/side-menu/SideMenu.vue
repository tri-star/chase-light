<script setup lang="ts">
import { tv } from 'tailwind-variants'
import SideMenuItem from '~/components/common/side-menu/SideMenuItem.vue'
import {
  sideMenuItems,
  type SideMenuItemId,
} from '~/components/common/side-menu/side-menu'

const route = useRoute()

const { isExpanded } = storeToRefs(useSideMenuStore())
const { breakPoint, isMobile } = useScreenBreakPoint()

const sideMenuClasses = tv({
  base: [
    'group',
    'bg-side-menu',
    'sticky',
    'top-16', // ヘッダーの高さ
    'h-screen',
    'p-2',
    'tramsition-all',
    'duration-300',
  ],
  variants: {
    expanded: {
      true: ['w-72'],
      false: ['w-0', 'opacity-0', 'sm:w-[72px]', 'sm:opacity-100'],
    },
    appearance: {
      mobile: ['fixed', 'z-side-menu'],
      desktop: [],
    },
  },
})

// const logoClasses = tv({
//   base: ['h-14', 'tramsition-left', 'duration-300'],
//   variants: {
//     expanded: {
//       true: ['left-0'],
//       false: ['absolute', 'left-[-200px]'],
//     },
//   },
// })

function isActive(sideMenuId: SideMenuItemId) {
  const currentId = `${route.meta.menuId}`
  return sideMenuId === currentId
}

function handleBackdropClick() {
  isExpanded.value = false
}

function handleMenuItemClick() {
  if (isMobile()) {
    isExpanded.value = false
  }
}
</script>

<template>
  <aside
    :class="
      sideMenuClasses({
        expanded: isExpanded,
        appearance: breakPoint,
      })
    "
  >
    <div class="relative flex">
      <!-- <div class="flex-1">
        <img
          src="~/assets/chase-light-logo-s.svg"
          :class="logoClasses({ expanded: isExpanded })"
          class="w-10/12"
        />
      </div>
      <button class="p-2" @click="handleClickToggleSideMenu">
        <Icon name="mdi:menu" size="40" class="text-side-menu-text" />
      </button>
       -->
    </div>
    <ul class="flex flex-col gap-2">
      <template v-for="menu in sideMenuItems" :key="menu.id">
        <SideMenuItem
          :icon="menu.icon"
          :title="menu.title"
          :to="{ path: menu.path }"
          :is-active="isActive(menu.id)"
          @click="handleMenuItemClick"
        />
      </template>
    </ul>
  </aside>
  <div
    v-if="isMobile() && isExpanded"
    class="z-side-menu-backdrop bg-side-menu-backdrop fixed left-0 top-0 h-full w-full"
    @click="handleBackdropClick"
  ></div>
</template>

<style scoped></style>
