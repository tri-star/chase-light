<script setup lang="ts" generic="T">
const value = defineModel<T | T[]>()
const elementId = useId()

withDefaults(
  defineProps<{
    name: string
    label?: string
  }>(),
  {
    label: undefined,
  }
)
</script>

<template>
  <input
    :id="elementId"
    type="radio"
    :name="name"
    v-model="value"
    class="radio"
  />
  <label class="inline-block" :for="elementId"
    ><span v-if="label">{{ label }}</span></label
  >
</template>

<style scoped>
.radio {
  position: absolute;
  white-space: nowrap;
  border: 0;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  overflow: hidden;
  height: 1px;
  width: 1px;
  margin: -1px;
  padding: 0;
}

label {
  position: relative;
  cursor: pointer;
  padding-left: 30px;
}

label::before,
label::after {
  content: "";
  display: block;
  border-radius: 50%;
  position: absolute;
  transform: translateY(-50%);
  top: 50%;
}

label::before {
  @apply bg-default-input border border-default-input;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  left: 5px;
}

label::after {
  @apply bg-primary;
  border-radius: 50%;
  opacity: 0;
  width: 12px;
  height: 12px;
  left: 9px;
}

input:checked + label::after {
  opacity: 1;
}
</style>
