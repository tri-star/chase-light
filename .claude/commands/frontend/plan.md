---
allowed-tools: Bash(ls:*),Bash(find:*),Bash(rg:*),Bash(cat:*),Bash(gh run list:*),Bash(gh run view:*),Bash(gh pr list:*),Bash(gh pr view:*),Bash(gh repo view:*),Bash(gh api:*),Bash(pnpm lint),Bash(pnpm format),Bash(pnpm test),Bash(pnpm --filter frontend lint),Bash(pnpm --filter frontend test),Bash(pnpm --filter frontend format),Bash(pnpm --filter frontend test src/*),mcp__context7__resolve-library-id,mcp__context7__get-library-docs,mcp__plane__get_projects,mcp__deepwiki__ask_question,mcp__plane__get_issue_using_readable_identifier,mcp__github__get_pull_request_comments,mcp__github__get_pull_request,WebFetch(domain:localhost),WebFetch(domain:github.com),Read(packages/frontend/**),Read(docs/**),Read(docs/**)
description: "bacckend:Planフェーズ"
---

## 指示概要

これから、ユーザーに指示されたタスクを実行することに備え事前の調査、設計を行ってください。

このフェーズでは、ソースコードの変更は行わず、作成した計画を元にSOWを作成、ユーザーにレビューを求める所までを行います。

作業は以下の順序で進めてください。

- [ ] 1. プロジェクトの概要把握
- [ ] 2. API仕様書と設計指針の把握
- [ ] 3. 既存のコードの実装を把握
- [ ] 4. 課題内容の確認
- [ ] 5. 設計
- [ ] 6. SOWの作成

### 1. プロジェクトの概要把握

@docs/project-overview.md

### 2. API仕様書と設計指針の把握

- API仕様書: http://localhost:3001/doc にアクセスしてSwagger JSONを参照
- 既存のAPI実装： packages/frontend/server/api 配下の各種ファイル
- 設計指針: @packages/frontend/docs/guidelines/api-implementation-guide.md

### 3. 既存のコードの実装を把握

- フォルダ構成: TBD
- 命名規則: TBD
- テスト戦略: @packages/frontend/docs/testing-strategy.md
- API実装ガイドライン: @packages/frontend/docs/guidelines/api-implementation-guide.md
- コンポーネント実装ガイドライン: TBD
- ページ実装ガイドライン: TBD

上記の方針で実装した既存コードは以下を参照

TBD

### 4. 課題内容の確認

<issue>
$ARGUMENTS
</issue>

### 5. 設計

ここまでで把握した内容を元に実装計画を立てます。
これには以下のような内容が含まれます。
ここで挙げる以外のものが含まれても構いません。
また、不要な場合は省略しても構いません。
(例：「今回のタスクではDBアクセスは不要なので省略」など)

- どんなURLでAPI、ページを実装するか
- どんなコンポーネントを作成するか
- どんなファイルを作成、更新、参照するか
  - ここまでのフェーズで把握した情報を元に、既存ロジックが流用可能な場合は使うことを検討し、新規で作成が必要な場合はどの場所にどんなファイルを作成するかを検討する。
- 必要になるテストの観点
- 受け入れ基準

### 6. SOWの作成

ここまでで検討した内容を元に、SOWを作成します。
SOWは以下の場所に作成してください。

- docs/sow/[YYYYMMDD-issue番号].md
  - 例:「20231001-CHASE-1.md」

SOWは以下のテンプレートに基づいて作成します。

- `docs/sow/_sow_template.md`

今回のタスクはここまでで、この時点でユーザーにSOWファイルのパスを報告しレビューを依頼してください。
