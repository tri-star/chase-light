# Storybook バージョン選定（v8 を採用、v9 は保留）

## ステータス

決定済み

## コンテキスト

- フロントエンドの Storybook 依存関係において、v8 と v9 が混在していた（例: `storybook@9.1.3` と `@storybook/addon-essentials@8.6.14` の混在）。
- Storybook は「本体」と「各アドオン」のメジャーバージョンを揃える必要があり、混在は起動・テスト時のエラーを引き起こす。
- 現時点の Nuxt 統合モジュール `@nuxtjs/storybook@8.x` は v8 系に依存しており、v9 とは互換性上の不整合が生じる可能性が高い。
- 目的は以下の2点：
  - Story の `play` 関数を用いたインタラクションテストの自動実行（`@storybook/test`）。
  - Playwright による Storybook `iframe.html` を対象とした VRT（スクリーンショット比較）の確立。
- 既に以下の実装が進んでおり、いずれも v8 で問題なく運用可能：
  - `DashboardPage.stories.ts` に `play` 関数の追加（`@storybook/test` 利用）。
  - `.storybook/main.ts` への `@storybook/addon-interactions` 追加。
  - `playwright.storybook.config.ts` と `tests/storybook/*.spec.ts` による VRT の導入。

## 決定

- 当面は Storybook v8 を採用し、依存関係を v8 系で統一する。
- `@nuxtjs/storybook@8.x` による Nuxt 連携を維持する。
- Story のインタラクションテストは v8 向けの `test-storybook` を用いて実行し、VRT は既存の Playwright 設定を継続利用する。

### バージョン方針（固定推奨）

- `storybook@8.6.14`
- `@storybook/addon-essentials@8.6.14`
- `@storybook/addon-docs@8.6.14`
- `@storybook/addon-interactions@8.6.14`
- `@storybook/test@8.6.14`
- `@storybook/test-runner@^0.19.x`

## 根拠

- v9 はテスト統合（`storybook test`）、起動/ビルドの安定性、Docs/Autodocs の改善など魅力的な利点があるが、
  現時点で `@nuxtjs/storybook@8.x` の v9 前提サポートが明確ではなく、追加検証と構成見直しのコスト・リスクが高い。
- v8 でも `@storybook/test` と `@storybook/addon-interactions` により `play` 関数ベースのインタラクションテストは十分実現でき、
  既に導入済みの VRT もそのまま機能する。
- 当面の目的（Story の自動テストと VRT の安定運用）を最小コストで満たすため、v8 に揃えるのが現実的。

## 結果・影響

- 依存の統一が必要：フロントエンドの `package.json` にて Storybook 本体と各アドオンを v8 に固定する。
- スクリプトの整理：
  - 開発: `storybook dev -p 6006`
  - ビルド: `storybook build`
  - ストーリーテスト（v8）: `test-storybook -c .storybook`（静的ビルドを対象にする場合は `-s storybook-static`）
  - VRT: `playwright test -c playwright.storybook.config.ts`
- 開発者ワークフロー（例）：
  - Storybook 起動: `pnpm --filter frontend storybook`
  - インタラクションテスト: `pnpm --filter frontend test:stories`
  - VRT 初回（ベースライン作成）: `pnpm --filter frontend test:vrt:storybook -- --update-snapshots`
  - VRT 以降: `pnpm --filter frontend test:vrt:storybook`
- トレードオフ：
  - v9 の新機能（統合テスト CLI など）は当面見送る。
  - `@nuxtjs/storybook` の v9 対応状況を継続的にウォッチし、移行価値（速度・安定性・Docs 改善）が十分な時点で再検討する。

## 参考資料

- 記録メモ: `tmp/storybook-version-issue.md`
- 設定・実装の主な参照箇所：
  - `packages/frontend/.storybook/main.ts`
  - `packages/frontend/components/pages/dashboard/DashboardPage.stories.ts`
  - `packages/frontend/playwright.storybook.config.ts`
  - `packages/frontend/tests/storybook/*.spec.ts`

