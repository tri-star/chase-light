<script setup lang="ts">
const { loggedIn, clear } = useUserSession()
definePageMeta({
  allowGuest: true,
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
