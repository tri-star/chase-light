<script setup lang="ts">
import { tv } from 'tailwind-variants'
import SideMenuItem from '~/components/common/side-menu/SideMenuItem.vue'
import {
  sideMenuItems,
  type SideMenuItemId,
} from '~/components/common/side-menu/side-menu'

const route = useRoute()

const isExpanded = ref(true)

const sideMenuClasses = tv({
  base: [
    'group',
    'bg-side-menu',
    'sticky',
    'top-0',
    'z-50',
    'h-screen',
    'p-2',
    'tramsition-all',
    'duration-300',
  ],
  variants: {
    expanded: {
      true: ['w-72'],
      false: ['w-[72px]'],
    },
  },
})

const logoClasses = tv({
  base: ['h-14', 'tramsition-left', 'duration-300'],
  variants: {
    expanded: {
      true: ['left-0'],
      false: ['absolute', 'left-[-200px]'],
    },
  },
})

function handleClickToggleSideMenu() {
  isExpanded.value = !isExpanded.value
}

function isActive(sideMenuId: SideMenuItemId) {
  const currentId = `${route.meta.menuId}`
  return sideMenuId === currentId
}
</script>

<template>
  <aside :class="sideMenuClasses({ expanded: isExpanded })">
    <div class="relative flex">
      <div class="flex-1">
        <img
          src="~/assets/chase-light-logo-s.svg"
          :class="logoClasses({ expanded: isExpanded })"
          class="w-10/12"
        />
      </div>
      <button class="p-2" @click="handleClickToggleSideMenu">
        <Icon name="mdi:menu" size="40" class="text-side-menu-text" />
      </button>
    </div>
    <ul class="my-5 flex flex-col gap-2">
      <template v-for="menu in sideMenuItems" :key="menu.id">
        <SideMenuItem
          :icon="menu.icon"
          :title="menu.title"
          :to="{ path: menu.path }"
          :is-active="isActive(menu.id)"
        />
      </template>
    </ul>
  </aside>
</template>

<style scoped></style>
