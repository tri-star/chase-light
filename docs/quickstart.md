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

1. **GitHubトークン取得**:

   - https://github.com/settings/personal-access-tokens にアクセス
   - "Generate new token (classic)" をクリック
   - 必要なスコープを選択:
     - ✅ `public_repo` (パブリックリポジトリアクセス)
     - ✅ `user` (ユーザー情報とwatch済みリポジトリ)
   - トークンをコピー

2. **環境変数設定**:

   ```bash
   # バックエンドディレクトリに移動
   cd packages/backend

   # .env.exampleをコピー
   cp .env.example .env

   # .envファイルを編集してトークンを設定
   echo "GITHUB_TOKEN=ghp_your_token_here" >> .env
   ```

### ステップ4: サーバー起動

```bash
# バックエンドサーバー起動 (別ターミナル)
pnpm dev:backend

# フロントエンドサーバー起動 (別ターミナル)
pnpm dev:frontend
```

### ステップ5: APIテスト

ブラウザで以下にアクセス:

- **API ドキュメント**: http://localhost:3001/scalar
- **フロントエンド**: http://localhost:3000

## 📋 基本的なAPI使用例

### 1. Watch済みリポジトリ一覧取得

```bash
curl "http://localhost:3001/api/datasource/repositories/watched"
```

**レスポンス例**:

```json
{
  "success": true,
  "data": [
    {
      "id": 10270250,
      "name": "react",
      "fullName": "facebook/react",
      "description": "The library for web and native user interfaces.",
      "stargazersCount": 228000,
      "forksCount": 46000,
      "language": "JavaScript"
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 30,
    "total": 42,
    "hasNext": true
  }
}
```

### 2. 特定リポジトリの詳細取得

```bash
curl "http://localhost:3001/api/datasource/repositories/facebook/react"
```

### 3. プルリクエスト一覧取得

```bash
curl "http://localhost:3001/api/datasource/repositories/facebook/react/pulls?state=open&sort=updated"
```

## 🌐 JavaScript/TypeScriptでの使用例

### 基本的なFetch使用例

```typescript
// Watch済みリポジトリを取得
async function getWatchedRepositories() {
  try {
    const response = await fetch(
      "http://localhost:3001/api/datasource/repositories/watched"
    );
    const result = await response.json();

    if (result.success) {
      console.log("リポジトリ一覧:", result.data);
      return result.data;
    } else {
      console.error("エラー:", result.error.message);
    }
  } catch (error) {
    console.error("ネットワークエラー:", error);
  }
}

// 実行
getWatchedRepositories();
```

### ページネーション付きの例

```typescript
async function getAllRepositories() {
  const allRepos = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await fetch(
      `http://localhost:3001/api/datasource/repositories/watched?page=${page}&perPage=50`
    );
    const result = await response.json();

    if (result.success) {
      allRepos.push(...result.data);
      hasNext = result.meta.hasNext;
      page++;
    } else {
      throw new Error(result.error.message);
    }
  }

  return allRepos;
}
```

### エラーハンドリング付きの例

```typescript
async function getRepositoryWithErrorHandling(owner: string, repo: string) {
  try {
    const response = await fetch(
      `http://localhost:3001/api/datasource/repositories/${owner}/${repo}`
    );
    const result = await response.json();

    if (!result.success) {
      switch (result.error.code) {
        case "GITHUB_AUTH_ERROR":
          alert("GitHub認証が必要です");
          break;
        case "GITHUB_RATE_LIMIT":
          const resetTime = new Date(result.error.details.resetTime);
          alert(
            `レート制限です。${resetTime.toLocaleTimeString()}に再試行してください。`
          );
          break;
        case "GITHUB_API_ERROR":
          alert(`GitHub APIエラー: ${result.error.message}`);
          break;
        default:
          alert(`エラー: ${result.error.message}`);
      }
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("予期しないエラー:", error);
    alert("ネットワークエラーが発生しました");
    return null;
  }
}
```

## 🎯 よく使うAPIパターン

### パターン1: リポジトリ情報の一括取得

```typescript
async function getRepositorySummary(owner: string, repo: string) {
  const [repository, releases, pulls, issues] = await Promise.all([
    fetch(`/api/datasource/repositories/${owner}/${repo}`).then((r) =>
      r.json()
    ),
    fetch(
      `/api/datasource/repositories/${owner}/${repo}/releases?perPage=5`
    ).then((r) => r.json()),
    fetch(
      `/api/datasource/repositories/${owner}/${repo}/pulls?state=open&perPage=10`
    ).then((r) => r.json()),
    fetch(
      `/api/datasource/repositories/${owner}/${repo}/issues?state=open&perPage=10`
    ).then((r) => r.json()),
  ]);

  return {
    repository: repository.data,
    latestReleases: releases.data,
    openPulls: pulls.data,
    openIssues: issues.data,
  };
}
```

### パターン2: 検索とフィルタリング

```typescript
async function searchRepositoryActivity(
  owner: string,
  repo: string,
  since: Date
) {
  const sinceISOString = since.toISOString();

  const [pulls, issues] = await Promise.all([
    fetch(
      `/api/datasource/repositories/${owner}/${repo}/pulls?state=all&sort=updated&since=${sinceISOString}`
    ).then((r) => r.json()),
    fetch(
      `/api/datasource/repositories/${owner}/${repo}/issues?state=all&sort=updated&since=${sinceISOString}`
    ).then((r) => r.json()),
  ]);

  return {
    recentPulls: pulls.data,
    recentIssues: issues.data,
    totalActivity: pulls.data.length + issues.data.length,
  };
}
```

### パターン3: リアルタイム監視 (ポーリング)

```typescript
class RepositoryMonitor {
  private intervalId: number | null = null;

  startMonitoring(owner: string, repo: string, callback: (data: any) => void) {
    this.intervalId = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/datasource/repositories/${owner}/${repo}`
        );
        const result = await response.json();

        if (result.success) {
          callback(result.data);
        }
      } catch (error) {
        console.error("監視エラー:", error);
      }
    }, 30000); // 30秒間隔
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// 使用例
const monitor = new RepositoryMonitor();
monitor.startMonitoring("facebook", "react", (repo) => {
  console.log(`${repo.fullName}: ${repo.stargazersCount} stars`);
});
```

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
