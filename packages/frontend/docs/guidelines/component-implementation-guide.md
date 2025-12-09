# コンポーネント実装ガイドライン（Vue 3 + Nuxt 3 + Tailwind v4）

本ガイドは、`packages/frontend/components` 配下を中心としたVueコンポーネントの作り方を定義します。UIの一貫性・可読性・保守性を重視します。

関連: `page-implementation-guide.md` / `folder-structure.md` / `file-naming-conventions.md`

## 基本スタイル

- SFC + `<script setup lang="ts">` を採用。ブロック順は `script → template → style`。
- TypeScriptを必須（`defineProps`/`defineEmits`/`defineModel` を型安全に利用）。
- コンポーネントは“見た目と最小限の入出力”に集中し、ユースケース/状態管理は `composables/` またはページ側に寄せる。

```vue
<script setup lang="ts">
interface Props {
  label?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  disabled: false,
})

const emit = defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <button type="button" :disabled="props.disabled" @click="emit('click')">
    {{ props.label }}
  </button>
  <!-- 余白や幅は親が指定する。ここでは付与しない -->
  <!-- スタイルはTailwindユーティリティで表現する -->
</template>
```

## Tailwind CSS v4 とデザイントークン

- Tailwind v4 を利用。必ずユーティリティクラスでスタイルを記述し、任意のCSSは最小限。
- デザイントークンに準拠すること。定義は `packages/frontend/docs/design/tailwind-utilities.json` を参照。
  - 例: 文字色は `text-surface-primary`、ボタン背景は `bg-surface-primary` 等、定義済みクラスを優先。
  - 新規トークンが必要だと判断した場合は、まず提案（「xxx を追加した方が良い」）を行い合意を得る。
- `components` 直下にある `.css` の直書きは既存互換のみ。新規はTailwindで統一。
- `packages/frontend/design-tokens.json` を編集した場合は `pnpm --filter frontend generate:tailwind-theme` を必ず実行し、トークン変更を Tailwind テーマへ反映させる。
  - コマンド実行で LLM 向けリファレンスの `packages/frontend/docs/design/tailwind-utilities.json` と Tailwind テーマ定義の `packages/frontend/assets/css/tailwind.css` が自動更新される。
  - 生成後は `packages/frontend/docs/design/tailwind-utilities.json` を読み直して追加・変更されたユーティリティクラスを確認する。利用可能なクラスが予定どおりに増えていない場合は、以下のスクリプトに問題がないか調査する。
    - `packages/frontend/scripts/design-token-converter/tailwind-generator.ts`
    - `packages/frontend/scripts/design-token-converter/tailwind-generator.ts`

## 余白とレイアウトの原則

- コンポーネントは “自分自身にマージンを持たない”。配置の余白は親が決定する（コンテナ責務）。
- 横幅/高さも原則固定しない。`w-full` 等は「レイアウト上必要な場合のみ」許容。
- 横並び/間隔は親で `flex`/`grid` `gap-*` を使って決める。

## バリアントとクラス設計

- バリアント（サイズ/色/状態など）の表現には `tailwind-variants` の利用を“検討”。導入時は以下のようなパターンを推奨。

```ts
// 例: ClButton のクラス定義（導入時）
import { tv } from 'tailwind-variants'

export const button = tv({
  base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  variants: {
    intent: {
      primary: 'bg-surface-primary text-surface-primary hover:bg-surface-primary-hover',
      secondary: 'bg-surface-secondary text-surface-secondary hover:bg-surface-secondary-hover',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-6 text-lg',
    },
  },
  defaultVariants: { intent: 'primary', size: 'md' },
})
```

- 未導入の間は、単純な `:class="[base, disabled && 'opacity-50']"` などで構成してよい。
- クラス名の競合/重複回避のため、クラスは “並列的” に構成する（特定の順序に依存しない）。

## アクセシビリティ（必須）

- インタラクティブ要素は適切なセマンティクスで実装（`<button>`/`<a>`/`role`）。
- フォーカス可視化（Focus Ring）は常に確保し、トークン準拠の色で表示。
- キーボード操作（Enter/Space/Escape 等）を確認。無限スクロール等はARIA属性を付与。
- 画像には `alt`、アイコンのみの場合は `aria-hidden="true"` を付与。

## Props/Emits/Slots の設計

- Props は “必要最小限+意味が明確” に。デフォルトは `withDefaults` で定義。
- 双方向バインディングは `defineModel()` または `update:modelValue` を使用。
- イベント名は kebab-case（例: `submit`, `open-change`）。
- `class`/`style` の上書きは透過させる（Nuxtの自動透過に任せる）。必要に応じて `:class` を `merge` するためのパターンを用意。
- スロットは、汎用性の高い挿入ポイント（`prefix`/`suffix`/`icon`/`default` 等）を提供。

## コンポーネントの種類と命名

- Base（広く再利用される最小UI要素）: `components/base/` に配置し、接頭辞 `Cl` を付ける（例: `ClButton.vue`, `ClCard.vue`）。
- Common（複数機能で再利用される中粒度UI）: `components/common/` に配置（例: `AppHeader.vue`, `AppSidebar.vue`）。
- Page 本体: `components/pages/<page>/<PageName>Page.vue`（ページガイド参照）。

## アイコンの使い方
Nuxt.jsのIconモジュールを利用します。アイコンのサイズは `size` プロパティで指定し、`w-*`/`h-*` クラスは使用しません。

```vue
<!-- sizeはpx単位 -->
<Icon
  name="heroicons:arrow-top-right-on-square"
  size="24"
  aria-hidden="true"
/>
```

## Storybook とテスト

- Storybook: 代表的なバリアント/状態を `*.stories.ts` に用意。操作可能な `args` を定義し、`docs` で用例を記載。
- コンポーネント単体テスト: `__tests__/` に `*.test.ts` を近接配置。`@vue/test-utils` + `vitest` で実装。
- ページ統合テスト: `components/pages/<page>/__tests__/` に配置し、`msw` のOrvalモック（`generated/api/backend.msw.ts`）を利用。

## パフォーマンス/設計の注意

- 不要な再レンダーを避けるため、`computed` を優先し `watch` は最小限に。
- 大型コンポーネントは分割し、`parts/` に抽出。`v-memo`/`keep-alive` は慎重に適用。
- SSR安全性の担保: 直接`window`等に触れず、必要時は `import.meta.client` で分岐。

## スタイルの書き方の細則

- スタイルは Tailwind ユーティリティで完結させる。スコープ付き `<style scoped>` は原則使わない（必要時のみ）。
- カラー/スペース/タイポはトークンに揃える（`tailwind-utilities.json`）。
- 疑似状態（`hover:`/`focus:`/`disabled:`）は可能な限り明示し、アクセシブルに。

## 導入/拡張の提案フロー

1. 既存トークン/ユーティリティで表現できないかを確認。
2. 表現できない場合は、トークン追加の提案を行う（用途・名称・スコープを明記）。
3. バリアントが複雑化する場合は `tailwind-variants` 導入を提案（採用後は共通パターンをドキュメント化）。

## チェックリスト

- [ ] `<script setup lang="ts">` + TS型定義を使用
- [ ] マージンを持たず、親で間隔を制御
- [ ] デザイントークン準拠のユーティリティクラスを使用
- [ ] アクセシビリティ（セマンティクス/フォーカス/キーボード）を満たす
- [ ] Props/Emits/Slots が最小で明確
- [ ] Baseは `Cl` 接頭辞、配置は `base/` or `common/` 規約遵守
