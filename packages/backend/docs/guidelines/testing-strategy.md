# Backend テスト戦略

このドキュメントは `backend` パッケージにおけるテストの基本方針とレイヤー別の実践を定義します。最新のディレクトリ構成（`domain` / `application` / `presentation` / `workers` / `infra`）に基づき、フィーチャー単位でテストをコロケーションさせます。`src/features/detection/workers` 配下がワーカーのテスト例です。

## 1. テストの基本方針

### 境界テスト（Component Test）を最優先

- **対象:** Hono ルート（`presentation/routes`）や Lambda ハンドラー（`workers/*/handler.ts`）。
- **目的:** ユースケースとインフラ実装を実際に組み合わせ、DB や外部アダプタを含む振る舞いを検証します。
- **特徴:** DB には実際のテスト用接続を使用し、外部サービスはスタブ／モックアダプタに差し替えます。
- **例:** `packages/backend/src/features/detection/workers/detect-datasource-updates/__tests__/handler.test.ts`

### ユニットテストの位置づけ

- **対象:** ドメインロジックやユースケース（`application/use-cases`）。
- **利用場面:** ドメインルールが複雑な場合、境界テストで網羅しづらいエッジケース、外部依存をモックしたい場合。
- **例:** 新規ユースケースを追加する際は、ポートをモックしてユースケース単体の振る舞いを検証します。

### コロケーション原則

- テストコードは対象ファイルと同じディレクトリに `__tests__` を作成して配置します。
- テストファイル名は対象ファイルに対応させて `*.test.ts` を用います。

## 2. テストの種類

### Component Test（HTTP API）

- Hono ルートを起動し、実際のエンドポイントに対して HTTP リクエストを発行します。
- DB アクセスは `TransactionManager` と `setupComponentTest()` を用いて初期化・クリーンアップします。
- 外部APIは `infra/adapters` のスタブを DI で差し替え、実運用と同じシリアライゼーションを保ちます。

### Component Test（Worker）

- Lambda ハンドラーを直接呼び出し、StepFunctions やキューから渡されるイベントを再現します。
- ハンドラー内で初期化されるアダプタをテスト用に差し替える場合は、スタブファクトリや依存注入ポイントを用意してください（例: `stub-github-activity.gateway.ts`）。

### Unit Test

- ユースケースはポートをモックし、ドメインイベントや例外処理を精緻に検証します。
- ドメイン層の純関数は副作用がないため、テーブルドリブンテストでカバレッジを確保します。

## 3. 使用ツール

- **テストランナー:** `vitest`
- **コンポーネントテスト補助:** `setupComponentTest()`（DB初期化, 擬似HTTP）
- **テストデータ生成:** `drizzle-seed`

## 4. 実装ガイドライン

### 共通ルール

- テスト名 (`describe` / `it` / `test`) は挙動が分かる日本語で記述します。
- 非同期テストでは `await` を忘れずに使用し、タイムアウトやリトライはアダプタ側で制御します。
- マジックナンバーやエラーメッセージは本体と同様に `constants/` から参照します。

### DB を扱うテスト

```typescript
import { setupComponentTest } from "../../../../test-utils/component-test-setup";

describe("detect-datasource-updates", () => {
  setupComponentTest();

  // テストケース...
});
```

- `setupComponentTest()` はテスト用 DB のセットアップとクリーンアップ、環境変数の注入を行います。
- トランザクション内で実行するハンドラーは、テストでも同じ呼び出しフローを再現します。

### モックとスタブ

- GitHub などの外部 API は `infra/adapters` に配置したスタブクラスを使用します。
- Drizzle リポジトリの例外シナリオは `vi.spyOn` などでエラーを注入します。
- 例外時のログ出力を検証する場合は、`vi.spyOn(console, "error")` を活用してください。

## 5. 開発フローとテスト実行

1. **仕様策定:** ユースケースの入出力とポートの契約を決め、必要な定数やエンティティを整備する。
2. **テスト先行:** 入出力境界からテストを書き、ユースケースとアダプタの期待値を固定する。
3. **実装:** ユースケース → アダプタ → プレゼンテーション／ワーカーの順で実装し、テストを段階的に緑にする。
4. **回帰確認:** `pnpm --filter backend test` を実行し、関連フィーチャーのコンポーネントテストが通ることを確認する。

```bash
# backend パッケージ全体のテスト
pnpm --filter backend test

# 特定フィーチャー配下のみを実行（例: detection）
pnpm --filter backend test src/features/detection
```

## チェックリスト

- [ ] 対象ファイルと同じ階層に `__tests__` を配置している
- [ ] コンポーネントテストでユースケースとアダプタの組み合わせを検証している
- [ ] 外部サービスはスタブまたはモックで差し替え、シナリオごとの挙動を確認している
- [ ] 新規ユースケースのドメインルールにユニットテストを用意している
- [ ] テストで使用する定数やエラーメッセージは本体と同一のソースから import している
