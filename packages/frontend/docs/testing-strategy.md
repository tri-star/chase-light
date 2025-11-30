# テスト戦略

## ステータス

承認済み

## コンテキスト

プロジェクトの成長に伴い、品質保証とリファクタリングの安全性を確保するため、包括的なテスト戦略の策定が必要となった。フロントエンド、バックエンド、E2Eテストの各レイヤーで一貫した方針を定める必要がある。

## 決定

| レイヤー                      | 目的                                                        | 実行環境                             | ネットワーク               | 実行頻度            | 典型的な比率\* |
| ----------------------------- | ----------------------------------------------------------- | ------------------------------------ | -------------------------- | ------------------- | -------------- |
| **Unit**                      | コンポーネント／Composable の純粋ロジック                   | Node + happy-dom / jsdom             | **MSW** で完全スタブ       | push ごと           | 60–70 %        |
| **Component / Feature (DOM)** | ページ単位で DOM とルーティングを検証                       | Node + `@nuxt/test-utils`            | **MSW**                    | push ごと           | 20 %           |
| **Browser Feature (少数)**    | ドラッグ&ドロップ・フォーカスなど “ブラウザ依存” を早期発見 | **Vitest Browser Mode** + Playwright | **MSW**                    | nightly / pre-merge | 5–10 %         |
| **E2E**                       | 本番に最も近い形でクリティカルシナリオ担保                  | Playwright (GUI ブラウザ)            | **実 API**（ステージング） | リリース前          | 3–5 %          |

※ それぞれのレイヤーで認証をどうするかは [認証に関するテスト戦略](../../../docs/adr/ADR001-auth.md#testing-strategy) を参照

### テストピラミッド

#### 概念

テストピラミッドは、効果的なテスト戦略を表現する概念モデル。下位レイヤーほど多くのテストを実行し、上位レイヤーほど少なく重要なテストに絞る。

```
     /\
    /  \     E2E テスト
   /____\    (少数・重要なフロー)
  /      \
 /        \   フィーチャーテスト
/__________\  (中程度・機能検証)
\          /
 \        /   ユニットテスト
  \______/    (多数・詳細検証)
```

### レイヤー定義とツールセット

| レイヤー                      | 推奨ライブラリ                                                    | Nuxt での書き方例                                                                                                                                                                 |
| ----------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unit**                      | Vitest + @vue/test-utils + happy-dom                              | `ts<br>const wrapper = mount(MyButton, { props: { disabled: true } })<br>expect(wrapper.classes()).toContain('opacity-50')<br>`                                                   |
| **Component / Feature (DOM)** | `@nuxt/test-utils/runtime` (`mountSuspended` / `renderSuspended`) | `ts<br>const wrapper = await mountSuspended(() => import('~/pages/login.vue'), { route: '/login' })<br>await user.type(wrapper.get('input[name=email]'), 'taro@example.com')<br>` |
| **Browser Feature**           | Vitest Browser Mode + Playwright provider                         | `ts<br>// @vitest-environment jsdom<br>await renderSuspended(() => import('~/pages/editor.vue'))<br>await page.dragAndDrop('#item', '#trash')<br>`                                |
| **E2E**                       | Playwright test runner                                            | `ts<br>await page.goto(process.env.STAGING_BASE_URL)<br>await page.fill('[name=password]', 'hunter2')<br>await expect(page).toHaveURL('/dashboard')<br>`                          |

### MSW と “実 API” の切り分け

1. **Unit〜Feature では MSW を必ず使用**

   - 依存 API が多いほどテストが速く安定。
   - ハンドラは `tests/mocks/handlers.ts` に集約し、開発中 `nuxt dev` でも共有。
   - ページ／DOMテストで API 呼び出しを伴う場合は、まず `features/<feature>/repositories/*` をモックする（ネットワーク依存を避ける）。MSW は Repository 直下の通信が必要なケースのみ使用。

2. **Browser Feature も基本 MSW**

   - 実ブラウザでもネットワーク変動の要因を排除できる。

3. **E2E だけ実 API**
   - ステージング環境 + リセット可能な DB で “スモーク + 主要業務フロー” のみカバー。
   - 外部 SaaS／決済など副作用の大きいものは MSW か専用サンドボックスを利用。

> API–フロント間の契約ずれを CI で検知したい場合は **Pact などの契約テスト** を別ジョブに置くと E2E を肥大化させずに済む。

### 実運用でのワークフロー

1. **プッシュ / PR 時**

   - Unit + DOM Feature（数百〜千件）を並列実行 → 3–4 分以内を目標

2. **main ブランチマージ時**

   - Browser Feature を含むスイートを nightly 実行

3. **リリース前**
   - ステージング環境で E2E（本番相当 artefact + seeded DB）を実行

### ユニットテスト

#### 基本方針

- **コロケーション**を意識し、テスト対象に近い場所で管理する
- テスト対象ファイルと同階層に `__tests__/[ファイル名].test.ts` を作成する
- vitestのテストコードを記述する際、describe/testの名前は**日本語**で記述する
- **Parameterized test**での記述が望ましい場合は積極的に利用する
- `it('テスト名')` よりも `test('テスト名')` を利用する（日本語でテスト名を記述する場合testの方が自然なため）
- **アサーションルーレット**（複数のアサーションを連続で実行すること）を避け、単一のアサーションで検証する

#### テスト例

```typescript
// utils/formatDate.test.ts
describe('formatDate', () => {
  test.each([
    ['2023-01-01', 'YYYY/MM/DD', '2023/01/01'],
    ['2023-12-31', 'YYYY年MM月DD日', '2023年12月31日'],
    [null, 'YYYY/MM/DD', ''],
    [undefined, 'YYYY/MM/DD', ''],
  ])('日付フォーマット: %s を %s 形式で変換', (input, format, expected) => {
    expect(formatDate(input, format)).toBe(expected);
  });

  test('不正な日付文字列の場合はエラーをスローする', () => {
    expect(() => formatDate('invalid-date', 'YYYY/MM/DD')).toThrow();
  });
});
```

#### アサーションルーレットの回避

**問題点**

アサーションルーレット（Assertion Roulette）とは、1つのテストケースで複数の独立したアサーションを連続実行することです。これは以下の問題を引き起こします：

- **失敗の原因特定が困難**: どのアサーションが失敗したかが分かりにくい
- **テストの意図が不明確**: 何を検証したいのかが曖昧になる
- **部分的な成功の隠蔽**: 最初のアサーションが失敗すると後続が実行されない

**❌ 悪い例: アサーションルーレット**

```typescript
test('ユーザー情報が正常に取得できる', async () => {
  const user = await userService.getUser('123');

  // 複数の独立したアサーションを連続実行
  expect(user.id).toBe('123');
  expect(user.name).toBe('田中太郎');
  expect(user.email).toBe('tanaka@example.com');
  expect(user.createdAt).toBe('2024-01-01T00:00:00Z');
  // → どのアサーションが失敗したか分かりにくい
});

test('リポジトリリストの検証', async () => {
  const repositories = await githubService.getWatchedRepositories('user');

  // 同じ対象への複数アサーション
  expect(repositories).toHaveLength(3);
  expect(repositories).toEqual(expectedRepositories); // ← これで十分
  expect(repositories[0].name).toBe('repo-1'); // ← 冗長
  expect(repositories[1].name).toBe('repo-2'); // ← 冗長
  expect(repositories[2].name).toBe('repo-3'); // ← 冗長
});
```

**✅ 推奨: 単一アサーションによる包括的検証**

```typescript
test('ユーザー情報が正常に取得できる', async () => {
  const user = await userService.getUser('123');

  // 1つのアサーションで全体を検証
  expect(user).toEqual({
    id: '123',
    name: '田中太郎',
    email: 'tanaka@example.com',
    createdAt: '2024-01-01T00:00:00Z',
  });
});

test('リポジトリリストの検証', async () => {
  const repositories = await githubService.getWatchedRepositories('user');

  // 期待値との完全一致で検証（長さも内容も同時にチェック）
  expect(repositories).toEqual(expectedRepositories);
});

test('特定プロパティのみの検証が必要な場合', async () => {
  const repository = await githubService.getRepositoryDetails('owner', 'repo');

  // 検証したいプロパティのみを抽出してオブジェクト化
  expect({
    name: repository.name,
    fullName: repository.fullName,
    ownerLogin: repository.owner.login,
  }).toEqual({
    name: 'repo',
    fullName: 'owner/repo',
    ownerLogin: 'owner',
  });
});
```

**例外的に複数アサーションが許容される場合**

以下の場合は複数アサーションも検討可能ですが、可能な限り単一アサーションを目指します：

```typescript
test('大量データの境界値検証', async () => {
  const repositories = await githubService.getWatchedRepositories('user');

  // 長さチェック（パフォーマンステスト的側面）
  expect(repositories).toHaveLength(100);

  // 境界値の個別検証（長さとは独立した検証）
  expect({ firstId: repositories[0].id, lastId: repositories[99].id }).toEqual({
    firstId: 1,
    lastId: 100,
  });
});
```

#### 境界値テスト

以下の境界値を必ず検証する：

- **Null/Undefined**: 未定義値の処理
- **空文字列/空配列**: 空のデータの処理
- **最小/最大値**: 数値の範囲外値
- **不正な型**: 期待しない型の入力

### フィーチャーテスト

#### 基本方針

- **コロケーション**を意識し、テスト対象に近い場所で管理する
- テスト対象ページと同階層に `__tests__/[ページ名].test.ts` を作成する

### E2Eテスト

#### Playwright実装

**設定・構成**

- `packages/frontend/tests`配下にテストファイルを配置
  - **暫定。今後backend APIの開発が進むと見直しが必要になる可能性がある**

### テストデータ管理

**データ分離戦略**

- **ユニットテスト**: モックデータ、インメモリ状態
- **フィーチャーテスト**: テスト用ファイクスチャ、リセット可能な状態
- **E2Eテスト**: 専用テスト環境、シードデータ

**テストデータ原則**

- 各テストは独立実行可能
- テスト間でのデータ依存を排除
- 実行順序に依存しない設計

#### 継続的改善

**メトリクス監視**

- テストカバレッジの測定と維持
- テスト実行時間の最適化
- 失敗率とその原因分析

**レビュープロセス**

- 月次テスト戦略レビュー
- 新機能開発時のテスト設計レビュー
- テストコード品質の継続的改善

## 考慮した選択肢

### レイヤーごとの比率をどうするか

AIエージェントを利用する場合に、E2Eテストの問題の解消など実装から離れた場所で起きるエラーへの対処が苦手そうに見える傾向があった。
人力でテストを保守する場合ユニットテストを保守することが時間・労力的に難しかったが、
AIでコードを書く場合この部分が保守可能になる可能性があるので、ユニットテストを分厚くすることを試してみる。

フィーチャーテストは引き続きデグレの検出に効果があるため実装する。

E2Eテストに関しても、ざっくりと実装することはAIにより可能であるため、数を絞って導入する。

## 結果・影響

## 参考資料

- [認証に関するテスト戦略](../../../docs/adr/ADR001-auth.md#testing-strategy)
- [@nuxt/test-utils公式ドキュメント](https://nuxt.com/docs/getting-started/testing)

- [Testing · Get Started with Nuxt v3](https://nuxt.com/docs/getting-started/testing)  
  └─ `@nuxt/test-utils` の基本的な使い方（mountSuspended, renderSuspended など）

- [Browser Mode | Vitest Guide](https://vitest.dev/guide/browser/)  
  └─ Vitest Browser Mode と Playwright/WebdriverIO プロバイダーの概要

- [Reliable Component Testing with Vitest's Browser Mode](https://mayashavin.com/articles/component-testing-browser-vitest)  
  └─ Vitest Browser Mode を用いた実ブラウザコンポーネントテストの実践記事

- [Mock Service Worker (MSW) 公式サイト](https://mswjs.io/)  
  └─ ブラウザ / Node 共通で API をスタブできるモッキングライブラリ

- [Testing Library ― Full Example（MSW 推奨箇所）](https://testing-library.com/docs/react-testing-library/example-intro/)  
  └─ Testing Library 公式が MSW を推奨しているセクション

- [Just Say No to More End-to-End Tests — Google Testing Blog](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html)  
  └─ テストピラミッドと「70/20/10」比率の由来
