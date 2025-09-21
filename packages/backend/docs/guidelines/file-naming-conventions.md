# ファイル命名規則

## 概要

`packages/backend` ではフィーチャー単位のディレクトリ構成を採用しています。ファイル名は責務と境界を示す重要なメタデータであり、命名規則を揃えることでコード探索とレビューを容易にします。`src/features/detection` は最新ルールを反映した参照実装です。

## 共通ルール

- 形式は原則として `kebab-case` を用います（`detect-update.use-case.ts` など）。
- 予約語との衝突を避け、意味のある英単語を使用します。
- テストファイルはターゲットと同じディレクトリに `__tests__` を作成し、`*.test.ts` で命名します。

## レイヤー別の命名指針

### domain/

- エンティティや値オブジェクトは概念を単数形で表現します。
  - 例: `activity.ts`, `detect-target.ts`
- IDのブランド化関数は `to<Entity>NameId` の形で定義します（`toDetectTargetId`）。
- ドメインサービス・定数を含むファイルも同様に概念ベースで命名します。

### domain/repositories/

- ドメインリポジトリのポートは `[resource].repository.ts` とします。
  - 例: `activity.repository.ts`, `detect-target.repository.ts`
- DTOは `*InputDto` / `*OutputDto` のように用途を明確にします。

### application/use-cases/

- ユースケースは「動詞-名詞」で表現し、`*.use-case.ts` をサフィックスに付与します。
  - 例: `detect-update.use-case.ts`, `process-updates.use-case.ts`

### application/ports/

- 外部システムや他レイヤーとの契約を示すファイルは対象を先頭にし、目的語をサフィックスで表現します。
  - Gateway/Adapter系: `github-activity.gateway.ts`, `some-vendor-activity.messenger.ts`, `some.port.ts`
- 1ファイルに 1 ポートを原則とし、入出力型を併記します。

### infra/repositories/

- 実装クラスは採用している技術スタックを接頭語に付与します。
  - 例: `drizzle-activity.repository.ts`, `drizzle-detect-target.repository.ts`

### infra/adapters/

- サブディレクトリで外部サービスや種別ごとに分け、`[能力]-[役割].gateway.ts` や `[能力].adapter.ts` と命名します。
  - 例: `github-activity/github-activity.gateway.ts`
  - スタブは `stub-*.gateway.ts` / `stub-*.adapter.ts`
- Factory を用意する場合は `*-gateway.factory.ts` のように目的が分かる名前を付けます。

### presentation/

- HTTPルートを提供する場合は以下のように定義します。
  - `routes/` 以下にリソース単位でまとめ、`index.ts` で再エクスポート
    - 例: `routes/data-sources/index.ts`（`GET /data-sources`, `POST /data-sources` に対応）
- スキーマやレスポンス整形専用ファイルは以下のように定義します。
  - `schemas/` 以下に `[resource]-[purpose].schema.ts` などの名前で定義します。

```
- presentation/
  - routes/
    - data-sources/
      - index.ts # API URLと近い形式。 GET /data-sources/, POST /data-sources に対応
    - index.ts # routes配下の各ハンドラー関数を再exportするバレルファイル
  - schemas/
    - detect-target-request.schema.ts
    - detect-target-response.schema.ts
```

### workers/

- ワーカー名のディレクトリを作成し、エントリポイントは `handler.ts` を使用します。
- テストは `__tests__/handler.test.ts` とし、ハンドラーと同一階層に配置します。

```
- workers/
  - process-updates/
    - handler.ts
    - __tests__/
      - handler.test.ts
```

### constants/

- フィーチャー固有の定数は `*.constants.ts` に集約します。
  - 例: `detection.constants.ts`
- 定数オブジェクトは `*_DEFAULTS`, `*_LIMITS`, `*_ERRORS` のように役割ごとに分割します。

## ディレクトリ名

- フィーチャー直下のレイヤーは複数形を用います（`use-cases`, `ports`, `adapters`）。
- Hono ルートやワーカーなど入出力境界は処理単位でディレクトリを切り、概念を表す英語名にします。
- 過渡的な共通コードは `core/` や `shared/` へ移設し、フィーチャー直下へ置かないようにします。
