## Plan: アクティビティ一覧画面をデータソース一覧画面のパターンに統一

ActivityListPageをDataSourceListPageの「Repository + Composable駆動 + Presentationalコンポーネント分離」アーキテクチャに揃えます。Repository層を新設し、無限スクロールのロジックもcomposableに集約します。

### Steps

1. **Repository層の作成**: features/activities/repositories/activity-list-repository.ts を新規作成。`ActivityListParams`インターフェースを定義し、`useRequestFetch` + `toHttpError`パターンでAPI呼び出しを実装（data-source-list-repository.ts を参考）

2. **composable作成**: components/pages/activities/use-activity-list.ts を新規作成。`UseActivityListReturn`型を定義し、state（`activities`, `keyword`, `pagination`, `isLoading`, `fetchError`等）とactions（`loadActivities`, `onSearchInput`, `handleLoad`）を実装。use-infinite-scroll.tsを利用して無限スクロールをcomposable内で制御

3. **検索フォーム分離**: parts/ActivitySearchForm.vue を新規作成。Props: `searchQuery: string`、Emits: `searchInput: [event: Event]`でPresentational化（DataSourceSearchForm.vue を参考、ただしソート関連は除外）

4. **ActivityList.vueのPresentational化**: ActivityList.vue から状態管理・APIフェッチ・無限スクロールロジック・`ClSection`を削除。Props: `activities`, `isLoading`, `isInitialLoading`, `hasNextPage`, `fetchError`, `isEmpty` を受け取る表示専用コンポーネントに変更

5. **ActivityListPage.vue再構成**: ActivityListPage.vue で`useActivityList()`をimport、`ClSection`で`ActivitySearchForm`と`ActivityList`をラップ。手動デバウンス処理を削除し、composableの`refDebounced`を活用

6. **既存テストの修正**: Repositoryのテスト追加と、ActivityList/ActivityListPageのテストを新構造に合わせて更新

### Further Considerations

1. **featuresフォルダ構成**: Activity関連は既に features/activities/ が存在するため、そこにrepositories/を追加します。domain型は`~/generated/api/schemas`から直接importで良いか、aliasを作成するか？ → 現状のDataSource実装に合わせてaliasファイル features/activities/domain/activity.ts を作成することを推奨

User: Repositoryはユニットテストを記述していないので、テスト不要です。
作業が別セッションに分かれることも想定して、
プランを docs/task-logs/CHASE-164 配下にMarkDown形式で書き出してください！

GitHub Copilot: 承知しました！Repositoryのテストは不要とのことで、計画を更新してMarkDownファイルとして出力します。

現在、ファイル編集ツールが無効になっているため、以下の内容を docs/task-logs/CHASE-164/20260102-refactor-plan.md として保存してください。

```markdown
# CHASE-164 リファクタリング計画: アクティビティ一覧画面をデータソース一覧画面のパターンに統一

## 概要

ActivityListPageをDataSourceListPageの「Repository + Composable駆動 + Presentationalコンポーネント分離」アーキテクチャに揃えるリファクタリングを行う。

### 現状の課題

| 観点            | DataSourceListPage           | ActivityListPage                   |
| --------------- | ---------------------------- | ---------------------------------- |
| アーキテクチャ  | Composable駆動（関心の分離） | コンポーネント内混在               |
| 状態管理        | composable内で一元管理       | ページ + ActivityList両方に分散    |
| ClSectionの配置 | ページレベル                 | 子コンポーネント(ActivityList)内部 |
| 検索フォーム    | 専用コンポーネント化         | ページに直接埋め込み               |
| APIアクセス     | Repository経由               | コンポーネント内で直接$fetch       |
| 無限スクロール  | composable管理               | ActivityList内部管理               |

### 目標構造
```

ActivityListPage.vue
├── useActivityList (composable)
│ ├── state (全状態)
│ ├── actions (全アクション)
│ ├── useInfiniteScroll (無限スクロール)
│ └── ActivityListRepository呼び出し
│
└── Template
└── ClSection
├── ActivitySearchForm (Presentational)
└── ActivityList (Presentational)

````

---

## 実装ステップ

### Step 1: Repository層の作成

**ファイル**: `packages/frontend/features/activities/repositories/activity-list-repository.ts`

**参考**: `packages/frontend/features/data-sources/repositories/data-source-list-repository.ts`

**実装内容**:
- `ActivityListParams` インターフェース定義（`keyword`, `page`, `perPage`）
- `ActivityListRepository` クラス作成
- `fetch(params)` メソッド実装
- `useRequestFetch` + `toHttpError` パターンを使用

```typescript
// 実装イメージ
export interface ActivityListParams {
  keyword?: string
  page?: number
  perPage?: number
}

export class ActivityListRepository {
  async fetch(params: ActivityListParams = {}): Promise<ActivityListResponseData> {
    const fetcher = useRequestFetch()
    const queryParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined)
    )
    try {
      const response = await fetcher<ActivityListResponse>('/api/activities', {
        params: queryParams,
      })
      return response.data
    } catch (error) {
      throw toHttpError(error)
    }
  }
}
````

---

### Step 2: Domain型エイリアスの作成（任意）

**ファイル**: `packages/frontend/features/activities/domain/activity-list.ts`

**実装内容**:

- `~/generated/api/schemas` からの型をre-export
- 必要に応じて追加の型定義

```typescript
// 実装イメージ
export type {
  ActivityListResponseDataItemsItem as ActivityListItem,
  ActivityListResponseDataPagination as ActivityListPagination,
} from "~/generated/api/schemas";
```

---

### Step 3: Composable作成

**ファイル**: `packages/frontend/components/pages/activities/use-activity-list.ts`

**参考**: use-data-source-list.ts

**実装内容**:

#### 3.1 型定義

```typescript
export interface ActivityListState {
  activities: Ref<ActivityListItem[]>;
  pagination: Ref<Pagination>;
  fetchError: Ref<string | null>;
  searchQuery: Ref<string>;
  hasNextPage: ComputedRef<boolean>;
  isEmpty: ComputedRef<boolean>;
  isInitialLoading: ComputedRef<boolean>;
  isLoading: Ref<boolean>;
  enabled: Ref<boolean>;
}

export interface ActivityListActions {
  loadActivities: (reset?: boolean) => Promise<void>;
  onSearchInput: (event: Event) => void;
  handleLoad: () => void;
}

export interface UseActivityListReturn {
  state: ActivityListState;
  actions: ActivityListActions;
}
```

#### 3.2 実装ポイント

- `ActivityListRepository` をインスタンス化
- `refDebounced` を使用してキーワード検索のデバウンス処理
- `useInfiniteScroll` を使用して無限スクロール制御
- `enabled` refで次ページ有無を制御
- `watch` でデバウンス済みキーワードの変更を監視し、リスト再取得

---

### Step 4: 検索フォームコンポーネント作成

**ファイル**: `packages/frontend/components/pages/activities/parts/ActivitySearchForm.vue`

**参考**: DataSourceSearchForm.vue

**実装内容**:

- ソート機能は除外（別課題）
- キーワード検索のみ

```typescript
// Props
interface Props {
  searchQuery: string;
}

// Emits
interface Emits {
  (e: "searchInput", event: Event): void;
}
```

**テンプレート**:

- `ClTextField` を使用（現在ActivityListPage.vueにある実装を移動）
- 検索アイコン、プレースホルダー等は現在の実装を維持

---

### Step 5: ActivityList.vueのPresentational化

**ファイル**: ActivityList.vue

**変更内容**:

#### 5.1 削除するもの

- `activities`, `pagination`, `enabled`, `fetchError` 等のref
- `loadMoreActivities` 関数
- `useInfiniteScroll` の使用
- `ClSection` のラップ
- `keyword` の watch 処理
- `onMounted` での初回ロード

#### 5.2 新しいProps

```typescript
interface Props {
  activities: ActivityListItem[];
  isLoading: boolean;
  isInitialLoading: boolean;
  hasNextPage: boolean;
  fetchError: string | null;
  isEmpty: boolean;
}
```

#### 5.3 維持するもの

- リスト表示のテンプレート構造
- `ActivityListItem` コンポーネントの使用
- ローディング表示、エラー表示、空状態表示のUI

---

### Step 6: ActivityListPage.vue再構成

**ファイル**: ActivityListPage.vue

**変更内容**:

#### 6.1 削除するもの

- `filterKeyword`, `debouncedKeyword` のref
- `setTimeout` によるデバウンス処理
- `ClTextField` の直接埋め込み

#### 6.2 追加するもの

- `useActivityList()` composableのimport・使用
- `ClSection` でのラップ
- `ActivitySearchForm` コンポーネントの使用

#### 6.3 新しいテンプレート構造

```vue
<template>
  <div class="space-y-6">
    <div>
      <ClHeading :level="1">アクティビティ</ClHeading>
    </div>
    <div class="flex justify-center">
      <ClSection class="w-full max-w-4xl">
        <ActivitySearchForm
          :search-query="state.searchQuery.value"
          @search-input="actions.onSearchInput"
        />
        <ActivityList
          :activities="state.activities.value"
          :is-loading="state.isLoading.value"
          :is-initial-loading="state.isInitialLoading.value"
          :has-next-page="state.hasNextPage.value"
          :fetch-error="state.fetchError.value"
          :is-empty="state.isEmpty.value"
        />
      </ClSection>
    </div>
  </div>
</template>
```

---

### Step 7: テストの更新

**対象ファイル**:

- `packages/frontend/components/pages/activities/parts/__tests__/ActivityList.spec.ts`（存在する場合）
- E2Eテスト（存在する場合）

**変更内容**:

- ActivityList.vueのProps変更に合わせてテストを更新
- Repositoryのモック方法を確認・調整

---

## ファイル一覧

### 新規作成

| ファイルパス                                                   | 説明                       |
| -------------------------------------------------------------- | -------------------------- |
| `features/activities/repositories/activity-list-repository.ts` | Activity一覧取得Repository |
| `features/activities/domain/activity-list.ts`                  | 型エイリアス（任意）       |
| `components/pages/activities/use-activity-list.ts`             | Composable                 |
| `components/pages/activities/parts/ActivitySearchForm.vue`     | 検索フォームコンポーネント |

### 変更

| ファイルパス         | 変更内容                                        |
| -------------------- | ----------------------------------------------- |
| ActivityListPage.vue | Composable利用、ClSection追加、検索フォーム分離 |
| ActivityList.vue     | Presentational化（状態・ロジック削除）          |

---

## 参考ファイル

- data-source-list-repository.ts
- use-data-source-list.ts
- DataSourceListPage.vue
- DataSourceSearchForm.vue
- DataSourceList.vue
- use-infinite-scroll.ts
- use-debounce.ts

---

## 注意事項

1. **Repositoryのテストは不要**（ユーザー指示）
2. **ソート機能は別課題**として対応
3. 既存の `ClTextField` コンポーネント（CHASE-164で新規追加）はそのまま活用
4. 無限スクロールは use-infinite-scroll.ts を使用（VueUseではない）
5. デバウンスは use-debounce.ts の `refDebounced` を使用

---

## 完了条件

- [ ] Step 1: Repository層の作成
- [ ] Step 2: Domain型エイリアスの作成（任意）
- [ ] Step 3: Composable作成
- [ ] Step 4: 検索フォームコンポーネント作成
- [ ] Step 5: ActivityList.vueのPresentational化
- [ ] Step 6: ActivityListPage.vue再構成
- [ ] Step 7: テストの更新（必要に応じて）
- [ ] `pnpm format` 実行
- [ ] `pnpm lint` 実行
- [ ] `pnpm test` 実行
- [ ] 動作確認

```

```
