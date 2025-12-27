# 手動テストで発見した問題と対処方針

作成日: 2025-12-25

## 概要

CHASE-175の実装完了後、手動テストで2つの問題を発見。
この作業ログでは問題の詳細、原因分析、対処アプローチを記録する。

---

## 課題1: 翻訳リクエストバナーが表示されない

### 問題の詳細

`activities.translated_body`が`null`でも"翻訳リクエスト"バナーが表示されない。

### 原因分析

**ファイル**: `packages/frontend/components/pages/activities/detail/use-activity-detail.ts:32`

```typescript
const hasTranslatedContent = computed(
  () => !!(activity.value?.translatedTitle || activity.value?.translatedBody)
)
```

- `hasTranslatedContent`が「タイトル**または**本文のいずれかが翻訳済み」をチェック
- タイトルが翻訳済みなら、本文が未翻訳(`null`)でも`true`を返す
- バナー表示条件(`ActivityDetailContent.vue:27-36`)で`!hasTranslatedContent`を使用
- → 本文未翻訳でもバナーが表示されない

### 既存実装を変更できない理由

`hasTranslatedContent`は既存機能（原文/翻訳結果の切り替え機能など）で使用されている可能性があるため、単純に修正できない。

### 採用するアプローチ

**新しい`hasTranslatedBody`プロパティを追加**（既存の`hasTranslatedContent`は保持）

#### 変更箇所

1. **`use-activity-detail.ts`**:
   ```typescript
   const hasTranslatedBody = computed(
     () => !!(activity.value?.translatedBody && activity.value.translatedBody !== '')
   )
   ```

2. **propsチェーン**:
   - `use-activity-detail.ts`
   - → `ActivityDetailPage.vue`
   - → `ActivityDetailContent.vue`

   に`hasTranslatedBody`を追加して渡す。

3. **`ActivityDetailContent.vue:27-36`**:
   ```typescript
   const showTranslationBanner = computed(() => {
     return (
       !props.hasTranslatedBody &&  // ← hasTranslatedContentから変更
       props.translationStatus &&
       props.translationStatus !== 'completed'
     )
   })
   ```

---

## 課題2: `body_translation_status`に"idle"状態がない

### 問題の詳細

Backend APIのDB側で`activities.body_translation_status`が「まだリクエストしていない」状態を表現できていない。

#### 問題点

1. **DB定義** (`schema.ts:157-159`):
   - `body_translation_status`は`NOT NULL`
   - デフォルト値が`"completed"`
   - "idle"というステータス値が存在しない

2. **Backend API**:
   - `ActivityDetail`レスポンスに`bodyTranslationStatus`フィールドが含まれていない
   - `drizzle-activity-query.repository.ts:208-231`の`selectBaseFields()`で選択されていない

3. **Frontend**:
   - `use-translation-request.ts`で"idle"を使用
   - しかし、これはコンポーネント内部の初期stateでしかない
   - API responseから"idle"を受け取っているわけではない

### "idle"はどこで変換されている？

**結論**: どこでも変換されていない。

- Frontend BFFの`/api/activities/[id].get.ts`はBackend APIをそのまま返す
- Backend APIは`bodyTranslationStatus`をレスポンスに含めていない
- Frontendの"idle"は`useTranslationRequest`内で`ref`の初期値として設定されているだけ

### 採用するアプローチ

**アプローチA: DB・Backend・Frontend全体で"idle"対応**

#### 変更箇所

##### 1. DB Migration

```sql
-- デフォルト値を"idle"に変更
ALTER TABLE activities
ALTER COLUMN body_translation_status SET DEFAULT 'idle';

-- 既存のtranslated_bodyがNULLのレコードを"idle"に更新
UPDATE activities
SET body_translation_status = 'idle'
WHERE translated_body IS NULL;
```

##### 2. Shared Constants

**ファイル**: `packages/shared/constants/activity.ts`

```typescript
export const ACTIVITY_BODY_TRANSLATION_STATUS = {
  IDLE: 'idle',        // ← 追加
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const
```

##### 3. Backend Validation Schema

**ファイル**: `packages/backend/src/features/activities/infra/repositories/drizzle-activity-translation-state.repository.ts:20-35`

```typescript
const activityTranslationRowSchema = z.object({
  activityId: z.string(),
  body: z.string(),
  translationStatus: z.enum([
    ACTIVITY_BODY_TRANSLATION_STATUS.IDLE,  // ← 追加
    ACTIVITY_BODY_TRANSLATION_STATUS.QUEUED,
    ACTIVITY_BODY_TRANSLATION_STATUS.PROCESSING,
    ACTIVITY_BODY_TRANSLATION_STATUS.COMPLETED,
    ACTIVITY_BODY_TRANSLATION_STATUS.FAILED,
  ]),
  // ...
})
```

##### 4. Backend API Response

**ファイル**: `packages/backend/src/features/activities/infra/repositories/drizzle-activity-query.repository.ts:208-231`

`selectBaseFields()`に追加:
```typescript
bodyTranslationStatus: activities.bodyTranslationStatus,
```

対応するスキーマ定義(`ActivityDetail`型)にも`bodyTranslationStatus`を追加。

##### 5. Frontend Composable

**ファイル**: `packages/frontend/features/activities/composables/use-translation-request.ts`

初期値をAPI responseから取得できるように修正:
```typescript
export function useTranslationRequest(
  activityId: string,
  initialStatus?: TranslationRequestStatus  // ← 引数追加
) {
  const status = ref<TranslationRequestStatus>(initialStatus ?? 'idle')
  // ...
}
```

呼び出し側(`use-activity-detail.ts`)で`bodyTranslationStatus`を渡す:
```typescript
const {
  status: translationStatus,
  // ...
} = useTranslationRequest(activityId, activity.value?.bodyTranslationStatus)
```

#### メリット

- データの一貫性が保たれる
- 状態管理がシンプルになる
- "idle"が正式なステータスとして認識される
- 将来的なメンテナンス性が高い

---

## 実装順序

1. **課題1の実装**:
   - `hasTranslatedBody`の追加
   - propsチェーンの修正
   - バナー表示条件の修正

2. **課題2の実装**:
   - DB Migration作成・実行
   - Shared Constants更新
   - Backend Validation Schema更新
   - Backend API Response更新
   - Frontend Composable更新

3. **動作確認**:
   - 手動テストで両方の問題が解決されているか確認
   - 既存機能（原文/翻訳結果切り替え）が壊れていないか確認

4. **テスト実行**:
   - `pnpm --filter frontend test`
   - `pnpm --filter backend test`
   - 必要に応じてテストコード修正

5. **Lint/Format**:
   - `pnpm --filter frontend lint`
   - `pnpm --filter backend lint`
   - `pnpm format`

---

## 検討した代替案（課題2）

### アプローチB: Frontend BFFで"idle"を生成

Frontend Repository層で以下のようにロジック変換:
```typescript
const bodyTranslationStatus =
  apiResponse.translatedBody ? apiResponse.bodyTranslationStatus : 'idle'
```

**却下理由**:
- フロントエンドでロジック変換が必要（複雑化）
- データの整合性が保たれない
- 状態管理が複雑になる
- 長期的なメンテナンス性が低い

---

## 参考ファイル

### 課題1関連

- `packages/frontend/components/pages/activities/detail/use-activity-detail.ts`
- `packages/frontend/components/pages/activities/detail/ActivityDetailPage.vue`
- `packages/frontend/components/pages/activities/detail/parts/ActivityDetailContent.vue`

### 課題2関連

- `packages/backend/src/db/schema.ts`
- `packages/backend/src/features/activities/infra/repositories/drizzle-activity-query.repository.ts`
- `packages/backend/src/features/activities/infra/repositories/drizzle-activity-translation-state.repository.ts`
- `packages/shared/constants/activity.ts`
- `packages/frontend/features/activities/composables/use-translation-request.ts`
- `packages/frontend/server/api/activities/[id].get.ts`
