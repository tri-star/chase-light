# 参考ドキュメント

必要に応じて以下のファイルを参照してください。

- Task Master の開発ワークフローや全体的な流れを知りたい場合

  - @.github/instructions/rules/dev_workflow.instructions.md

- Markdown ルールやルールファイルの書き方・記法例

  - @.github/instructions/rules/roo_rules.instructions.md

- コードパターンやルールの継続的改善、ルール追加・更新の基準

  - @.github/instructions/rules/self_improve.instructions.md

- Taskmaster ツールや CLI コマンドの詳細リファレンス、初期化・PRD パース・AI モデル設定など

  - @.github/instructions/rules/taskmaster.instructions.md

- 各種モードの役割・行動指針（状況に応じて以下を参照してください）
  - 設計やアーキテクチャの検討・計画を行うとき
    - @.github/instructions/rules-architect/architect-rules.instructions.md
  - 技術的な質問や情報収集、説明が必要なとき
    - @.github/instructions/rules-ask/ask-rules.instructions.md
  - 複雑なタスクの分解やワークフロー全体の調整・進行管理を行うとき
    - @.github/instructions/rules-boomerang/boomerang-rules.instructions.md
  - 実装やコマンド実行など、具体的な作業・コード変更を行うとき
    - @.github/instructions/rules-code/code-rules.instructions.md
  - バグ調査や原因分析など、デバッグ作業を行うとき
    - @.github/instructions/rules-debug/debug-rules.instructions.md
  - テストの実行やテスト関連の作業を行うとき
    - @.github/instructions/rules-test/test-rules.instructions.md

# Git コミット時の注意点

GIT_COMMIT_AUTHOR_NAME, GIT_COMMIT_AUTHOR_EMAIL, GIT_COMMIT_COMMITTER_NAME, GIT_COMMIT_COMMITTER_EMAIL を Claude Code としてコミットしてください。
また、日本語でコミットメッセージを書いてください。

# 開発コマンド一覧

このリポジトリで開発作業時に使用するコマンドをまとめています。

## 全体共通

### プロジェクト全体のビルド・テスト・リント

```bash
# 全パッケージのビルド
pnpm build

# frontendのテストのみ実行
pnpm test

# 全パッケージのリント
pnpm lint

# 全パッケージの型チェック
pnpm lint:type

# 全パッケージのフォーマット修正
pnpm lint:fix

# 全パッケージのフォーマット（書き込み）
pnpm format

# 全パッケージのフォーマットチェック
pnpm format:check
```

### 特定パッケージに対する操作

```bash
# frontendとbackendの両方でテスト実行
pnpm --filter "{frontend,backend}" test

# 特定パッケージでのコマンド実行
pnpm --filter frontend [コマンド]
pnpm --filter backend [コマンド]
pnpm --filter shared [コマンド]
```

## Frontend作業時

### 開発サーバー

```bash
# 開発サーバー起動
pnpm dev:frontend
# または
pnpm --filter frontend dev
```

### ビルド・プレビュー

```bash
# ビルド
pnpm --filter frontend build

# 静的サイト生成
pnpm --filter frontend generate

# プレビュー
pnpm --filter frontend preview
```

### テスト

```bash
# ユニットテスト実行
pnpm --filter frontend test

# E2Eテスト実行
pnpm --filter frontend test:e2e

# E2EテストUI表示
pnpm --filter frontend test:e2e:ui

# E2Eテストデバッグ
pnpm --filter frontend test:e2e:debug

# E2Eテストレポート表示
pnpm --filter frontend test:e2e:report

# Playwright依存関係インストール
pnpm --filter frontend test:e2e:install
```

### リント・フォーマット

```bash
# リント
pnpm --filter frontend lint

# 型チェック
pnpm --filter frontend lint:type

# フォーマット修正
pnpm --filter frontend format
```

### Storybook

```bash
# Storybook開発サーバー起動
pnpm --filter frontend storybook

# Storybookビルド
pnpm --filter frontend build-storybook
```

## Backend作業時

### 開発サーバー

```bash
# 開発サーバー起動
pnpm dev:backend
# または
pnpm --filter backend dev
```

### ビルド・デプロイ

```bash
# ビルド
pnpm --filter backend build

# Lambdaパッケージ作成
pnpm --filter backend zip

# Lambda関数更新
pnpm --filter backend update

# ビルド〜デプロイ一連の流れ
pnpm --filter backend deploy
```

### リント・フォーマット

```bash
# リント
pnpm --filter backend lint

# 型チェック
pnpm --filter backend lint:type

# フォーマット修正
pnpm --filter backend format
```

## 注意事項

- `backend`パッケージには現在testスクリプトが定義されていません
- `shared`パッケージが存在する前提でリントコマンドが設定されています
- AWS CLIが設定済みの環境でないとbackendのデプロイコマンドは失敗します
- Playwright使用前は `test:e2e:install` でブラウザをインストールする必要があります
