<script setup lang="ts">
const { user } = useOidcAuth()

const handleLoginWithGitHubClick = () => {}
</script>

<template>
  <div>DASHBOARD</div>
  <div>
    <button @click="handleLoginWithGitHubClick">GitHubでログイン</button>
  </div>
  <div>User: {{ user }}</div>
  <div />
</template>
