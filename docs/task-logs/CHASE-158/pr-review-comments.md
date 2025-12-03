# PR #192 レビューコメント整理

**PR**: [feat: アクティビティ詳細ページとアイコンボタン追加 CHASE-158](https://github.com/tri-star/chase-light/pull/192)
**レビュアー**: gemini-code-assist[bot]
**作成日**: 2025-11-26
**最終更新**: 2025-12-03

## レビュー概要

全体的にSOWに沿って丁寧に実装されており、コンポーネントの分割やテストも適切です。以下のカテゴリでコメントを整理しました。

---

### 2. `packages/frontend/server/api/activities/[id].get.ts`:39-43

**優先度**: 高
**問題**: エラーハンドリングの型不一致

#### 詳細

バックエンドAPIが200以外のステータスを返した際に`createError`でH3Errorを生成していますが、このエラーは直後の`catch`ブロックで捕捉され、`handleBackendApiError`に渡されます。しかし、`handleBackendApiError`は`status`プロパティを持つFetchErrorを想定しており、H3Error（`statusCode`を持つ）を正しく処理できません。

結果として、バックエンドからの元のエラーステータスが失われ、意図せず500エラーとしてクライアントに返される可能性があります。

#### 修正案

`handleBackendApiError`が一貫してエラーを処理できるよう、FetchErrorと同様の形式のエラーを`throw`するように修正してください。

```typescript
throw Object.assign(
  new Error(`Backend API returned status ${response.status}`),
  {
    status: response.status,
    data: response.data,
  },
);
```

#### 影響範囲

- エラーレスポンスのステータスコード
- クライアント側のエラーハンドリング
- デバッグの容易性

---

## 推奨事項（SHOULD）

### 3. `packages/frontend/components/base/ClIconButton.vue`:63-95

**優先度**: 中
**問題**: aria-labelの型定義が緩い

#### 詳細

SOWの要件（`docs/sow/20251126-CHASE-158.md` 166行目）では、アイコンボタンに`aria-label`が必須とされています。現在の実装では`ariaLabel`プロパティはオプショナルで、未指定の場合にコンソールに警告を出す形式になっていますが、必須プロパティとして型レベルで強制する方がより堅牢です。

`ariaLabel`を必須プロパティに変更し、関連する冗長なコード（`useAttrs`, `normalizedAriaLabel`, `watchEffect`）を削除することを提案します。これにより、コンポーネントの利用者が`aria-label`を確実に提供するようになり、アクセシビリティが向上します。

#### 修正案

```typescript
interface Props {
  ariaLabel: string; // オプショナルから必須に変更
  icon?: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  icon: undefined,
  variant: "ghost",
  size: "md",
  type: "button",
  disabled: false,
});

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();
```

また、テンプレート部分も以下のように変更：

```vue
<button
  :type="props.type"
  data-testid="cl-icon-button"
  :class="classes"
  :aria-label="props.ariaLabel"
  :disabled="props.disabled"
  @click="handleClick"
></button>
```

#### 影響範囲

- コンポーネントの利用箇所（必須プロパティになるため、コンパイル時にチェック可能）
- アクセシビリティの向上
- コード量の削減（不要なロジックの削除）

#### 追加作業

- ClIconButtonを使用している全ての箇所で`ariaLabel`を明示的に指定する必要がある
- 単体テストを更新する必要がある

---

### 4. `packages/frontend/components/pages/activities/detail/ActivityDetailPage.vue`:26-38

**優先度**: 中
**問題**: 冗長な条件チェック

#### 詳細

`displayTitle`と`displayBody`の算出プロパティ内で`hasTranslatedContent.value`をチェックしていますが、20行目の`watchEffect`により、`hasTranslatedContent.value`が`false`の場合は`mode.value`が`'original'`に設定されます。

したがって、`mode.value === 'translated'`の時点で`hasTranslatedContent.value`は常に`true`であることが保証されるため、この条件チェックは冗長です。コードをシンプルにするために削除できます。

#### 修正案

```typescript
const displayTitle = computed(() => {
  if (mode.value === "translated") {
    return props.activity.translatedTitle || props.activity.title;
  }
  return props.activity.title;
});

const displayBody = computed(() => {
  if (mode.value === "translated") {
    return props.activity.translatedBody || props.activity.detail;
  }
  return props.activity.detail;
});
```

#### 影響範囲

- コードの可読性向上
- パフォーマンス（微小）

---

### 5. `packages/frontend/components/pages/activities/detail/parts/ActivityDetailHeader.vue`:8-18

**優先度**: 中
**問題**: 型定義の改善余地

#### 詳細

`activityTypeLabels`と`activityTypeClasses`のキーの型が`string`になっていますが、`activity.activityType`の型（`'release' | 'issue' | 'pull_request'`）を直接利用することで、より型安全になります。これにより、将来`activityType`の種類が増減した際に、コンパイル時にエラーを検出できるようになります。

#### 修正案

```typescript
type ActivityType = NonNullable<
  ActivityDetailResponseData["activity"]["activityType"]
>;

const activityTypeLabels: Record<ActivityType, string> = {
  release: "リリース",
  issue: "Issue",
  pull_request: "PR",
};

const activityTypeClasses: Record<ActivityType, string> = {
  release: "bg-status-info-subtle text-status-info-default",
  issue: "bg-status-warn-subtle text-status-warn-default",
  pull_request: "bg-status-success-subtle text-status-success-default",
};
```

#### 影響範囲

- 型安全性の向上
- 将来の拡張性（新しいactivityTypeを追加する際にコンパイルエラーで検知可能）
