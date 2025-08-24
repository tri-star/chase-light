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
        <component :is="themeIcon" class="w-4 h-4" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// テーマアイコン（SVGコンポーネント）
const SunIcon = () =>
  h(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    [
      h('circle', { cx: '12', cy: '12', r: '5' }),
      h('line', { x1: '12', y1: '1', x2: '12', y2: '3' }),
      h('line', { x1: '12', y1: '21', x2: '12', y2: '23' }),
      h('line', { x1: '4.22', y1: '4.22', x2: '5.64', y2: '5.64' }),
      h('line', { x1: '18.36', y1: '18.36', x2: '19.78', y2: '19.78' }),
      h('line', { x1: '1', y1: '12', x2: '3', y2: '12' }),
      h('line', { x1: '21', y1: '12', x2: '23', y2: '12' }),
      h('line', { x1: '4.22', y1: '19.78', x2: '5.64', y2: '18.36' }),
      h('line', { x1: '18.36', y1: '5.64', x2: '19.78', y2: '4.22' }),
    ]
  )

const MoonIcon = () =>
  h(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    [
      h('path', {
        d: 'm12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z',
      }),
    ]
  )

const MonitorIcon = () =>
  h(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    [
      h('rect', {
        x: '2',
        y: '3',
        width: '20',
        height: '14',
        rx: '2',
        ry: '2',
      }),
      h('line', { x1: '8', y1: '21', x2: '16', y2: '21' }),
      h('line', { x1: '12', y1: '17', x2: '12', y2: '21' }),
    ]
  )

// テーマ管理
const { theme, setTheme, currentTheme } = useTheme()

// テーマに応じたアイコンを選択
const themeIcon = computed(() => {
  if (unref(theme) === 'system') return MonitorIcon
  return unref(currentTheme) === 'dark' ? MoonIcon : SunIcon
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
  animation: sun-spin 2s linear infinite;
}

.theme-indicator[data-theme='dark'] .theme-icon {
  color: var(--color-primitive-blue-300);
  animation: moon-glow 3s ease-in-out infinite alternate;
}

@keyframes sun-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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
