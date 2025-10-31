---
allowed-tools: Bash(ls:*),Bash(find:*),Bash(rg:*),Bash(cat:*),Bash(mkdir:*),Bash(touch:*),Bash(gh run list:*),Bash(gh run view:*),Bash(gh pr list:*),Bash(gh pr view:*),Bash(gh repo view:*),Bash(gh api:*),Bash(pnpm lint),Bash(pnpm format),Bash(pnpm test),Bash(pnpm --filter backend lint),Bash(pnpm --filter backend test),Bash(pnpm --filter backend format),Bash(pnpm --filter backend test src/*),mcp__context7__resolve-library-id,mcp__context7__get-library-docs,mcp__plane__create_issue,mcp__plane__get_projects,mcp__plane__update_issue,mcp__deepwiki__ask_question,mcp__plane__get_issue_using_readable_identifier,mcp__github__get_pull_request_comments,mcp__github__get_pull_request,WebFetch(domain:localhost),WebFetch(domain:github.com),Read(packages/frontend/**),Read(docs/**),Read(docs/**),Edit(packages/frontend/**)
description: "frontend:Implementフェーズ"
---

## 指示概要

これから、事前に作成したSOWを元に作業を開始してください。

**このフェーズでは実装を進めますが、SOWに含まれていない作業は行わないように気を付けてください。**

作業は以下の順序で進めてください。

- [ ] 1. プロジェクトの概要把握
- [ ] 2. API仕様書と設計指針の把握
- [ ] 3. 既存のコードの実装を把握
- [ ] 4. 実装計画の記録
- [ ] 5. 実装
- [ ] 6. 実装結果の記録
- [ ] 7. Lint, Format, Test

### 1. プロジェクトの概要把握

@docs/project-overview.md

### 2. DBの構造と設計指針の把握

- API仕様書: @packages/backend/openapi.json を参照
- 既存のAPI実装： packages/frontend/server/api 配下の各種ファイル
- 設計指針: @packages/frontend/docs/guidelines/api-implementation-guide.md

### 3. 既存のコードの実装を把握

- フォルダ構成: @packages/frontend/docs/guidelines/folder-structure.md
- 命名規則: @packages/frontend/docs/guidelines/file-naming-conventions.md
- テスト戦略: @packages/frontend/docs/testing-strategy.md
- API実装ガイドライン: @packages/frontend/docs/guidelines/api-implementation-guide.md
- コンポーネント実装ガイドライン: @packages/frontend/docs/guidelines/component-implementation-guide.md
- ページ実装ガイドライン: @packages/frontend/docs/guidelines/page-implementation-guide.md
- デザイントークン（Tailwindユーティリティ）: @packages/frontend/docs/design/tailwind-utilities.json

上記の方針で実装した既存コードは以下を参照

- ルーティング/ページ実装例（`definePageMeta`・認証ミドルウェア）
  - @packages/frontend/pages/dashboard.vue
  - @packages/frontend/pages/profile.vue
  - @packages/frontend/pages/auth/login.vue
- BFF + Zod検証の実装例
  - @packages/frontend/server/api/data-sources/index.get.ts
  - @packages/frontend/server/api/data-sources/index.post.ts
- MSWモック（Orval生成物）
  - @packages/frontend/generated/api/backend.msw.ts

### 4. 実装計画の記録

以下はユーザーからの指示です。

<user-instruction>
$ARGUMENTS
</user-instruction>

この中に、以下の情報が含まれているはずです。

- SOWのパス: SOWのパスが不明な場合は、ユーザーに尋ねてください。
- 作業ログのパス: 作業ログのパスは指示されない可能性もあるので、含まれていない場合は `docs/task-logs/[issue番号]/[YYYYMMDD]-[nn]-log.md` としてください。
  - `[nn]` 部分は既存と重複しない連番
  - 例: `docs/task-logs/CHASE-1/20231001-01-log.md`

SOWを特定したら、以下の手順で作業を進めます。

- 1. SOWの内容を確認し、実装計画を立てる
- 2. 作業が複数セッションに分かれる可能性を考慮し、 作業ログ `[YYYYMMDD]-[nn]-log.md` に実装計画を記録する
  - 作業のチェックリストを含め、「どの作業が完了しているか、途中か」が分かるようにする
  - どのファイルにどんな実装を行うか

### 5. 実装

SOWの各フェーズ毎に以下を行ってください。
(作業フェーズ毎に作業ログを更新、Lint/Format/Test/コミットを行う)

#### 5-1. 作業結果の記録

- SOWと作業ログ(`docs/task-logs/[issue番号]/[YYYYMMDD]-[nn]-log.md`)に基づいて実装を進めます。
- 作業中にユーザーとの議論が発生した場合は、その結論を作業ログに記録します。

#### 5-2. 作業結果の記録

実装が完了したら、作業ログを更新します。
この時、今回の作業に懸念事項(エラーが残っている、理由があり未実装)がある場合はその点も作業ログに記録します。

#### 5-3. Lint, Format, Test

pnpm lint, pnpm format, pnpm test を実行し、エラーが残っていないことを確認します。
エラーが発生した場合はこのタイミングで修正を試みます。

- **複雑な原因のエラーが発生している可能性もあるので、全てのエラーが解消している必要はありません**
- **1つのエラーについて2回修正を試みても解消しない場合、それ以上修正を行おうとせず先に進んでください**

#### 5-4. コミット

今回の作業の内容をまとめたコミットを作成します。

- 現在の作業にCHASE-XXXの課題番号がある場合、ブランチ名が `eature/CHASE-XXX` を含んでいることを確認してください。
  - 含んでいない場合は、`feature/CHASE-<課題番号>` で始まるブランチを作成してからコミットしてください。

### 6. push, PR作成

全ての作業が終わったら、push, PR作成を行います。
