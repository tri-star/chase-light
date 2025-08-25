<template>
  <div class="theme-selector">
    <select
      :value="unref(theme)"
      class="theme-select"
      aria-label="テーマを選択"
      @change="handleThemeChange"
    >
      <option value="light">ライト</option>
      <option value="dark">ダーク</option>
      <option value="system">システム設定</option>
    </select>

    <!-- 現在のテーマを視覚的に表示するインジケーター -->
    <div class="theme-indicator" :data-theme="currentTheme">
      <div class="theme-icon">
        <Icon :name="themeIconName" class="w-4 h-4" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// テーマ管理
const { theme, setTheme, currentTheme } = useTheme()

// テーマに応じたアイコンを選択
const themeIconName = computed(() => {
  if (unref(theme) === 'system') return 'i-heroicons-computer-desktop-20-solid'
  return unref(currentTheme) === 'dark'
    ? 'i-heroicons-moon-20-solid'
    : 'i-heroicons-sun-20-solid'
})

// テーマ変更ハンドラー
const handleThemeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const newTheme = target.value as 'light' | 'dark' | 'system'
  setTheme(newTheme)
}
</script>

<style scoped>
.theme-selector {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
}

.theme-select {
  padding: var(--spacing-3) var(--spacing-3);
  font-size: var(--typography-scale-sm);
  background-color: var(--color-semantic-content-default-bg);
  border: 1px solid var(--color-semantic-interactive-default-border);
  border-radius: var(--radius-md);
  color: var(--color-semantic-content-default-text);
  outline: none;
  transition: all var(--transition-duration-200) ease;
}

.theme-select:focus {
  border-color: var(--color-semantic-surface-primary-default-border);
  box-shadow: 0 0 0 2px var(--color-semantic-common-focus-default-color);
}

.theme-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--size-8);
  height: var(--size-8);
  border-radius: var(--radius-full);
  background-color: var(--color-semantic-interactive-default-bg);
  border: 1px solid var(--color-semantic-interactive-default-border);
  transition: all var(--transition-duration-300) ease;
}

.theme-icon {
  color: var(--color-semantic-common-warn-default-text);
  transition: color var(--transition-duration-300) ease;
}

/* テーマ別のアニメーション */
.theme-indicator[data-theme='light'] {
  background-color: var(--color-primitive-yellow-50);
  border-color: var(--color-primitive-yellow-200);
}

.theme-indicator[data-theme='dark'] {
  background-color: var(--color-primitive-blue-900);
  border-color: var(--color-primitive-blue-700);
}

.theme-indicator[data-theme='light'] .theme-icon {
  color: var(--color-primitive-yellow-600);
}

.theme-indicator[data-theme='dark'] .theme-icon {
  color: var(--color-primitive-blue-300);
  animation: moon-glow 3s ease-in-out infinite alternate;
}

@keyframes moon-glow {
  from {
    opacity: 0.7;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1.05);
  }
}

/* ハイコントラストモード対応 */
@media (prefers-contrast: high) {
  .theme-select {
    border: 2px solid var(--color-primitive-black);
  }

  [data-theme='dark'] .theme-select {
    border-color: var(--color-primitive-white);
  }

  .theme-indicator {
    border: 2px solid var(--color-primitive-black);
  }

  [data-theme='dark'] .theme-indicator {
    border-color: var(--color-primitive-white);
  }
}

/* 縮小表示対応 */
@media (prefers-reduced-motion: reduce) {
  .theme-icon {
    animation: none !important;
  }

  .theme-indicator {
    transition: none;
  }
}
</style>
