<script setup lang="ts" generic="T extends string | number">
import ClDropdownMenu from './ClDropdownMenu.vue'
import ClMenuItem from './ClMenuItem.vue'

interface SelectOption<V extends string | number = string> {
  value: V
  label: string
  disabled?: boolean
}

interface Props {
  /**
   * 選択肢の配列
   */
  options: SelectOption<T>[]
  /**
   * 選択中の値
   */
  modelValue?: T
  /**
   * プレースホルダーテキスト
   */
  placeholder?: string
  /**
   * 無効状態
   */
  disabled?: boolean
  /**
   * メニューの配置位置
   * @default 'bottom-right'
   */
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  /**
   * アリアラベル（スクリーンリーダー用）
   */
  ariaLabel?: string
  /**
   * カスタムクラス
   */
  triggerClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  placeholder: '選択してください',
  disabled: false,
  placement: 'bottom-right',
  ariaLabel: undefined,
  triggerClass: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: T]
  change: [value: T]
}>()

const selectedLabel = computed(() => {
  if (props.modelValue === undefined) {
    return props.placeholder
  }
  const option = props.options.find((o) => o.value === props.modelValue)
  return option?.label ?? props.placeholder
})

const handleSelect = (value: string) => {
  // valueはstring型で渡されるので、オリジナルのoptionを探して正しい型の値を使用
  const option = props.options.find((o) => String(o.value) === value)
  if (option) {
    emit('update:modelValue', option.value)
    emit('change', option.value)
  }
}
</script>

<template>
  <ClDropdownMenu
    :placement="placement"
    :aria-label="ariaLabel"
    @select="handleSelect"
  >
    <template #trigger="{ triggerProps, triggerEvents, triggerRef, isOpen }">
      <button
        v-bind="triggerProps"
        :ref="(el) => triggerRef(el as HTMLElement)"
        type="button"
        :disabled="disabled"
        :class="[
          'text-sm inline-flex items-center gap-2 rounded-md border',
          'border-surface-secondary-default bg-card-default px-4 py-2',
          'text-card-value',
          disabled
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer hover:bg-card-hovered',
          triggerClass,
        ]"
        @click="!disabled && triggerEvents.onClick()"
        @keydown="!disabled && triggerEvents.onKeydown($event)"
      >
        <slot name="prefix" />
        <span class="flex-1 text-left">{{ selectedLabel }}</span>
        <Icon
          :name="
            isOpen
              ? 'heroicons:chevron-up-20-solid'
              : 'heroicons:chevron-down-20-solid'
          "
          class="h-4 w-4 shrink-0"
          aria-hidden="true"
        />
        <slot name="suffix" />
      </button>
    </template>
    <template #default="{ close }">
      <ClMenuItem
        v-for="option in options"
        :id="String(option.value)"
        :key="String(option.value)"
        :disabled="option.disabled"
        :selected="option.value === modelValue"
        @click="
          () => {
            if (!option.disabled) {
              handleSelect(String(option.value))
              close()
            }
          }
        "
      >
        <slot name="option" :option="option">
          {{ option.label }}
        </slot>
      </ClMenuItem>
    </template>
  </ClDropdownMenu>
</template>
