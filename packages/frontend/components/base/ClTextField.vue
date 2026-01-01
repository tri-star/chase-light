<script setup lang="ts">
interface Props {
  /**
   * 入力値（v-model）
   */
  modelValue?: string
  /**
   * プレースホルダーテキスト
   */
  placeholder?: string
  /**
   * 無効状態
   */
  disabled?: boolean
  /**
   * アリアラベル（スクリーンリーダー用）
   */
  ariaLabel?: string
  /**
   * 入力タイプ
   * @default 'text'
   */
  type?: 'text' | 'search' | 'email' | 'password'
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '',
  disabled: false,
  ariaLabel: undefined,
  type: 'text',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  input: [value: string]
  change: [value: string]
}>()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value
  emit('update:modelValue', value)
  emit('input', value)
}

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value
  emit('change', value)
}
const slots = useSlots()

const hasPrefix = computed(() => !!slots.prefix)
const hasSuffix = computed(() => !!slots.suffix)
</script>

<template>
  <div
    :class="[
      'relative inline-flex w-full items-center rounded-md border',
      'border-surface-secondary-default bg-card-default',
      `focus-within:ring-interactive-focused/20
      focus-within:border-interactive-focused focus-within:ring-2`,
      disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-card-hovered',
    ]"
  >
    <span
      v-if="$slots.prefix"
      class="flex items-center justify-center pl-3 text-card-label"
    >
      <slot name="prefix" />
    </span>
    <input
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-label="ariaLabel"
      :class="[
        'text-sm flex-1 bg-transparent py-2',
        'text-card-value placeholder:text-card-label',
        'focus:outline-none',
        hasPrefix ? 'pl-2' : 'pl-4',
        hasSuffix ? 'pr-2' : 'pr-4',
        disabled ? 'cursor-not-allowed' : 'cursor-text',
      ]"
      @input="handleInput"
      @change="handleChange"
    />
    <span
      v-if="$slots.suffix"
      class="flex items-center justify-center pr-3 text-card-label"
    >
      <slot name="suffix" />
    </span>
  </div>
</template>
