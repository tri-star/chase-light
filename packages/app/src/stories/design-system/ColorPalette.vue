<template>
  <div class="mx-auto max-w-7xl bg-slate-50 p-4 text-sm text-slate-950">
    <h1 class="mb-2 text-2xl font-bold">カラーパレット</h1>
    <p class="mb-4 text-sm text-slate-500">
      デザインシステムで使用される標準カラーパレットです。一貫性のあるユーザーインターフェースを構築するために、これらの色を使用してください。
    </p>

    <section class="mb-6">
      <h2 class="mb-3 border-b border-slate-400 pb-1 text-xl font-semibold">
        背景色 (Background Colors)
      </h2>

      <!-- Primary バリアント -->
      <div class="mb-4">
        <h3 class="mb-2 text-base font-medium text-slate-500">Primary</h3>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <div
            v-for="(color, name) in getColorsByVariant(
              backgroundColor,
              'primary'
            )"
            :key="`bg-${name}`"
            class="overflow-hidden rounded-md border border-slate-400 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="h-16" :style="{ backgroundColor: color }"></div>
            <div class="p-2">
              <h4 class="mb-1 text-xs font-medium">
                {{ formatColorName(name) }}
              </h4>
              <p
                class="mb-1 overflow-hidden text-ellipsis whitespace-nowrap rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs"
              >
                {{ color }}
              </p>
              <p class="font-mono text-xs text-slate-500">bg-{{ name }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Default バリアント -->
      <div class="mb-4">
        <h3 class="mb-2 text-base font-medium text-slate-500">Default</h3>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <div
            v-for="(color, name) in getColorsByVariant(
              backgroundColor,
              'default'
            )"
            :key="`bg-${name}`"
            class="overflow-hidden rounded-md border border-slate-400 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="h-16" :style="{ backgroundColor: color }"></div>
            <div class="p-2">
              <h4 class="mb-1 text-xs font-medium">
                {{ formatColorName(name) }}
              </h4>
              <p
                class="mb-1 overflow-hidden text-ellipsis whitespace-nowrap rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs"
              >
                {{ color }}
              </p>
              <p class="font-mono text-xs text-slate-500">bg-{{ name }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Header バリアント -->
      <div class="mb-4">
        <h3 class="mb-2 text-base font-medium text-slate-500">Header</h3>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <div
            v-for="(color, name) in getColorsByVariant(
              backgroundColor,
              'header'
            )"
            :key="`bg-${name}`"
            class="overflow-hidden rounded-md border border-slate-400 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="h-16" :style="{ backgroundColor: color }"></div>
            <div class="p-2">
              <h4 class="mb-1 text-xs font-medium">
                {{ formatColorName(name) }}
              </h4>
              <p
                class="mb-1 overflow-hidden text-ellipsis whitespace-nowrap rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs"
              >
                {{ color }}
              </p>
              <p class="font-mono text-xs text-slate-500">bg-{{ name }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Side Menu バリアント -->
      <div class="mb-4">
        <h3 class="mb-2 text-base font-medium text-slate-500">Side Menu</h3>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <div
            v-for="(color, name) in getColorsByVariant(
              backgroundColor,
              'side-menu'
            )"
            :key="`bg-${name}`"
            class="overflow-hidden rounded-md border border-slate-400 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="h-16" :style="{ backgroundColor: color }"></div>
            <div class="p-2">
              <h4 class="mb-1 text-xs font-medium">
                {{ formatColorName(name) }}
              </h4>
              <p
                class="mb-1 overflow-hidden text-ellipsis whitespace-nowrap rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs"
              >
                {{ color }}
              </p>
              <p class="font-mono text-xs text-slate-500">bg-{{ name }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Menu Item バリアント -->
      <div class="mb-4">
        <h3 class="mb-2 text-base font-medium text-slate-500">Menu Item</h3>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <div
            v-for="(color, name) in getColorsByVariant(
              backgroundColor,
              'menu-item'
            )"
            :key="`bg-${name}`"
            class="overflow-hidden rounded-md border border-slate-400 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="h-16" :style="{ backgroundColor: color }"></div>
            <div class="p-2">
              <h4 class="mb-1 text-xs font-medium">
                {{ formatColorName(name) }}
              </h4>
              <p
                class="mb-1 overflow-hidden text-ellipsis whitespace-nowrap rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs"
              >
                {{ color }}
              </p>
              <p class="font-mono text-xs text-slate-500">bg-{{ name }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- その他の背景色 -->
      <div class="mb-4">
        <h3 class="mb-2 text-base font-medium text-slate-500">その他</h3>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <div
            v-for="(color, name) in getOtherColors(backgroundColor, [
              'primary',
              'default',
              'header',
              'side-menu',
              'menu-item',
            ])"
            :key="`bg-${name}`"
            class="overflow-hidden rounded-md border border-slate-400 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="h-16" :style="{ backgroundColor: color }"></div>
            <div class="p-2">
              <h4 class="mb-1 text-xs font-medium">
                {{ formatColorName(name) }}
              </h4>
              <p
                class="mb-1 overflow-hidden text-ellipsis whitespace-nowrap rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs"
              >
                {{ color }}
              </p>
              <p class="font-mono text-xs text-slate-500">bg-{{ name }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="mb-6">
      <h2 class="mb-3 border-b border-slate-400 pb-1 text-xl font-semibold">
        テキスト色 (Text Colors)
      </h2>

      <!-- Primary バリアント -->
      <div class="mb-4">
        <h3 class="mb-2 text-base font-medium text-slate-500">Primary</h3>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <div
            v-for="(color, name) in getColorsByVariant(textColor, 'primary')"
            :key="`text-${name}`"
            class="overflow-hidden rounded-md border border-slate-400 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="h-16" :style="{ backgroundColor: color }"></div>
            <div class="p-2">
              <h4 class="mb-1 text-xs font-medium">
                {{ formatColorName(name) }}
              </h4>
              <p
                class="mb-1 overflow-hidden text-ellipsis whitespace-nowrap rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs"
              >
                {{ color }}
              </p>
              <p class="font-mono text-xs text-slate-500">text-{{ name }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Header Icon バリアント -->
      <div class="mb-4">
        <h3 class="mb-2 text-base font-medium text-slate-500">Header Icon</h3>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <div
            v-for="(color, name) in getColorsByVariant(
              textColor,
              'header-icon'
            )"
            :key="`text-${name}`"
            class="overflow-hidden rounded-md border border-slate-400 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="h-16" :style="{ backgroundColor: color }"></div>
            <div class="p-2">
              <h4 class="mb-1 text-xs font-medium">
                {{ formatColorName(name) }}
              </h4>
              <p
                class="mb-1 overflow-hidden text-ellipsis whitespace-nowrap rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs"
              >
                {{ color }}
              </p>
              <p class="font-mono text-xs text-slate-500">text-{{ name }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Side Menu Text バリアント -->
      <div class="mb-4">
        <h3 class="mb-2 text-base font-medium text-slate-500">
          Side Menu Text
        </h3>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <div
            v-for="(color, name) in getColorsByVariant(
              textColor,
              'side-menu-text'
            )"
            :key="`text-${name}`"
            class="overflow-hidden rounded-md border border-slate-400 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="h-16" :style="{ backgroundColor: color }"></div>
            <div class="p-2">
              <h4 class="mb-1 text-xs font-medium">
                {{ formatColorName(name) }}
              </h4>
              <p
                class="mb-1 overflow-hidden text-ellipsis whitespace-nowrap rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs"
              >
                {{ color }}
              </p>
              <p class="font-mono text-xs text-slate-500">text-{{ name }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- その他のテキスト色 -->
      <div class="mb-4">
        <h3 class="mb-2 text-base font-medium text-slate-500">その他</h3>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <div
            v-for="(color, name) in getOtherColors(textColor, [
              'primary',
              'header-icon',
              'side-menu-text',
            ])"
            :key="`text-${name}`"
            class="overflow-hidden rounded-md border border-slate-400 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="h-16" :style="{ backgroundColor: color }"></div>
            <div class="p-2">
              <h4 class="mb-1 text-xs font-medium">
                {{ formatColorName(name) }}
              </h4>
              <p
                class="mb-1 overflow-hidden text-ellipsis whitespace-nowrap rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs"
              >
                {{ color }}
              </p>
              <p class="font-mono text-xs text-slate-500">text-{{ name }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="mb-6">
      <h2 class="mb-3 border-b border-slate-400 pb-1 text-xl font-semibold">
        ボーダー色 (Border Colors)
      </h2>

      <!-- Primary バリアント -->
      <div class="mb-4">
        <h3 class="mb-2 text-base font-medium text-slate-500">Primary</h3>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <div
            v-for="(color, name) in getColorsByVariant(borderColor, 'primary')"
            :key="`border-${name}`"
            class="overflow-hidden rounded-md border border-slate-400 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="h-16" :style="{ backgroundColor: color }"></div>
            <div class="p-2">
              <h4 class="mb-1 text-xs font-medium">
                {{ formatColorName(name) }}
              </h4>
              <p
                class="mb-1 overflow-hidden text-ellipsis whitespace-nowrap rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs"
              >
                {{ color }}
              </p>
              <p class="font-mono text-xs text-slate-500">border-{{ name }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Default バリアント -->
      <div class="mb-4">
        <h3 class="mb-2 text-base font-medium text-slate-500">Default</h3>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <div
            v-for="(color, name) in getColorsByVariant(borderColor, 'default')"
            :key="`border-${name}`"
            class="overflow-hidden rounded-md border border-slate-400 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="h-16" :style="{ backgroundColor: color }"></div>
            <div class="p-2">
              <h4 class="mb-1 text-xs font-medium">
                {{ formatColorName(name) }}
              </h4>
              <p
                class="mb-1 overflow-hidden text-ellipsis whitespace-nowrap rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs"
              >
                {{ color }}
              </p>
              <p class="font-mono text-xs text-slate-500">border-{{ name }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- その他のボーダー色 -->
      <div class="mb-4">
        <h3 class="mb-2 text-base font-medium text-slate-500">その他</h3>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <div
            v-for="(color, name) in getOtherColors(borderColor, [
              'primary',
              'default',
            ])"
            :key="`border-${name}`"
            class="overflow-hidden rounded-md border border-slate-400 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="h-16" :style="{ backgroundColor: color }"></div>
            <div class="p-2">
              <h4 class="mb-1 text-xs font-medium">
                {{ formatColorName(name) }}
              </h4>
              <p
                class="mb-1 overflow-hidden text-ellipsis whitespace-nowrap rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs"
              >
                {{ color }}
              </p>
              <p class="font-mono text-xs text-slate-500">border-{{ name }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import colors from 'tailwindcss/colors'

// カラーパレットの定義
const backgroundColor = {
  primary: colors.cyan[500],
  'primary-hover': colors.cyan[400],
  default: colors.slate[50],
  'default-button': colors.slate[200],
  'default-button-hover': colors.slate[100],
  'default-input': colors.white,
  'default-input-hover': colors.cyan[50],
  disabled: colors.slate[300],
  alert: colors.red[100],
  header: 'rgba(255, 255, 255, 0.7)',
  'header-icon': colors.slate[300],
  'header-icon-hover': colors.slate[200],
  'side-menu': colors.cyan[950],
  'side-menu-hover': 'rgba(255, 255, 255, 0.2)',
  'side-menu-active': 'rgba(255, 255, 255, 0.35)',
  'side-menu-backdrop': 'rgba(0, 0, 0, 0.5)',
  success: colors.lime[200],
  'menu-item': 'hsl(0deg, 0%, 100%, 60%)',
  'menu-item-hover': 'hsl(189deg 94% 43% / 10%)',
  list: colors.white,
  muted: colors.slate[300],
  card: colors.white,
}

const textColor = {
  primary: colors.slate[50],
  default: colors.slate[950],
  disabled: colors.slate[500],
  alert: colors.red[600],
  'header-icon': colors.slate[700],
  'header-icon-hover': colors.slate[600],
  'side-menu-text': colors.slate[300],
  'side-menu-text-hover': colors.slate[400],
  'side-menu-text-active': colors.slate[200],
  success: colors.lime[700],
  muted: colors.slate[500],
}

const borderColor = {
  primary: colors.cyan[500],
  'primary-button': colors.cyan[600],
  'primary-hover': colors.cyan[400],
  default: colors.slate[400],
  'default-button': colors.slate[500],
  'default-button-hover': colors.slate[100],
  'default-input': colors.slate[400],
  disabled: colors.slate[300],
  alert: colors.red[800],
  success: colors.lime[400],
  menu: 'hsl(0deg, 0%, 80%, 60%)',
  list: colors.slate[300],
}

// カラー名のフォーマット
const formatColorName = (name) => {
  // プレフィックスを削除（例：primary-hoverの場合、hoverだけを表示）
  const baseName = name.includes('-')
    ? name.split('-').slice(1).join(' ')
    : name

  // 先頭を大文字にする
  return baseName.charAt(0).toUpperCase() + baseName.slice(1)
}

// 特定のバリアントに属する色を取得
const getColorsByVariant = (colorObj, variant) => {
  const result = {}

  // 完全一致の場合（例：primary）
  if (colorObj[variant]) {
    result[variant] = colorObj[variant]
  }

  // プレフィックスが一致する場合（例：primary-hover）
  Object.entries(colorObj).forEach(([key, value]) => {
    if (key.startsWith(`${variant}-`)) {
      result[key] = value
    }
  })

  return result
}

// 指定したバリアント以外の色を取得
const getOtherColors = (colorObj, variants) => {
  const result = {}

  Object.entries(colorObj).forEach(([key, value]) => {
    // キーがどのバリアントにも属していない場合
    const belongsToVariant = variants.some(
      (variant) => key === variant || key.startsWith(`${variant}-`)
    )

    if (!belongsToVariant) {
      result[key] = value
    }
  })

  return result
}
</script>
