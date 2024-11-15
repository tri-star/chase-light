<script setup lang="ts">
import SideMenuItem from '~/components/common/side-menu/SideMenuItem.vue'
import {
  sideMenuItems,
  type SideMenuItemId,
} from '~/components/common/side-menu/side-menu'

const route = useRoute()

function isActive(sideMenuId: SideMenuItemId) {
  const currentId = `${route.meta.menuId}`
  return sideMenuId === currentId
}
</script>

<template>
  <aside class="flex flex-col w-72 bg-side-menu sticky top-0 z-50 h-screen p-2">
    <div class="flex">
      <img src="~/assets/logo-dark-02.svg" class="h-14" />
    </div>
    <ul class="flex flex-col gap-2 my-5">
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
