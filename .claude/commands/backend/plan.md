---
allowed-tools: Bash(ls:*),Bash(find:*),Bash(rg:*),Bash(cat:*),Bash(gh run list:*),Bash(gh run view:*),Bash(gh pr list:*),Bash(gh pr view:*),Bash(gh repo view:*),Bash(gh api:*),Bash(pnpm lint),Bash(pnpm format),Bash(pnpm test),Bash(pnpm --filter backend lint),Bash(pnpm --filter backend test),Bash(pnpm --filter backend format),Bash(pnpm --filter backend test src/*),mcp__context7__resolve-library-id,mcp__context7__get-library-docs,mcp__plane__get_projects,mcp__deepwiki__ask_question,mcp__plane__get_issue_using_readable_identifier,mcp__github__get_pull_request_comments,mcp__github__get_pull_request,WebFetch(domain:localhost),WebFetch(domain:github.com),Read(packages/backend/**),Read(docs/**),Read(docs/**)
description: "bacckend:Planフェーズ"
---

## 指示概要

これから、ユーザーに指示されたタスクを実行することに備え事前の調査、設計を行ってください。

このフェーズでは、ソースコードの変更は行わず、作成した計画を元にSOWを作成、ユーザーにレビューを求める所までを行います。

作業は以下の順序で進めてください。

- [ ] 1. プロジェクトの概要把握
- [ ] 2. DBの構造と設計指針の把握
- [ ] 3. 既存のコードの実装を把握
- [ ] 4. 課題内容の確認
- [ ] 5. 設計

### 1. プロジェクトの概要把握

@docs/project-overview.md

### 2. DBの構造と設計指針の把握

- スキーマ定義: @packages/backend/src/db/schema.ts
- 設計指針: @docs/database-schema-design.md

### 3. 既存のコードの実装を把握

- フォルダ構成: @packages/backend/docs/guidelines/folder-structure.md
- 命名規則: @packages/backend/docs/guidelines/file-naming-conventions.md
- 定数管理方法: @packages/backend/docs/guidelines/constants-management.md
- テスト戦略: @packages/backend/docs/guidelines/testing-strategy.md
- API実装ガイドライン: @packages/backend/docs/guidelines/api-implementation-guide.md

上記の方針で実装した既存コードは以下を参照

- Presentation層(APIルート定義、エンドポイント実装): packages/backend/src/features/data-sources/presentation/routes/data-sources/index.ts
- サービス層： packages/backend/src/features/data-sources/services/data-source-creation.service.ts
  - 外部サービス呼び出し: packages/backend/src/features/data-sources/services/github-api.service.ts
- DBアクセス層： packages/backend/src/features/data-sources/repositories/data-source.repository.ts
- ドメイン層: packages/backend/src/features/data-sources/domain/data-source.ts

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

- どんなURLでAPIを実装するか
- どんなテーブルを作成、更新、参照するか
- どんなファイルを作成、更新、参照するか
  - ここまでのフェーズで把握した情報を元に、既存ロジックが流用可能な場合は使うことを検討し、
    新規で作成が必要な場合はどの場所にどんなファイルを作成するかを検討する。
    - **この時、「サービス層がDBアクセスや外部サービスAPIを直接呼び出している」ようなレイヤーの違反が起きないように注意**
    - 例外的に、ロジックが非常にシンプルな場合はPresentation層が直接Repositoryを呼び出すことは許容されます。
- 必要になるテストの観点
  - Presentation層にはどんなテストを記述するか
  - Presentation層では書きにくいテストがあるので、それはサービス層でモック・スタブを使いテストを実装するかなど
- 受け入れ基準

### 6. SOWの作成

ここまでで検討した内容を元に、SOWを作成します。
SOWは以下の場所に作成してください。

- docs/sow/[YYYYMMDD-issue番号].md
  - 例:「20231001-CHASE-1.md」

SOWは以下のテンプレートに基づいて作成します。

- `docs/sow/_sow_template.md`

今回のタスクはここまでで、この時点でユーザーにSOWファイルのパスを報告しレビューを依頼してください。
