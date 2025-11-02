<script setup lang="ts">
interface Props {
  // v-model用の値（単一の場合はboolean、グループの場合は配列）
  modelValue?: boolean | string[] | number[]

  // チェックボックスの値（グループ使用時に必須）
  value?: string | number

  // インデターミネート状態（一部選択状態）
  indeterminate?: boolean

  // 無効化状態
  disabled?: boolean

  // ラベルテキスト
  label?: string

  // HTML id属性
  id?: string

  // HTML name属性（グループで共通化）
  name?: string

  // アクセシビリティラベル
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  value: undefined,
  indeterminate: false,
  disabled: false,
  label: undefined,
  id: undefined,
  name: undefined,
  ariaLabel: undefined,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean | string[] | number[]): void
}>()

// 型ガード: string配列かどうか
const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

// 型ガード: number配列かどうか
const isNumberArray = (value: unknown): value is number[] => {
  return Array.isArray(value) && value.every((v) => typeof v === 'number')
}

// チェック状態の計算
const isChecked = computed(() => {
  if (Array.isArray(props.modelValue)) {
    // グループの場合: 配列に値が含まれているかチェック
    if (props.value === undefined) {
      return false
    }

    if (isStringArray(props.modelValue) && typeof props.value === 'string') {
      return props.modelValue.includes(props.value)
    }

    if (isNumberArray(props.modelValue) && typeof props.value === 'number') {
      return props.modelValue.includes(props.value)
    }

    return false
  }
  // 単一の場合: boolean値をそのまま使用
  return !!props.modelValue
})

// aria-checked属性の値
const ariaChecked = computed(() => {
  if (props.indeterminate) {
    return 'mixed'
  }
  return isChecked.value ? 'true' : 'false'
})

// クリックハンドラ
const handleClick = () => {
  if (props.disabled) {
    return
  }

  if (Array.isArray(props.modelValue)) {
    // グループの場合: 配列に値を追加/削除
    if (props.value === undefined) {
      console.warn(
        'ClCheckbox: value prop is required when using array modelValue'
      )
      return
    }

    // string配列の場合
    if (isStringArray(props.modelValue) && typeof props.value === 'string') {
      const newValue = [...props.modelValue]
      const index = newValue.indexOf(props.value)

      if (index > -1) {
        newValue.splice(index, 1)
      } else {
        newValue.push(props.value)
      }

      emit('update:modelValue', newValue)
      return
    }

    // number配列の場合
    if (isNumberArray(props.modelValue) && typeof props.value === 'number') {
      const newValue = [...props.modelValue]
      const index = newValue.indexOf(props.value)

      if (index > -1) {
        newValue.splice(index, 1)
      } else {
        newValue.push(props.value)
      }

      emit('update:modelValue', newValue)
      return
    }

    console.warn('ClCheckbox: type mismatch between modelValue and value prop')
  } else {
    // 単一の場合: boolean値を反転
    emit('update:modelValue', !isChecked.value)
  }
}

// スペースキー押下ハンドラ
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === ' ' || event.key === 'Spacebar') {
    event.preventDefault()
    handleClick()
  }
}

// チェックボックス本体のクラス
const checkboxClasses = computed(() => {
  const baseClasses = [
    'w-5',
    'h-5',
    'rounded',
    'border-2',
    'transition-all',
    'duration-200',
    'flex',
    'items-center',
    'justify-center',
    'cursor-pointer',
  ]

  // disabled状態
  if (props.disabled) {
    baseClasses.push(
      'bg-surface-primary-disabled',
      'opacity-50',
      'cursor-not-allowed'
    )
    return baseClasses
  }

  // インデターミネート状態またはチェック状態
  if (props.indeterminate || isChecked.value) {
    baseClasses.push(
      'bg-surface-primary-default',
      'border-surface-primary-default',
      'hover:bg-surface-primary-hovered'
    )
  } else {
    // 未チェック状態
    baseClasses.push(
      'bg-surface-outlined-default',
      'border-surface-outlined-default',
      'hover:border-surface-primary-hovered'
    )
  }

  return baseClasses
})

// フォーカススタイル
const focusClasses =
  'focus:outline-none focus:ring-2 focus:ring-status-focus-default'

// ラベルのクラス
const labelClasses = computed(() => {
  const classes = ['ml-2', 'cursor-pointer', 'select-none']

  if (props.disabled) {
    classes.push('opacity-50', 'cursor-not-allowed')
  }

  return classes
})

// ユニークなIDの生成
const checkboxId = computed(() => {
  return props.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`
})
</script>

<template>
  <div class="inline-flex items-center">
    <!-- ネイティブinputを非表示で保持（アクセシビリティのため） -->
    <input
      :id="checkboxId"
      type="checkbox"
      :checked="isChecked"
      :disabled="disabled"
      :name="name"
      :aria-label="ariaLabel"
      :aria-checked="ariaChecked"
      class="sr-only"
      @change="handleClick"
      @keydown="handleKeydown"
    />

    <!-- カスタムチェックボックス -->
    <div
      :class="[...checkboxClasses, focusClasses]"
      :tabindex="disabled ? -1 : 0"
      role="checkbox"
      :aria-checked="ariaChecked"
      :aria-disabled="disabled"
      :aria-label="ariaLabel"
      @click="handleClick"
      @keydown="handleKeydown"
    >
      <!-- チェックマーク（インデターミネート時はハイフン、チェック時はチェック） -->
      <svg
        v-if="indeterminate"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        class="w-4 h-4 text-white"
      >
        <!-- Heroicons minus -->
        <path
          fill-rule="evenodd"
          d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z"
          clip-rule="evenodd"
        />
      </svg>
      <svg
        v-else-if="isChecked"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        class="w-4 h-4 text-white"
      >
        <!-- Heroicons check -->
        <path
          fill-rule="evenodd"
          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
          clip-rule="evenodd"
        />
      </svg>
    </div>

    <!-- ラベル -->
    <label v-if="label" :for="checkboxId" :class="labelClasses">
      {{ label }}
    </label>
  </div>
</template>
