# Chase Light API クイックスタートガイド

この文書は、Chase Light GitHub API統合の初心者向けガイドです。最小限の設定で素早くAPIを試せるように設計されています。

## 🚀 5分でスタート

### ステップ1: リポジトリクローン

```bash
git clone https://github.com/your-org/chase-light.git
cd chase-light
```

### ステップ2: 依存関係インストール

```bash
# プロジェクト全体の依存関係をインストール
pnpm install
```

### ステップ3: GitHub トークン設定

TODO: OAuth経由で入手したユーザーのトークンを利用するようにする

1. **GitHubトークン取得**:

   - https://github.com/settings/personal-access-tokens にアクセス
   - "Generate new token (classic)" をクリック
   - 必要なスコープを選択:
     - ✅ `public_repo` (パブリックリポジトリアクセス)
     - ✅ `user` (ユーザー情報とwatch済みリポジトリ)
   - トークンをコピー

2. **環境変数設定**:

   ```bash
   # .env.exampleをコピー
   cp packages/backend/.env.example packages/backend/.env

   # .envファイルを編集してトークンを設定
   echo "GITHUB_TOKEN=ghp_your_token_here" >> packages/backend/.env
   ```

### ステップ4: DBセットアップ

```bash
cd packages/backend
docker compose up -d

pnpm db:migrate
```

### ステップ5: サーバー起動

```bash
# バックエンドサーバー起動 (別ターミナル)
pnpm dev:backend

# フロントエンドサーバー起動 (別ターミナル)
pnpm dev:frontend
```

### ステップ6: ブラウザでアクセス

ブラウザで以下にアクセス:

- **フロントエンド**: http://localhost:3000
- **API ドキュメント**: http://localhost:3001/scalar

## 🧪 テスト用ログイン (Auth0バイパス)

ローカルやCIでAuth0を経由せずにテストユーザーで動作確認したい場合は、以下の手順で「テスト用Auth」を有効化します。

1. `.env`（ルート・frontend・backend）に以下の値を設定
   ```env
   TEST_AUTH_ENABLED=true
   TEST_AUTH_SECRET=任意の十分に長い文字列
   TEST_AUTH_AUDIENCE=http://localhost:3001
   TEST_AUTH_ISSUER=http://localhost/test-auth
   ```
2. `packages/backend/scripts/seed.ts` を実行してテストユーザーをDBに投入
   ```bash
    pnpm --filter backend tsx scripts/seed.ts
   ```
3. フロントエンドから `http://localhost:3000/api/auth/test-login` を開くとテストユーザー01でログインします。  
   任意のテストユーザーに切り替えたい場合は `id` クエリを付与します:
   ```
   http://localhost:3000/api/auth/test-login?id=test|test-user-02
   ```

発行されるアクセストークンは `shared` パッケージでHS256署名されており、バックエンドJWTバリデータがAuth0検証失敗時に自動フォールバックします。本番 (`APP_STAGE=prod`) では自動的に無効化されます。

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. 認証エラー (401)

**エラー**: `GITHUB_AUTH_ERROR`

```json
{
  "success": false,
  "error": {
    "code": "GITHUB_AUTH_ERROR",
    "message": "GitHub authentication failed"
  }
}
```

**解決方法**:

```bash
# 1. トークンが設定されているか確認
cat packages/backend/.env | grep GITHUB_TOKEN

# 2. トークンの有効性確認
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user

# 3. 正しいスコープが付与されているか確認
# GitHubのSettings > Personal access tokensで確認
```

#### 2. レート制限エラー (429)

**エラー**: `GITHUB_RATE_LIMIT`

**解決方法**:

- 認証済みトークンを使用する (制限が緩和される)
- リクエスト頻度を調整する
- エラーレスポンスの`resetTime`まで待機する

#### 3. サーバー起動エラー

**エラー**: `Error: listen EADDRINUSE: address already in use :::3001`

**解決方法**:

```bash
# ポートを使用しているプロセスを確認
lsof -i :3001

# プロセスを終了
kill -9 <PID>

# または別のポートを使用
PORT=3002 pnpm dev:backend
```

#### 4. CORS エラー

**エラー**: `Access to fetch at 'http://localhost:3001' from origin 'http://localhost:3000' has been blocked by CORS policy`

**解決方法**:

```bash
# .envファイルでFRONTEND_URLを確認
echo "FRONTEND_URL=http://localhost:3000" >> packages/backend/.env
```

## 📚 次のステップ

基本的な使用方法を理解したら、以下のドキュメントを参照してください:

- [ファイル名命名規則](/packages/backend/docs/file-naming-conventions.md)

## 🆘 サポート

問題が解決しない場合は、以下の方法でサポートを受けられます:

- **GitHub Issues**: バグ報告・機能要望
- **GitHub Discussions**: 質問・相談
- **ドキュメント**: より詳細な情報

---

**ハッピーコーディング！** 🎉
