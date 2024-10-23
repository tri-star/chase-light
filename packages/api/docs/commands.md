# コマンド関連

## デプロイ

- prisma/schema.prisma ファイルの client の output 設定をコメント解除

```diff
  // NOTE: デプロイ時はコメント解除が必要
- // output          = "../node_modules/.prisma/client"
+ output          = "../node_modules/.prisma/client"
```

- `pnpm prisma generate`
- `aws sso login`
- `AWS_PROFILE=xxx pnpx serverless deploy`
- prisma/schema.prisma ファイルを元に戻す

## マイグレーション

```bash
pnpm prisma migrate dev
```
