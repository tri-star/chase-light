<script setup lang="ts">
import A3Toast from "~/components/common/A3Toast.vue"
import AppHeader from "~/components/common/header/AppHeader.vue"
import SideMenu from "~/components/common/side-menu/SideMenu.vue"

const toastStore = useToastStore()
const { toasts } = storeToRefs(toastStore)
</script>

<template>
  <div class="root flex h-full min-h-screen">
    <SideMenu />
    <div class="flex w-full flex-col">
      <AppHeader />
      <main class="flex h-full justify-center p-4">
        <div
          class="bg-default flex flex-col rounded-2xl p-4 md:w-[600px] lg:w-[800px]"
        >
          <slot />
          <div>
            <A3Toast
              v-for="toast in toasts"
              :id="toast.id"
              :key="toast.id"
              :type="toast.type"
              :duration="toast.durationMs"
              :message="toast.message"
              :bottom-y="toast.bottomY"
              @destroy="toastStore.handleDestroyToast"
            />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style>
html,
body,
#__nuxt {
  min-height: 100vh;
}
</style>

<style scoped>
.root {
  background: linear-gradient(122deg, #cbd5e1 1.12%, #6f747b 105.33%);
}
</style>
