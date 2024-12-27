<script setup lang="ts" generic="T">
const elementId = useId()

const props = withDefaults(
  defineProps<{
    name: string
    label?: string
    value: T
    selectedValue?: T | undefined
  }>(),
  {
    label: undefined,
    selectedValue: undefined,
  }
)

const isChecked = computed(() => props.selectedValue === props.value)
</script>

<template>
  <div>
    <input
      :id="elementId"
      type="radio"
      :name="name"
      :class="{
        radio: true,
        peer: isChecked,
      }"
      :value="value"
      :checked="isChecked"
      v-bind="$attrs"
      tabindex="0"
    />
    <label
      class="inline-block peer-focus:outline-double peer-focus:outline-2"
      :for="elementId"
      ><span v-if="label">{{ label }}</span></label
    >
  </div>
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
  @apply bg-default-input border-default-input border;
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
