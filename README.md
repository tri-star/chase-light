# Chase Light

## 概要

GitHub リポジトリのリリース、PR, Issue などを監視、興味のある変更を収集し要約を通知するサービス。

## 開発サーバー起動

```bash
export AWS_PROFILE=xxx
# aws sso login
pnpm dev
```

## 開発サーバー起動(スマホ実機確認用)

- VSCodeのポートフォワーディングを利用してlocalhost:3000を公開
- packages/app/.envのURLをVSCodeが発行したURLに置き換え
- Auth0の開発アプリにVSCodeが発行したURLを登録

```bash
export AWS_PROFILE=xxx
# aws sso login

# terminal-1
cd packages/api && pnpm dev

# terminal-2
# https://ja.vite.dev/guide/troubleshooting#dev-containers-vs-code-port-forwarding
cd packages/app && pnpm dev --host=127.0.0.1
```
