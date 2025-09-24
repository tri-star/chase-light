---
allowed-tools: Bash(ls:*),Bash(find:*),Bash(rg:*),Bash(cat:*),Bash(mkdir:*),Bash(touch:*),Bash(gh run list:*),Bash(gh run view:*),Bash(gh pr list:*),Bash(gh pr view:*),Bash(gh repo view:*),Bash(gh api:*),Bash(pnpm lint),Bash(pnpm format),Bash(pnpm test),Bash(pnpm --filter backend lint),Bash(pnpm --filter backend test),Bash(pnpm --filter backend format),Bash(pnpm --filter backend test src/*),mcp__context7__resolve-library-id,mcp__context7__get-library-docs,mcp__plane__create_issue,mcp__plane__get_projects,mcp__plane__update_issue,mcp__deepwiki__ask_question,mcp__plane__get_issue_using_readable_identifier,mcp__github__get_pull_request_comments,mcp__github__get_pull_request,WebFetch(domain:localhost),WebFetch(domain:github.com),Read(packages/backend/**),Read(docs/**),Read(docs/**),Edit(packages/backend/**)
description: "bacckend:Implementフェーズ"
---

## 指示概要

これから、事前に作成したSOWを元に作業を開始してください。

**このフェーズでは実装を進めますが、SOWに含まれていない作業は行わないように気を付けてください。**

作業は以下の順序で進めてください。

- [ ] 1. プロジェクトの概要把握
- [ ] 2. DBの構造と設計指針の把握
- [ ] 3. 既存のコードの実装を把握
- [ ] 4. 実装計画の記録
- [ ] 5. 実装
- [ ] 6. 実装結果の記録
- [ ] 7. Lint, Format, Test

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

- SOWと作業ログ(`docs/task-logs/[issue番号]/[YYYYMMDD]-[nn]-log.md`)に基づいて実装を進めます。
- 作業中にユーザーとの議論が発生した場合は、その結論を作業ログに記録します。

### 6. 作業結果の記録

実装が完了したら、作業ログを更新します。
この時、今回の作業に懸念事項(エラーが残っている、理由があり未実装)がある場合はその点も作業ログに記録します。

## 7. Lint, Format, Test

pnpm lint, pnpm format, pnpm test を実行し、エラーが残っていないことを確認します。
エラーが発生した場合はこのタイミングで修正を試みます。

- **複雑な原因のエラーが発生している可能性もあるので、全てのエラーが解消している必要はありません**
- **1つのエラーについて2回修正を試みても解消しない場合、それ以上修正を行おうとせず先に進んでください**
