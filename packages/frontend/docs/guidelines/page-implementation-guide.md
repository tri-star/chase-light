# ページ実装ガイドライン（Nuxt 3）

本ガイドは、`packages/frontend` におけるページ（Nuxt `pages/` 配下のルートエントリ）実装の指針を定義します。併せて以下も参照してください。
- フォルダ構成: `packages/frontend/docs/guidelines/folder-structure.md`
- ファイル命名: `packages/frontend/docs/guidelines/file-naming-conventions.md`
- コンポーネント実装: `packages/frontend/docs/guidelines/component-implementation-guide.md`

## 基本方針（SSR/CSR）

- SSRファースト: ページはまずSSRで描画され、その後CSRでハイドレートされる前提で設計する。
- 非ブラウザAPIの利用: 直接 `window`/`document` に触らない。必要なら `import.meta.client` ガードや `onMounted` を使う。
- データ取得は `useAsyncData + Repository`（`features/<feature>/repositories/*`）を基本とし、直接 `fetch` / `useFetch` は使わない。
- BFF経由: 直接Backendを叩かず、必ずフロント側のBFF（`/api/*`）を経由する（詳細は API 実装ガイド参照）。

### 代表的なアンチパターン

- ページと子コンポーネントの双方で同じAPIを `useFetch` し、結果的に複数回呼び出す。
  - 対策: ページ側で集約取得し、子へ `props` で渡すか、`provide/inject` を使う。
- `window` 参照をトップレベルで実行。
  - 対策: `if (import.meta.client) { ... }`、あるいは `onMounted`/`client-only` を利用。

## ページの役割と配置

- ルーティング: `packages/frontend/pages/` はNuxtのルーティング定義を置く。フォルダ/ファイルはURLに対応するため kebab-case。
- ページ本体（UI・ロジックの中心）は `components/pages/<page>/` に配置し、ページを表すコンポーネント名は `<PageName>Page.vue` とする。
  - 例: `components/pages/dashboard/DashboardPage.vue`
  - ページ内パーツは `components/pages/<page>/parts/` に配置。
  - ページに強く紐づく `composable` は同階層（例: `components/pages/dashboard/use-dashboard-page.ts`）。
  - ある機能に関する再利用可能なロジックは `features/<feature>/composables/` に配置する。
  - アプリケーションのドメインに依存しない再利用可能なロジックは `composables/` に配置する。
- エントリファイル（`pages/*.vue`）は薄く保ち、以下に限定する：
  - `definePageMeta`（レイアウト、ミドルウェア、トランジションなど）
  - 初期データ取得（必要最小限）
  - 本体コンポーネントのマウント

## データ取得の実装パターン（Repository 経由が基本）

### Repository 経由（推奨）

```vue
<script setup lang="ts">
import { activityDetailRepository } from '~/features/activities/repositories/activity-detail-repository'

const route = useRoute()
const activityId = computed(() => route.params.id as string)

const { data, pending, error } = await useAsyncData(
  () => `activity-detail:${activityId.value}`,
  () => activityDetailRepository.fetch(activityId.value),
  { server: true, lazy: false }
)
</script>
```

- ポイント
  - ページ/コンポーネントから直接 `useFetch` を呼ばず、Repository に集約する。
  - Repository は Nuxt API ルート（`/api/*`）を呼び出し、戻り値の型は `features/<feature>/domain/*` に集約する。
  - テストは Repository をモックし、ネットワーク依存を避ける。

### 基本形（SSRで1回、CSRで再利用）

```vue
<script setup lang="ts">
const route = useRoute()

const { data, pending, error } = await useAsyncData(
  // 重複排除のキー（ルート依存なら識別子に含める）
  () => `dashboard:${route.params.id ?? 'index'}`,
  () => $fetch('/api/dashboard', { params: { id: route.params.id } }),
  {
    default: () => ({ items: [] }),
    server: true,   // SSRで取得
    lazy: false,    // SSRで待ってから描画（必要に応じて true）
    // watch: [() => route.params.id], // ルート変化で再フェッチしたい場合
    // transform: (res) => res.data,   // 変換が必要なら使用
  }
)
</script>

<template>
  <DashboardPage :items="data?.items ?? []" />
</template>
```

- ポイント
  - キーは重複排除に重要。安定キーを与える（`() => 'key'` 形式推奨）。
  - 同じデータを子コンポーネントで再取得しない。上位で集約し、`props` で渡す。
  - ルート依存の再取得は `watch` オプションまたは `route` の `watch` で制御。

### クライアントのみで取得したい場合

```ts
const { data } = await useFetch('/api/client-only', {
  server: false,    // SSRでは実行しない
  lazy: true,       // CSRでマウント後に取得
})
```

### エラー/ローディング

- ローディング: ページ全体のスケルトンや `ClSpinner` などのベースコンポーネントを使用（詳細はコンポーネントガイド）。
- エラー: `error` を監視し、ページ領域にエラーステートを表示。致命的な場合は `showError` / `createError` を利用。

## SEO・メタ・レイアウト

- `definePageMeta` で `layout`、`middleware`、`pageTransition` を指定。
- `useSeoMeta` で `title`、OGP/Twitterカード等を設定（SSRで出力）。

```ts
definePageMeta({ layout: 'default', middleware: 'auth' })
useSeoMeta({ title: 'Dashboard', ogTitle: 'Dashboard', description: '...', ogDescription: '...' })
```

## ミドルウェアと認可

- 認証が必要なページは `definePageMeta({ middleware: 'auth' })` を付与。
- 役割ベースの判定など、ページ遷移時の前処理は `middleware/` に切り出す。

## ファイル命名・命名規則

- `pages/` 配下: URLに対応し kebab-case（例: `dashboard.vue`, `auth/login.vue`）。
- ページ本体: `components/pages/<page>/<PageName>Page.vue`（PascalCase）。
- ページ内パーツ: `components/pages/<page>/parts/*`（PascalCase）。
- ベースUI: `components/base/Cl*.vue`（例: `ClButton.vue`）。
- composable: 
  - `components/pages/<page>/use-<page-name>-page.ts`（kebab-case）。
  - `features/<feature>/composables/use-xxx.ts`（kebab-case）。
  - `composables/use-xxx.ts`（kebab-case）。

## テストとストーリー

- ページテスト: `components/pages/<page>/__tests__/` に配置。`msw` のOrval生成モック（`generated/api/backend.msw.ts`）を使い、BFF連携を含めた振る舞いを検証。
- Storybook: ページ本体の代表状態を `*.stories.ts` で可視化（モックを用いた代表ケースを作る）。

## よくある設計判断

- どこでデータ取得するか？
  - 複数子で共有するならページで集約し、`props` で配布。
  - 子単独のみで完結するデータは子で `useFetch` 可（ただし再利用と重複呼び出しに注意）。
- どこまでをページに書くか？
  - ルーティング/メタ/初期データ注入まで。UIやロジックは `components/pages/` ＋ `useXxxPage.ts` に寄せる。

## チェックリスト

- [ ] `window`/`document` を直接参照していない（`import.meta.client` ガード済み）
- [ ] データ取得は `useFetch`/`useAsyncData` で重複排除される設計
- [ ] ルート定義は kebab-case、ページ本体は `<PageName>Page.vue`
- [ ] BFF（`/api/*`）を経由している
- [ ] エラー/ローディング状態を考慮している
- [ ] ページは薄く、UI/ロジックは `components/pages/`, `features/<feature>/composables/` に分離
