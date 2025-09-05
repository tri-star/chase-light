<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const { setTheme, currentTheme } = useTheme()

// システム設定は除外し、ライト/ダーク間でトグル
const toggleTheme = () => {
  const newTheme = unref(currentTheme) === 'dark' ? 'light' : 'dark'
  setTheme(newTheme)
}

const themeIconName = computed(() => {
  return unref(currentTheme) === 'dark'
    ? 'i-heroicons-moon-20-solid'
    : 'i-heroicons-sun-20-solid'
})

const buttonSizeClasses = computed(() => {
  if (props.size === 'sm') {
    return {
      button: 'w-8 h-8',
      icon: 'w-4 h-4',
    }
  }

  return {
    button: 'w-10 h-10',
    icon: 'w-5 h-5',
  }
})

const themeLabel = computed(() => {
  return unref(currentTheme) === 'dark'
    ? 'ライトモードに切り替え'
    : 'ダークモードに切り替え'
})
</script>

<template>
  <button
    type="button"
    :class="[
      'flex items-center justify-center rounded-full border transition-all duration-300',

      'focus:outline-none',
      'focus:ring-2 focus:ring-status-focus-default',
      'active:scale-95 transform',
      buttonSizeClasses.button,
      {
        'bg-primitive-yellow-50 border-primitive-yellow-200 hover:bg-primitive-yellow-100':
          currentTheme === 'light',
        'bg-primitive-yellow-900 border-primitive-yellow-600 hover:bg-primitive-yellow-700':
          currentTheme === 'dark',
      },
    ]"
    :aria-label="themeLabel"
    :title="themeLabel"
    @click="toggleTheme"
  >
    <Icon
      :name="themeIconName"
      :class="[
        'transition-all duration-300',
        buttonSizeClasses.icon,
        {
          'text-primitive-yellow-300': currentTheme === 'light',
          'text-primitive-yellow-200': currentTheme === 'dark',
        },
      ]"
    />
  </button>
</template>
