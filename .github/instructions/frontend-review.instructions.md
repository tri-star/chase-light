---
applyTo: "packages/frontend/**"
---

# レビュー方針ガイド

## 全般

- **レビューコメントは日本語で書いてください。**
- 設計における決定事項として以下を参照してください。
  - 認証処理: `docs/adr/ADR001-auth.md`
  - アプリケーションの環境判定: `docs/adr/ADR002-app-stage-env.md`

## packages/frontend固有の方針

packages/frontend 以下のコードは以下を意識する必要があります。

- フォルダ構造ガイドライン: `packages/frontend/docs/guidelines/folder-structure.md`
- コンポーネント設計ガイドライン: `packages/frontend/docs/guidelines/component-implementation-guide.md`
- ページ実装ガイドライン: `packages/frontend/docs/guidelines/page-implementation-guide.md`
- ファイル命名規則: `packages/frontend/docs/guidelines/file-naming-conventions.md`
- API実装ガイドライン: `packages/frontend/docs/guidelines/api-implementation-guide.md`
- テスト戦略: `packages/frontend/docs/testing-strategy.md`
