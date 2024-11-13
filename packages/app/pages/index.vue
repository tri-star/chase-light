<script setup lang="ts">
import { SIDE_MENU_ITEM_MAP } from '~/components/common/side-menu/side-menu'

const { loggedIn, clear } = useUserSession()
definePageMeta({
  allowGuest: true,
  menuId: SIDE_MENU_ITEM_MAP.dashboard.id,
})
</script>

<template>
  <div>DASHBOARD</div>
  <div>loggedIn: {{ loggedIn }}</div>
  <div v-if="!loggedIn">
    <a href="/auth/auth0">Login with GitHub</a>
  </div>
  <div v-else>
    <div>
      <a href="/feeds/new">Add new feed</a>
    </div>
    <button @click="clear">Logout</button>
  </div>
</template>
