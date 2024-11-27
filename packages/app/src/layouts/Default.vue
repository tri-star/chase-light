<script setup lang="ts">
import A3Toast from "~/components/common/A3Toast.vue"
import AppHeader from "~/components/common/header/AppHeader.vue"
import SideMenu from "~/components/common/side-menu/SideMenu.vue"

const toastStore = useToastStore()
const { toasts } = storeToRefs(toastStore)
</script>

<template>
  <div class="flex root min-h-screen h-full">
    <SideMenu />
    <div class="flex flex-col w-full">
      <AppHeader />
      <main class="flex h-full p-4 justify-center">
        <div
          class="flex flex-col lg:w-[800px] md:w-[600px] bg-default rounded-2xl p-4"
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
