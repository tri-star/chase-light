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
</script>

<template>
  <div class="relative inline-flex w-full items-center">
    <slot name="prefix" />
    <input
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-label="ariaLabel"
      :class="[
        'text-sm flex-1 rounded-md border',
        'border-surface-secondary-default bg-card-default px-4 py-2',
        'text-card-value placeholder:text-card-label',
        `focus:ring-interactive-focused/20 focus:border-interactive-focused
        focus:ring-2 focus:outline-none`,
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-text hover:bg-card-hovered',
      ]"
      @input="handleInput"
      @change="handleChange"
    />
    <slot name="suffix" />
  </div>
</template>
