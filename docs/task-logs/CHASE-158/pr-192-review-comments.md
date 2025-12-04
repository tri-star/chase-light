# PR #192 レビューコメントまとめ

## 🔴 High Priority

### packages/frontend/server/api/activities/[id].get.ts:39-43

**問題点:**
バックエンドAPIが200以外のステータスを返した際に`createError`でH3Errorを生成していますが、このエラーは直後の`catch`ブロックで捕捉され、`handleBackendApiError`に渡されます。しかし、`handleBackendApiError`は`status`プロパティを持つFetchErrorを想定しており、H3Error（`statusCode`を持つ）を正しく処理できません。結果として、バックエンドからの元のエラーステータスが失われ、意図せず500エラーとしてクライアントに返される可能性があります。

**対応方法:**
`handleBackendApiError`が一貫してエラーを処理できるよう、FetchErrorと同様の形式のエラーを`throw`するように修正してください。

**修正例:**

```typescript
throw Object.assign(
  new Error(`Backend API returned status ${response.status}`),
  {
    status: response.status,
    data: response.data,
  },
);
```

---

### packages/frontend/components/base/ClIconButton.vue:63-95

**問題点:**
SOWの要件（`docs/sow/20251126-CHASE-158.md` 166行目）では、アイコンボタンに`aria-label`が必須とされています。現在の実装では`ariaLabel`プロパティはオプショナルで、未指定の場合にコンソールに警告を出す形式になっていますが、必須プロパティとして型レベルで強制する方がより堅牢です。

**対応方法:**
`ariaLabel`を必須プロパティに変更し、関連する冗長なコード（`useAttrs`, `normalizedAriaLabel`, `watchEffect`）を削除することを提案します。これにより、コンポーネントの利用者が`aria-label`を確実に提供するようになり、アクセシビリティが向上します。

**修正例:**

```typescript
interface Props {
  ariaLabel: string;
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

---

### packages/frontend/components/base/ClIconButton.vue:120

**問題点:**
`ariaLabel`プロパティを必須にしたことに伴い、`normalizedAriaLabel`を削除し、直接`props.ariaLabel`を参照するように変更します。

**修正例:**

```vue
:aria-label="props.ariaLabel"
```

---

### packages/frontend/components/pages/activities/detail/ActivityDetailPage.vue:26-38

**問題点:**
`displayTitle`と`displayBody`の算出プロパティ内で`hasTranslatedContent.value`をチェックしていますが、20行目の`watchEffect`により、`hasTranslatedContent.value`が`false`の場合は`mode.value`が`'original'`に設定されます。したがって、`mode.value === 'translated'`の時点で`hasTranslatedContent.value`は常に`true`であることが保証されるため、この条件チェックは冗長です。コードをシンプルにするために削除できます。

**修正例:**

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

---

### packages/frontend/components/pages/activities/detail/parts/ActivityDetailHeader.vue:8-18

**問題点:**
`activityTypeLabels`と`activityTypeClasses`のキーの型が`string`になっていますが、`activity.activityType`の型（`'release' | 'issue' | 'pull_request'`）を直接利用することで、より型安全になります。これにより、将来`activityType`の種類が増減した際に、コンパイル時にエラーを検出できるようになります。

**修正例:**

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

---

## レビュー総括

全体的にSOW（作業範囲記述書）に沿って丁寧に実装されており、コンポーネントの分割やテストも適切です。

特に優先度の高い以下の2点については、バグにつながる可能性があるため、修正を推奨します:

1. `useAsyncData`のキャッシュキー問題（ページ遷移時の古いデータ表示）
2. サーバーサイドのエラーハンドリング（ステータスコードの喪失）

また、コンポーネントの型定義をより厳密にすることで、将来の保守性を高めることができます。

---

**生成日時:** 2025-12-05
**対象コミット:** c125bf65291e1021af000ad35ca408fe330b504d
