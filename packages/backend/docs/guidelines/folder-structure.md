# フォルダ構成ガイドライン

## 概要

`packages/backend` はフィーチャー単位の境界づけられたコンテキストで構成します。`src` 配下では、各コンテキストがドメイン〜アプリケーション〜入出力層を縦方向に閉じ、共有したい最小限の基盤コードだけを `core` に集約します。`packages/backend/src/features/detection` が最新方針のリファレンス実装です。

```
src
├── core/                 # backend固有の共有カーネル（設定/DB/イベント/共通ユーティリティ）
├── features/             # 境界づけられたコンテキストごとの実装
│   ├── identity/
│   ├── detection/
│   └── ...
└── shared/               # 過渡的な共有実装（段階的にcoreへ移行中）
```

## features/<feature>

境界づけられたコンテキストは `features/<feature>` に作成し、以下のレイヤー構造と依存ルールを守ります。`detection` フィーチャーの例を示します。

```
features/detection/
├── domain/
│   ├── activity.ts  # エンティティの型、値オブジェクト、定数、ドメインサービスなど
│   ├── detection-job.ts
│   ├── detect-target.ts
│   └── repositories/
│       ├── activity.repository.ts  # Portとしてのリポジトリのインターフェース定義
│       └── detect-target.repository.ts
├── application/
│   ├── ports/   # 外部サービスの呼び出しを伴うアダプターのPort定義
│   │   ├── github-activity.gateway.ts
│   │   └── translation.port.ts
│   └── use-cases/
│       ├── detect-update.use-case.ts
│       └── process-updates.use-case.ts
├── infra/
│   ├── adapters/
│   │   ├── github-activity/
│   │   │   ├── github-activity.gateway.ts
│   │   │   ├── github-activity-gateway.factory.ts
│   │   │   └── stub-github-activity.gateway.ts
│   │   └── translation/
│   │       ├── translation.adapter.ts
│   │       └── stub-translation.adapter.ts
│   └── repositories/
│       ├── drizzle-activity.repository.ts
│       └── drizzle-detect-target.repository.ts
├── presentation/ # HTTPエンドポイントがある場合のみ配置
│   ├── schemas/
│   └── routes/
├── workers/  # StepFunctions/Lambdaなどのワーカー関数がある場合のみ配置
│   └── detect-datasource-updates/
│       ├── handler.ts
│       └── __tests__/handler.test.ts
├── constants/ # ドメインに依存しない定数の置き場所()
│   └── detection.constants.ts
└── index.ts  # 他フィーチャーへ公開するユースケースやアダプタをまとめる
```

### レイヤーの責務と依存ルール

- **domain/**
  - エンティティ、値オブジェクト、ドメインサービス、定数（ドメインに閉じたもの）を定義します。
  - `Brand` 型などのID表現を活用し、外部とやり取りする型を明示することを推奨します。
  - 他レイヤーに依存しません。
- **domain/repositories/**
  - リポジトリやドメインイベントのインターフェースを定義します。
  - アプリケーション層から実装を切り替えられるよう、境界にポートを置きます。
- **application/use-cases/**
  - ドメインのユースケースをクラスまたは純関数で実装します。
  - 依存できるのは同一フィーチャーの `domain` と `application/ports/` に限ります。
  - 外部フィーチャーを呼び出す場合は、対象フィーチャーの `index.ts` で公開されたAPIにのみ依存します。
- **application/ports/**
  - 外部システム（GitHub、翻訳サービスなど）とのやり取りを抽象化するポートを定義します。
  - 呼び出し元（ユースケース）から見た入出力契約のみを記述し、実装は `infra` に閉じます。
- **presentation/**
  - Honoのルート、OpenAPI定義などAPI公開層を配置します。
  - 入力検証やHTTP固有の表現はここで完結させ、アプリケーション層へはユースケース呼び出しのみを委譲します。
- **workers/**
  - Lambda/StepFunctions/SQSなどのバッチ・非同期処理のエントリポイントを配置します。
  - 各ワーカーは `handler.ts` を持ち、内部でユースケースやポートを組み立てます。
- **infra/**
  - Drizzleリポジトリや外部APIアダプタなど、ポートの具体実装を配置します。
  - 実装は `core` のDB/TX/utilと外部ライブラリのみを利用し、他フィーチャーの詳細には依存しません。
  - アダプタ固有の依存（Octokitなど）はアダプタディレクトリに閉じ込めます。
- **index.ts**
  - フィーチャー外へ公開したいユースケースやアダプタをまとめる入口です。他フィーチャーが依存できるのはこのファイルで明示的に公開されたものだけです。

### コンテキスト間の依存

- フィーチャー同士は原則として独立し、他フィーチャーのエンティティに直接依存しません。横断的なモデルを共有したい場合は「正規定義を単一コンテキストに置き、外部ではIDやイベントで参照する」ルールを守ります。
- どうしても別フィーチャーの振る舞いが必要な場合は、対象フィーチャーの `index.ts` で公開されているユースケース／アダプタのみを利用します。戻り値は自コンテキストの表現へ変換し、内部に取り込まないまま直接利用しないようにします。

## core/

`core` はバックエンド専用の共有カーネルです。設定の読み込み、DB接続、トランザクション管理、イベントバス・ロガーなど、全フィーチャーから利用するインフラストラクチャを配置します。フィーチャー層から `core` への依存は許可されますが、`core` からフィーチャーへ依存することはありません。

```
core/
├── config/
├── db/
├── events/
└── utils/
```

## shared/

`shared` には `core` に置くことが妥当ではないものの、複数フィーチャーで共有される定数、ユーティリティ関数を配置します。

例： GitHub APIのエラーハンドリングやエラー型

## packages/shared との関係

`packages/shared` にはフロントエンドとバックエンドの双方で安定して共有できる契約（DTO、イベント、ユーティリティ関数）だけを配置します。バックエンド内で完結する型やドメインロジックは、必ず各フィーチャーやfeatures/shared配下に置きます。
