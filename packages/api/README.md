# ChaseLight API

## ローカル環境

```bash
pnpm install

# ローカルDBの起動
docker compose up -d

pnpx prisma generate
pnpx prisma migrate dev

# aws sso login

pnpm local
```

URL:

- API Reference (Scaler)
  - http://localhost:3001/dev/docs/api

## 手動デプロイ

- [docs/commands.md](docs/commands.md) 参照
