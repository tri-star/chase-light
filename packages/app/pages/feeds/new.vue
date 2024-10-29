<script setup lang="ts">
const { loggedIn, user, clear, session } = useUserSession()
</script>

<template>
  <div>Add new feed</div>
  <div v-if="loggedIn">
    <div>
      User:
      <pre>{{ user }}</pre>
    </div>
    <div>
      Session:
      <pre>{{ session }}</pre>
    </div>
    <button @click="clear">Logout</button>
  </div>
  <div v-else>
    <h1>Not logged in</h1>
    <a href="/auth/auth0">Login with GitHub</a>
  </div>
</template>
