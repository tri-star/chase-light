# ESLint, Biome, Prettier 導入タスクリスト

## 概要
プロジェクトにLintとFormatツールを導入する作業計画

### 対象パッケージと使用ツール
- **packages/frontend** (Nuxt.js): ESLint (組み込み) + Prettier
- **packages/backend** (Hono+TypeScript): ESLint + Biome  
- **packages/shared** (TypeScript): ESLint + Biome

## タスクリスト

### 高優先度
- [ ] 1. プロジェクト全体の設定ファイル作成・更新 (進行中)
- [ ] 2. ルートpackage.jsonにdevDependenciesとscriptsを追加
- [ ] 8. 設定動作確認とテスト実行

### 中優先度
- [ ] 3. packages/frontend用のPrettier設定とESLint調整
- [ ] 4. packages/backend用のBiome設定とESLint設定
- [ ] 5. packages/shared用のBiome設定とESLint設定
- [ ] 6. 各パッケージのpackage.jsonにscriptsを追加
- [x] 9. TODOリストを/task.mdに書き出し (完了)

### 低優先度
- [ ] 7. VSCode設定ファイル（.vscode/settings.json）の作成

## 詳細仕様

### 必要なパッケージ
- ESLint関連: eslint, @typescript-eslint/parser, @typescript-eslint/eslint-plugin
- Biome: @biomejs/biome
- Prettier関連: prettier, eslint-config-prettier, eslint-plugin-prettier

### 作成予定ファイル
- ルートレベル: eslint.config.mjs (既存), biome.json
- frontend: .prettierrc, .prettierignore
- backend: 個別設定ファイル（必要に応じて）
- shared: 個別設定ファイル（必要に応じて）
- .vscode/settings.json

### スクリプト追加予定
- lint: 各パッケージでのLint実行
- format: 各パッケージでのFormat実行
- lint:fix: Lintエラーの自動修正
- format:check: フォーマットチェック