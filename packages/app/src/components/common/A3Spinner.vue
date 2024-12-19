<script setup lang="ts">
type ColorVariant = "white" | "gray"

const props = withDefaults(
  defineProps<{
    color?: ColorVariant
    sizeClass?: string
  }>(),
  {
    color: "white",
    sizeClass: "w-5 h-5",
  }
)

const colorClass = computed(() => {
  switch (props.color) {
    case "gray":
      return "before:border-gray-300"
    case "white":
    default:
      return "before:border-white"
  }
})
</script>

<template>
  <span class="loader" :class="[colorClass, sizeClass]"></span>
</template>

<style scoped>
.loader {
  border-radius: 50%;
  position: relative;
  animation: rotate 1s linear infinite;
}
.loader::before {
  content: "";
  box-sizing: border-box;
  position: absolute;
  inset: 0px;
  border-radius: 50%;
  border-width: 3px;
  border-style: solid;
  animation: prixClipFix 2s linear infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes prixClipFix {
  0% {
    clip-path: polygon(50% 50%, 0 0, 0 0, 0 0, 0 0, 0 0);
  }
  25% {
    clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 0, 100% 0, 100% 0);
  }
  50% {
    clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 100%, 100% 100%, 100% 100%);
  }
  75% {
    clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 100%, 0 100%, 0 100%);
  }
  100% {
    clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 100%, 0 100%, 0 0);
  }
}
</style>
